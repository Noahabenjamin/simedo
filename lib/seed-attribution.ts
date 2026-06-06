// Detect "this is a seed sim curated from PDB" vs "real user upload".
// Seed sims have one of the known curator usernames as the author. For
// those, the UI shows "Curated from RCSB PDB <code>" instead of an
// author chip + fake engagement counts.

const SEED_USERNAMES = new Set<string>([
  "helix-team",
  // Pre-rebrand fictional contributors. The reattribution migration
  // points future seeds at helix-team, but prod still has these in the
  // simulations row until the migration is applied.
  "miraokafor",
  "jtanaka",
  "svargas",
  "hnilsson",
  "piyer",
  "dcohen",
  "amwangi",
  "lbecker",
  "apetrova",
  "madebayo",
  "ysato",
  "erossi",
]);

export function isSeedAuthor(username: string | null | undefined): boolean {
  if (!username) return false;
  return SEED_USERNAMES.has(username.toLowerCase());
}

export function rcsbStructureUrl(pdbCode: string): string {
  return `https://www.rcsb.org/structure/${pdbCode.toUpperCase()}`;
}
