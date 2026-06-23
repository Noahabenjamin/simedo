"use client";

import { useEffect, useRef, useState } from "react";

// AlphaFold DB v6 PAE JSON shape: [{ predicted_aligned_error: [[…]],
// max_predicted_aligned_error: number }]. AlphaFold 3 sometimes uses
// the top-level "pae" key — both are handled below.
type PaeJsonShape =
  | Array<{
      predicted_aligned_error: number[][];
      max_predicted_aligned_error?: number;
    }>
  | { pae: number[][]; max?: number }
  | { predicted_aligned_error: number[][]; max_predicted_aligned_error?: number };

function extractMatrix(
  raw: PaeJsonShape,
): { matrix: number[][]; max: number } | null {
  let matrix: number[][] | undefined;
  let max: number | undefined;
  if (Array.isArray(raw) && raw[0]) {
    matrix = raw[0].predicted_aligned_error;
    max = raw[0].max_predicted_aligned_error;
  } else if ("predicted_aligned_error" in raw) {
    matrix = raw.predicted_aligned_error;
    max = raw.max_predicted_aligned_error;
  } else if ("pae" in raw) {
    matrix = raw.pae;
    max = raw.max;
  }
  if (!matrix || matrix.length === 0) return null;
  let inferredMax = max ?? 0;
  if (!max) {
    for (const row of matrix) {
      for (const v of row) if (v > inferredMax) inferredMax = v;
    }
  }
  return { matrix, max: inferredMax || 31.75 };
}

// Green (low error, confident) → red (high error, unreliable). The AF
// reference colors run greens at low PAE and reds at high; we interpolate
// between three stops to match the look users will recognise.
function paeColor(value: number, max: number): [number, number, number] {
  const t = Math.max(0, Math.min(1, value / max));
  // 0 → deep green, 0.5 → pale yellow-green, 1 → deep red.
  if (t < 0.5) {
    const k = t * 2;
    return [
      Math.round(15 + (245 - 15) * k),
      Math.round(118 + (238 - 118) * k),
      Math.round(86 + (170 - 86) * k),
    ];
  }
  const k = (t - 0.5) * 2;
  return [
    Math.round(245 + (190 - 245) * k),
    Math.round(238 + (24 - 238) * k),
    Math.round(170 + (24 - 170) * k),
  ];
}

type Props = {
  url: string;
  size?: number;
};

export function PaeHeatmap({ url, size = 300 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<
    { status: "loading" }
    | { status: "ready"; n: number; max: number }
    | { status: "error"; message: string }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = (await res.json()) as PaeJsonShape;
        const parsed = extractMatrix(raw);
        if (!parsed) throw new Error("PAE JSON did not contain a matrix");
        if (cancelled) return;

        const { matrix, max } = parsed;
        const n = matrix.length;
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = n;
        canvas.height = n;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const img = ctx.createImageData(n, n);
        for (let i = 0; i < n; i++) {
          const row = matrix[i];
          for (let j = 0; j < n; j++) {
            const [r, g, b] = paeColor(row[j], max);
            const idx = (i * n + j) * 4;
            img.data[idx] = r;
            img.data[idx + 1] = g;
            img.data[idx + 2] = b;
            img.data[idx + 3] = 255;
          }
        }
        ctx.putImageData(img, 0, 0);
        setState({ status: "ready", n, max });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Failed to load";
        setState({ status: "error", message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Predicted aligned error
        </h3>
        {state.status === "ready" && (
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
            {state.n}×{state.n} residues · 0 to {state.max.toFixed(1)} Å
          </span>
        )}
      </div>

      <div
        className="relative overflow-hidden rounded-md border border-border bg-background"
        style={{ width: size, height: size }}
      >
        <canvas
          ref={canvasRef}
          className="block h-full w-full"
          style={{ imageRendering: "pixelated" }}
          aria-label="Predicted aligned error heatmap"
        />
        {state.status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            Loading PAE…
          </div>
        )}
        {state.status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs text-muted-foreground">
            Couldn&apos;t load PAE plot ({state.message}).
          </div>
        )}
      </div>

      <p className="max-w-[300px] text-[11px] leading-snug text-muted-foreground">
        Each cell is AlphaFold&apos;s expected error (Å) when residue X is
        aligned to residue Y. Green = confident relative position; red =
        unreliable. Off-diagonal greens mark rigid domains; red blocks mark
        flexible linkers between them.
      </p>
    </div>
  );
}
