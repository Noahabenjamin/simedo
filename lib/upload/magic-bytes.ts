// Lightweight magic-byte sniffer for molecular dynamics uploads. Reads
// the first ~32 bytes of a File and returns a verdict + reason. Not a
// full parser — just enough to catch the easy "renamed an mp3 to .pdb"
// case before we waste a Storage upload on it.

export type SniffVerdict = "ok" | "wrong-format" | "unknown";

export type SniffResult = {
  verdict: SniffVerdict;
  reason: string;
};

// PDB / mmCIF: ASCII text starting with HEADER, REMARK, ATOM, MODEL,
// data_, CRYST1, COMPND… (any record name). We accept any printable-ASCII
// prefix to dodge false negatives on hand-edited files.
async function sniffStructure(file: File): Promise<SniffResult> {
  const buf = await file.slice(0, 80).arrayBuffer();
  const bytes = new Uint8Array(buf);
  const text = new TextDecoder("ascii", { fatal: false })
    .decode(bytes)
    .trimStart();
  if (text.length === 0) {
    return { verdict: "wrong-format", reason: "File is empty." };
  }
  // Reject binary-looking content (NULs in the first 80 bytes).
  for (const b of bytes) {
    if (b === 0) {
      return {
        verdict: "wrong-format",
        reason: "Structure file looks binary — expected PDB or CIF text.",
      };
    }
  }
  const looksPdb = /^(HEADER|REMARK|ATOM|HETATM|MODEL|CRYST1|COMPND|TITLE|SEQRES|HELIX|SHEET|CONECT|END\b)/i.test(
    text,
  );
  const looksCif = /^(data_|loop_|#|_)/i.test(text);
  if (looksPdb || looksCif) {
    return { verdict: "ok", reason: "" };
  }
  return {
    verdict: "unknown",
    reason:
      "Couldn't detect a PDB or CIF header in the first 80 bytes. Uploading anyway.",
  };
}

// XTC magic: first 4 bytes of every frame are an int32 magic = 1995
// (0x000007CB) in big-endian. DCD: the first 4 bytes are a big-endian
// record length (84) followed by ASCII "CORD". TRR: same record-length
// preamble; the next 4 bytes are "GMX1". We sniff for these signatures.
async function sniffTrajectory(
  file: File,
  ext: string,
): Promise<SniffResult> {
  const buf = await file.slice(0, 32).arrayBuffer();
  const bytes = new Uint8Array(buf);
  if (bytes.length < 8) {
    return { verdict: "wrong-format", reason: "Trajectory is too short." };
  }
  const view = new DataView(buf);

  if (ext === ".xtc") {
    const magic = view.getInt32(0, false); // big-endian
    if (magic === 1995) return { verdict: "ok", reason: "" };
    return {
      verdict: "wrong-format",
      reason: "Not a real XTC file (missing the 0x000007CB magic).",
    };
  }

  if (ext === ".dcd") {
    const tag = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
    if (tag === "CORD") return { verdict: "ok", reason: "" };
    return {
      verdict: "wrong-format",
      reason: "Not a real DCD file (missing the CORD signature).",
    };
  }

  if (ext === ".trr") {
    // GROMACS TRR: first 4 bytes are big-endian record length 0x40000000
    // → 1073741824 in modern files. Older TRR files start with the GMX1
    // string a bit later. We accept either as a positive hit.
    const tag = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (tag.includes("GMX") || tag === "MTRX") {
      return { verdict: "ok", reason: "" };
    }
    return {
      verdict: "unknown",
      reason:
        "Couldn't confirm TRR signature — uploading anyway, but the viewer may reject it.",
    };
  }

  // NetCDF (.nc): "CDF\x01" or "CDF\x02"
  if (ext === ".nc") {
    const tag = String.fromCharCode(bytes[0], bytes[1], bytes[2]);
    if (tag === "CDF") return { verdict: "ok", reason: "" };
    return {
      verdict: "wrong-format",
      reason: "Not a NetCDF file (missing the CDF header).",
    };
  }

  // HDF5 (.lh5 / .h5): magic = 89 48 44 46 0D 0A 1A 0A
  if (ext === ".lh5" || ext === ".h5") {
    const ok =
      bytes[0] === 0x89 &&
      bytes[1] === 0x48 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46;
    return ok
      ? { verdict: "ok", reason: "" }
      : {
          verdict: "wrong-format",
          reason: "Not an HDF5 file (missing the 8-byte HDF5 signature).",
        };
  }

  return { verdict: "unknown", reason: "" };
}

export async function sniffFile(
  file: File,
  kind: "structure" | "trajectory",
): Promise<SniffResult> {
  if (kind === "structure") return sniffStructure(file);
  const dot = file.name.lastIndexOf(".");
  const ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : "";
  return sniffTrajectory(file, ext);
}
