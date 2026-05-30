// Hand-crafted Adenine + Thymine base pair geometry. Coordinates are in
// the scene's "scene units" (where the DNA helix radius is 1.0), not in
// real Ångströms. They're chosen so that the fused 6+5 ring of adenine
// and the 6 ring of thymine fit between the two backbones, with the
// Watson-Crick face of each ring meeting at the base pair center.
//
// The y axis aligns with the DNA helix axis. The base pair lies flat in
// the xz plane (y ≈ 0 in the local frame; we translate to TARGET_BP_Y
// before placing into the scene).
//
// We don't aim for PDB-perfect coordinates — we aim for *legible*
// chemistry: visible ring shapes, an exocyclic amine on A, two
// carbonyls and a methyl on T, two H-bonds meeting in the middle.

import { Vector3 } from "three";
import { TARGET_BP_Y } from "./hero-sequence-config";

export type Element = "C" | "N" | "O" | "P" | "H";

export type Atom = {
  id: string;
  element: Element;
  pos: Vector3;
};

// CPK-inspired palette, retuned for the cool/blue scene aesthetic so
// nitrogen reads cooler and oxygen pops warm enough to be recognised as
// a chemistry hint without breaking the blue scheme.
export const ATOM_COLORS: Record<Element, string> = {
  C: "#CBD5E1", // light slate — reads as "structural carbon"
  N: "#60A5FA", // sky / mid blue — matches helix palette
  O: "#FB923C", // warm orange — recognisable carbonyl
  P: "#FBBF24", // amber — for phosphate, when shown
  H: "#FFFFFF",
};

// Van-der-Waals-ish radii, tuned for ball-and-stick legibility (not
// space-filling).
export const ATOM_RADII: Record<Element, number> = {
  C: 0.072,
  N: 0.078,
  O: 0.074,
  P: 0.088,
  H: 0.05,
};

export const BOND_COLOR = "#94A3B8";
export const HBOND_COLOR = "#7DD3FC";

// Re-export the target y for convenience.
export { TARGET_BP_Y };
export const TARGET_WORLD: [number, number, number] = [0, TARGET_BP_Y, 0];

// --- Adenine atom positions (local xz plane) ---
//
// 6-ring centered at (+0.30, 0), edge ≈ 0.13. N1 faces T (-x side).
// Pentagon fused on C4-C5 extends out to +x. N6 exocyclic on C6 points
// up-left toward T.

const adenineAtoms: Atom[] = [
  // 6-membered ring
  { id: "A:N1", element: "N", pos: new Vector3(0.170, 0, 0.000) },
  { id: "A:C2", element: "C", pos: new Vector3(0.235, 0, -0.113) },
  { id: "A:N3", element: "N", pos: new Vector3(0.365, 0, -0.113) },
  { id: "A:C4", element: "C", pos: new Vector3(0.430, 0, 0.000) },
  { id: "A:C5", element: "C", pos: new Vector3(0.365, 0, 0.113) },
  { id: "A:C6", element: "C", pos: new Vector3(0.235, 0, 0.113) },
  // Exocyclic amine on C6 (Watson-Crick H-bond donor)
  { id: "A:N6", element: "N", pos: new Vector3(0.170, 0, 0.226) },
  // 5-membered ring fused on C4-C5
  { id: "A:N7", element: "N", pos: new Vector3(0.451, 0, 0.210) },
  { id: "A:C8", element: "C", pos: new Vector3(0.571, 0, 0.158) },
  { id: "A:N9", element: "N", pos: new Vector3(0.558, 0, 0.029) },
];

// --- Thymine atom positions (local xz plane) ---
//
// 6-ring centered at (-0.30, 0). C4 faces A (+x side), with O4 stretching
// further +x as the H-bond acceptor. N3-H sits adjacent and faces A's N1.
// O2 is the second carbonyl on the back side; methyl on C5 points up.
const thymineAtoms: Atom[] = [
  { id: "T:C4", element: "C", pos: new Vector3(-0.113, 0, 0.000) },
  { id: "T:C5", element: "C", pos: new Vector3(-0.178, 0, 0.113) },
  { id: "T:C6", element: "C", pos: new Vector3(-0.308, 0, 0.113) },
  { id: "T:N1", element: "N", pos: new Vector3(-0.373, 0, 0.000) },
  { id: "T:C2", element: "C", pos: new Vector3(-0.308, 0, -0.113) },
  { id: "T:N3", element: "N", pos: new Vector3(-0.178, 0, -0.113) },
  // Exocyclics
  { id: "T:O4", element: "O", pos: new Vector3(0.017, 0, 0.000) },
  { id: "T:O2", element: "O", pos: new Vector3(-0.373, 0, -0.226) },
  { id: "T:C7", element: "C", pos: new Vector3(-0.113, 0, 0.226) }, // methyl
];

// --- Bonds (covalent) ---
//
// Each entry is a pair of atom ids. Order matters for orientation but
// not visually — bond cylinders are symmetric.
const adenineBonds: [string, string][] = [
  ["A:N1", "A:C2"],
  ["A:C2", "A:N3"],
  ["A:N3", "A:C4"],
  ["A:C4", "A:C5"],
  ["A:C5", "A:C6"],
  ["A:C6", "A:N1"],
  ["A:C6", "A:N6"],
  ["A:C5", "A:N7"],
  ["A:N7", "A:C8"],
  ["A:C8", "A:N9"],
  ["A:N9", "A:C4"],
];

const thymineBonds: [string, string][] = [
  ["T:N1", "T:C2"],
  ["T:C2", "T:N3"],
  ["T:N3", "T:C4"],
  ["T:C4", "T:C5"],
  ["T:C5", "T:C6"],
  ["T:C6", "T:N1"],
  ["T:C2", "T:O2"],
  ["T:C4", "T:O4"],
  ["T:C5", "T:C7"], // methyl
];

// --- Hydrogen bonds (visual hints between the two molecules) ---
const hBonds: [string, string][] = [
  ["A:N1", "T:N3"],
  ["A:N6", "T:O4"],
];

export type BondPair = [Vector3, Vector3];

// Assemble: returns flat arrays of atoms (with ids preserved as index keys)
// and bond pairs in world-local coords (local to the base pair group).
export type BasePairGeometry = {
  atoms: Atom[];
  bonds: BondPair[];
  hBonds: BondPair[];
};

export function buildAdenineThymine(): BasePairGeometry {
  const atoms = [...adenineAtoms, ...thymineAtoms];
  const byId = new Map(atoms.map((a) => [a.id, a.pos] as const));

  const resolve = (pair: [string, string]): BondPair => {
    const p1 = byId.get(pair[0]);
    const p2 = byId.get(pair[1]);
    if (!p1 || !p2) {
      throw new Error(`Unknown atom in bond: ${pair[0]} or ${pair[1]}`);
    }
    return [p1, p2];
  };

  const bonds = [...adenineBonds, ...thymineBonds].map(resolve);
  const hBondPairs = hBonds.map(resolve);

  return { atoms, bonds, hBonds: hBondPairs };
}
