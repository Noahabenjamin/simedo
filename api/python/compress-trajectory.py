"""Trajectory compressor — runs on Vercel's Python runtime.

POST /api/python/compress-trajectory
    body: {"simulation_id": "...", "r2_key": "...", "structure_url": "..."}

Reads the raw trajectory from R2, downsamples to ~500 frames, writes the
result back to R2 as a multi-model PDB (small enough to stream, and NGL
plays it directly as an NMR-style ensemble), then updates the Supabase
row with the streamed URL, frame counts, and compression method.

Failure modes are non-fatal: the row is left in 'failed' with an error
message, and the viewer keeps working via the raw R2 file.
"""

from __future__ import annotations

import io
import json
import os
import sys
import tempfile
import traceback
from http.server import BaseHTTPRequestHandler
from typing import Any
from urllib import request as urlrequest

import boto3
import MDAnalysis as mda  # MDAnalysis
import numpy as np

# Target frame count for the streamed preview. 500 frames at 24 fps is
# ~20 s of playback — enough to read protein motion, small enough to
# move quickly even over a flaky connection.
TARGET_FRAMES = 500

# Vercel limits: 256 MB memory on Hobby / 1 GB on Pro. We cap atoms × frames
# so a runaway upload doesn't OOM the function.
MAX_ATOMS_X_FRAMES = 50_000_000


def _resp(handler: "BaseHTTPRequestHandler", code: int, body: dict[str, Any]) -> None:
    payload = json.dumps(body).encode()
    handler.send_response(code)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(payload)))
    handler.end_headers()
    handler.wfile.write(payload)


def _r2_client():
    account = os.environ["R2_ACCOUNT_ID"]
    return boto3.client(
        "s3",
        endpoint_url=f"https://{account}.r2.cloudflarestorage.com",
        aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
        region_name="auto",
    )


def _public_r2_url(key: str) -> str:
    base = os.environ["R2_PUBLIC_URL"].rstrip("/")
    return f"{base}/{key}"


def _supabase_update(simulation_id: str, fields: dict[str, Any]) -> None:
    """PATCH the row via PostgREST. Service role key bypasses RLS."""
    url = os.environ["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
    service_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    endpoint = f"{url}/rest/v1/simulations?id=eq.{simulation_id}"
    req = urlrequest.Request(
        endpoint,
        data=json.dumps(fields).encode(),
        method="PATCH",
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
    )
    with urlrequest.urlopen(req, timeout=10) as resp:  # noqa: S310
        resp.read()


def _download_structure(structure_url: str, dst_path: str) -> None:
    """RCSB URLs are public; storage://, signed Supabase URLs, and R2
    public URLs all work as plain GETs because they're handed back to
    us already-signed by getSimulation()."""
    with urlrequest.urlopen(structure_url, timeout=30) as r:  # noqa: S310
        with open(dst_path, "wb") as f:
            f.write(r.read())


def _process(simulation_id: str, r2_key: str, structure_url: str) -> dict[str, Any]:
    bucket = os.environ.get("R2_BUCKET", "helix-trajectories")
    client = _r2_client()

    with tempfile.TemporaryDirectory() as tmp:
        # 1) Pull the raw trajectory + structure to /tmp.
        raw_path = os.path.join(tmp, "raw" + os.path.splitext(r2_key)[1])
        pdb_path = os.path.join(tmp, "structure.pdb")
        client.download_file(bucket, r2_key, raw_path)
        _download_structure(structure_url, pdb_path)

        # 2) Parse with MDAnalysis.
        u = mda.Universe(pdb_path, raw_path)
        n_atoms = u.atoms.n_atoms
        n_frames = u.trajectory.n_frames
        if n_frames == 0:
            raise RuntimeError("Trajectory contained zero frames.")
        if n_atoms * n_frames > MAX_ATOMS_X_FRAMES:
            raise RuntimeError(
                f"Trajectory too large for the streamed-preview pipeline "
                f"({n_atoms} atoms × {n_frames} frames)."
            )

        # 3) Pick every Nth frame to hit TARGET_FRAMES.
        target = min(TARGET_FRAMES, n_frames)
        stride = max(1, n_frames // target)
        keep = list(range(0, n_frames, stride))[:target]

        # 4) Write the downsampled trajectory back as a multi-model PDB.
        #     NGL treats a multi-model PDB as an NMR ensemble and animates
        #     it directly — no custom loader needed in the viewer.
        out = io.StringIO()
        atoms = u.atoms
        for model_index, ts in enumerate(u.trajectory[keep]):
            out.write(f"MODEL{model_index + 1:>9d}\n")
            atoms.write(out, file_format="PDB", remarks=False)
            out.write("ENDMDL\n")
        compressed_bytes = out.getvalue().encode()

        # 5) Upload back to R2.
        compressed_key = f"trajectories/{simulation_id}/streamed/preview.pdb"
        client.put_object(
            Bucket=bucket,
            Key=compressed_key,
            Body=compressed_bytes,
            ContentType="chemical/x-pdb",
        )

        compressed_url = _public_r2_url(compressed_key)
        compressed_size_mb = round(len(compressed_bytes) / (1024 * 1024), 2)

        # 6) Mark the row ready.
        _supabase_update(
            simulation_id,
            {
                "compressed_trajectory_url": compressed_url,
                "compressed_trajectory_size_mb": compressed_size_mb,
                "frames_original": int(n_frames),
                "frames_streamed": int(len(keep)),
                "compression_method": "downsample",
                "processing_status": "ready",
                "processing_error": None,
            },
        )

        return {
            "ok": True,
            "frames_original": int(n_frames),
            "frames_streamed": int(len(keep)),
            "compressed_size_mb": compressed_size_mb,
        }


class handler(BaseHTTPRequestHandler):  # noqa: N801 — Vercel convention
    def do_POST(self) -> None:  # noqa: N802
        try:
            length = int(self.headers.get("Content-Length", "0"))
            body = json.loads(self.rfile.read(length) or b"{}")
            sim_id = body.get("simulation_id")
            r2_key = body.get("r2_key")
            structure_url = body.get("structure_url")
            if not (sim_id and r2_key and structure_url):
                return _resp(self, 400, {"ok": False, "error": "missing fields"})
        except Exception as e:
            return _resp(self, 400, {"ok": False, "error": f"bad request: {e}"})

        try:
            result = _process(sim_id, r2_key, structure_url)
            return _resp(self, 200, result)
        except Exception as e:
            tb = "".join(traceback.format_exception(type(e), e, e.__traceback__))
            print(tb, file=sys.stderr)
            try:
                _supabase_update(
                    sim_id,
                    {
                        "processing_status": "failed",
                        "processing_error": str(e)[:500],
                    },
                )
            except Exception:
                pass
            return _resp(self, 500, {"ok": False, "error": str(e)})
