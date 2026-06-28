import type {
  Simulation,
  SimulationAuthor,
  SimulationProvenance,
  SimulationTrajectory,
} from "@/types";

const thumb = (pdb: string) => `/api/thumbnail/${pdb.toLowerCase()}`;

// Stays in sync with the seed.sql team-avatar URL.
const TEAM_AVATAR_URL =
  "https://api.dicebear.com/9.x/shapes/svg?seed=helix-team&backgroundColor=0a1437&shape1Color=2563eb&shape2Color=60a5fa&shape3Color=93c5fd";

// All seed contributors collapse to the single Simedo Team avatar. The
// parameter is accepted so callers that pass a name don't need to change.
const avatar = (_seed: string): string => (void _seed, TEAM_AVATAR_URL);

const pdbUrl = (id: string) => `https://files.rcsb.org/download/${id}.pdb`;

const HELIX_TEAM: SimulationAuthor = {
  name: "Simedo Team",
  username: "helix-team",
  avatarUrl: avatar("helix-team"),
};

// Every reference simulation is attributed to a single Simedo Team
// account — no fictional researchers. Real users replace these as they
// upload their own work.
const AUTHORS = new Proxy({} as Record<string, SimulationAuthor>, {
  get: () => HELIX_TEAM,
});

// Default provenance + trajectory blocks for seed entries. Seed sims came
// from the curated reference set, not real MD runs, so we mark them as
// public_repository with no original_source_url (Phase 5: uploads adds
// these fields to Simulation; the seeds get the defaults).
const SEED_PROVENANCE: SimulationProvenance = {
  software: null,
  softwareVersion: null,
  forceFieldFull: null,
  waterModel: null,
  temperatureK: null,
  pressureBar: null,
  ph: null,
  ionicStrengthMm: null,
  lengthNs: null,
  simulationLab: "Simedo Team",
  simulationInstitution: "Simedo Reference Set",
  correspondingAuthor: "Simedo Team",
  correspondingAuthorEmail: "team@simedo.work",
  dataOrigin: "public_repository",
  originalSourceUrl: null,
  sourceDoi: null,
  uploaderVerification: "manually_verified",
};

const SEED_TRAJECTORY: SimulationTrajectory = {
  rawUrl: null,
  rawSizeMb: null,
  compressedUrl: null,
  compressedSizeMb: null,
  framesOriginal: null,
  framesStreamed: null,
  compressionMethod: null,
  processingStatus: "ready",
  processingError: null,
};

// RawSeed strips out the heavy provenance/trajectory bundles + the
// prediction fields. All mock entries are RCSB-sourced experimental
// structures, so the prediction fields collapse to safe defaults below.
type RawSeed = Omit<
  Simulation,
  | "provenance"
  | "trajectory"
  | "structureSource"
  | "uniprotId"
  | "alphafoldId"
  | "predictionMeanPlddt"
  | "predictionPaeUrl"
  | "predictionPaeMax"
  | "requestedBy"
  | "requestedByAffiliation"
  | "scientificallyReviewedBy"
  | "reviewedByAffiliation"
>;

const RAW_SEED: RawSeed[] = [
  // Globins
  {
    id: "oxy-hemoglobin-1hho",
    pdbCode: "1HHO",
    title: "Oxyhemoglobin, R state",
    description:
      "Human hemoglobin in the oxygen-bound R state. The classic structure that captures cooperative binding mid-cycle.",
    pdbUrl: pdbUrl("1HHO"),
    trajectoryUrl: null,
    hasTrajectory: false,
    thumbnailUrl: thumb("1HHO"),
    author: AUTHORS.jin,
    createdAt: "2026-05-18T09:12:00Z",
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    tags: ["oxygen-transport", "allosteric", "tetramer"],
    category: "protein",
    proteinFamily: "Globins",
    organism: "Homo sapiens",
    experimentType: "equilibrium MD",
    resolution: 2.1,
  },
  {
    id: "deoxy-hemoglobin-4hhb",
    pdbCode: "4HHB",
    title: "Deoxyhemoglobin, T state",
    description:
      "Human deoxyhemoglobin in the tense T state. Pairs naturally with 1HHO to study the allosteric switch behind cooperative oxygen binding.",
    pdbUrl: pdbUrl("4HHB"),
    trajectoryUrl: null,
    hasTrajectory: false,
    thumbnailUrl: thumb("4HHB"),
    author: AUTHORS.priya,
    createdAt: "2026-04-28T18:55:00Z",
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    tags: ["allosteric", "oxygen-transport", "tetramer"],
    category: "protein",
    proteinFamily: "Globins",
    organism: "Homo sapiens",
    experimentType: "equilibrium MD",
    resolution: 1.74,
  },
  {
    id: "myoglobin-1mbn",
    pdbCode: "1MBN",
    title: "Sperm whale myoglobin",
    description:
      "The first protein structure ever solved by X-ray crystallography (Kendrew, 1958). Still a benchmark for oxygen-storage dynamics.",
    pdbUrl: pdbUrl("1MBN"),
    trajectoryUrl: null,
    hasTrajectory: false,
    thumbnailUrl: thumb("1MBN"),
    author: AUTHORS.henrik,
    createdAt: "2026-05-02T11:20:00Z",
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    tags: ["oxygen-storage", "classic", "monomer"],
    category: "protein",
    proteinFamily: "Globins",
    organism: "Physeter macrocephalus",
    experimentType: "equilibrium MD",
    resolution: 2.0,
  },

  // GPCRs
  {
    id: "beta2-adrenergic-3sn6",
    pdbCode: "3SN6",
    title: "β2 adrenergic receptor–Gs complex",
    description:
      "β2 adrenergic receptor captured coupled to its heterotrimeric Gs partner. A landmark GPCR signaling complex.",
    pdbUrl: pdbUrl("3SN6"),
    trajectoryUrl: null,
    hasTrajectory: false,
    thumbnailUrl: thumb("3SN6"),
    author: AUTHORS.sofia,
    createdAt: "2026-05-12T15:40:00Z",
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    tags: ["signaling", "g-protein", "membrane"],
    category: "receptor",
    proteinFamily: "GPCRs",
    organism: "Homo sapiens",
    experimentType: "binding",
    resolution: 3.2,
  },
  {
    id: "rhodopsin-6cmo",
    pdbCode: "6CMO",
    title: "Bovine rhodopsin, dark state",
    description:
      "Bovine rhodopsin in its dark resting state. A cornerstone for visual-pigment activation dynamics.",
    pdbUrl: pdbUrl("6CMO"),
    trajectoryUrl: null,
    hasTrajectory: false,
    thumbnailUrl: thumb("6CMO"),
    author: AUTHORS.yuki,
    createdAt: "2026-04-22T19:10:00Z",
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    tags: ["vision", "photoreceptor", "membrane"],
    category: "receptor",
    proteinFamily: "GPCRs",
    organism: "Bos taurus",
    experimentType: "equilibrium MD",
    resolution: 3.0,
  },

  // CRISPR-Cas9
  {
    id: "cas9-4oo8",
    pdbCode: "4OO8",
    title: "CRISPR-Cas9 with sgRNA and DNA",
    description:
      "Cas9 bound to a single-guide RNA and target DNA. The complete editing complex in a cleavage-ready geometry.",
    pdbUrl: pdbUrl("4OO8"),
    trajectoryUrl: null,
    hasTrajectory: false,
    thumbnailUrl: thumb("4OO8"),
    author: AUTHORS.marcus,
    createdAt: "2026-05-15T08:30:00Z",
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    tags: ["genome-editing", "rna", "dna-cleavage"],
    category: "enzyme",
    proteinFamily: "CRISPR-Cas9",
    organism: "Streptococcus pyogenes",
    experimentType: "equilibrium MD",
    resolution: 2.5,
  },

  // Immunoglobulins
  {
    id: "igg-1igt",
    pdbCode: "1IGT",
    title: "Intact mouse IgG2a antibody",
    description:
      "One of the few full-length immunoglobulin structures available — hinges, Fab arms, and Fc all resolved.",
    pdbUrl: pdbUrl("1IGT"),
    trajectoryUrl: null,
    hasTrajectory: false,
    thumbnailUrl: thumb("1IGT"),
    author: AUTHORS.elena,
    createdAt: "2026-04-09T13:45:00Z",
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    tags: ["immunology", "y-shape", "hinge"],
    category: "antibody",
    proteinFamily: "Immunoglobulins",
    organism: "Mus musculus",
    experimentType: "equilibrium MD",
    resolution: 2.8,
  },

  // Kinases
  {
    id: "pka-1atp",
    pdbCode: "1ATP",
    title: "Protein kinase A, catalytic subunit",
    description:
      "PKA catalytic subunit bound to ATP and substrate peptide — the textbook reference structure for protein kinases.",
    pdbUrl: pdbUrl("1ATP"),
    trajectoryUrl: null,
    hasTrajectory: false,
    thumbnailUrl: thumb("1ATP"),
    author: AUTHORS.daniel,
    createdAt: "2026-03-30T10:15:00Z",
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    tags: ["phosphorylation", "signaling", "atp-binding"],
    category: "enzyme",
    proteinFamily: "Kinases",
    organism: "Mus musculus",
    experimentType: "equilibrium MD",
    resolution: 2.2,
  },
  {
    id: "src-kinase-2src",
    pdbCode: "2SRC",
    title: "Src tyrosine kinase, autoinhibited",
    description:
      "Src tyrosine kinase in its closed, autoinhibited conformation — the regulatory baseline that activation has to overcome.",
    pdbUrl: pdbUrl("2SRC"),
    trajectoryUrl: null,
    hasTrajectory: false,
    thumbnailUrl: thumb("2SRC"),
    author: AUTHORS.anya,
    createdAt: "2026-04-04T17:25:00Z",
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    tags: ["autoinhibition", "tyrosine-kinase", "regulation"],
    category: "enzyme",
    proteinFamily: "Kinases",
    organism: "Homo sapiens",
    experimentType: "equilibrium MD",
    resolution: 1.5,
  },

  // Lysozymes
  {
    id: "lysozyme-1aki",
    pdbCode: "1AKI",
    title: "Hen egg-white lysozyme",
    description:
      "Classic 129-residue enzyme that cleaves bacterial cell walls. A long-standing benchmark for force-field validation and protein dynamics.",
    pdbUrl: pdbUrl("1AKI"),
    trajectoryUrl: null,
    hasTrajectory: false,
    thumbnailUrl: thumb("1AKI"),
    author: AUTHORS.mira,
    createdAt: "2026-05-20T14:30:00Z",
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    tags: ["enzyme", "benchmark", "protein"],
    category: "enzyme",
    proteinFamily: "Lysozymes",
    organism: "Gallus gallus",
    experimentType: "equilibrium MD",
    resolution: 1.5,
  },

  // Kunitz inhibitors
  {
    id: "bpti-4pti",
    pdbCode: "4PTI",
    title: "Bovine pancreatic trypsin inhibitor (BPTI)",
    description:
      "Small, exceptionally stable Kunitz-domain inhibitor of serine proteases — one of the most thoroughly studied proteins in biophysics.",
    pdbUrl: pdbUrl("4PTI"),
    trajectoryUrl: null,
    hasTrajectory: false,
    thumbnailUrl: thumb("4PTI"),
    author: AUTHORS.lukas,
    createdAt: "2026-02-26T09:00:00Z",
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    tags: ["folding-benchmark", "inhibitor", "small"],
    category: "protein",
    proteinFamily: "Kunitz inhibitors",
    organism: "Bos taurus",
    experimentType: "folding",
    resolution: 1.0,
  },

  // DNA
  {
    id: "b-dna-1bna",
    pdbCode: "1BNA",
    title: "Drew–Dickerson B-DNA dodecamer",
    description:
      "Twelve base pairs of canonical B-form DNA — the dodecamer that defined our picture of double-helix geometry.",
    pdbUrl: pdbUrl("1BNA"),
    trajectoryUrl: null,
    hasTrajectory: false,
    thumbnailUrl: thumb("1BNA"),
    author: AUTHORS.henrik,
    createdAt: "2026-05-10T11:05:00Z",
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    tags: ["DNA", "nucleic-acid", "helix"],
    category: "dna",
    organism: "synthetic",
    experimentType: "equilibrium MD",
    resolution: 1.9,
  },

  // Aquaporins / membranes
  {
    id: "aquaporin-2nwl",
    pdbCode: "2NWL",
    title: "Spinach aquaporin SoPIP2;1",
    description:
      "A tetrameric water channel embedded in a plant plasma membrane. Each monomer gates water flow through a narrow selectivity filter.",
    pdbUrl: pdbUrl("2NWL"),
    trajectoryUrl: null,
    hasTrajectory: false,
    thumbnailUrl: thumb("2NWL"),
    author: AUTHORS.aisha,
    createdAt: "2026-03-12T16:00:00Z",
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    tags: ["water-channel", "tetramer", "membrane-protein"],
    category: "membrane",
    proteinFamily: "Aquaporins",
    organism: "Spinacia oleracea",
    experimentType: "equilibrium MD",
    resolution: 1.9,
  },

  // Coronavirus spike
  {
    id: "spike-6vxx",
    pdbCode: "6VXX",
    title: "SARS-CoV-2 spike, closed prefusion",
    description:
      "Closed-trimer prefusion conformation of the spike glycoprotein. The starting state for receptor-binding-domain opening dynamics.",
    pdbUrl: pdbUrl("6VXX"),
    trajectoryUrl: null,
    hasTrajectory: false,
    thumbnailUrl: thumb("6VXX"),
    author: AUTHORS.sofia,
    createdAt: "2026-05-15T22:40:00Z",
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    tags: ["virus", "spike", "drug-target"],
    category: "protein",
    proteinFamily: "Coronavirus spike",
    organism: "SARS-CoV-2",
    experimentType: "equilibrium MD",
    resolution: 2.8,
  },

  // Ubiquitin — NMR ensemble for real model-to-model motion
  {
    id: "ubiquitin-1ubq",
    pdbCode: "1D3Z",
    title: "Ubiquitin NMR ensemble",
    description:
      "Ten NMR-derived conformers of human ubiquitin. Animating between models reveals real backbone-loop flexibility on the 76-residue β-grasp fold.",
    pdbUrl: pdbUrl("1D3Z"),
    trajectoryUrl: null,
    hasTrajectory: true,
    thumbnailUrl: thumb("1D3Z"),
    author: AUTHORS.lukas,
    createdAt: "2026-02-08T16:45:00Z",
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    tags: ["signaling", "small-protein", "fold"],
    category: "protein",
    proteinFamily: "Ubiquitin",
    organism: "Homo sapiens",
    experimentType: "folding",
  },

  // Crambin
  {
    id: "crambin-1crn",
    pdbCode: "1CRN",
    title: "Crambin",
    description:
      "A 46-residue plant protein resolved at sub-ångström resolution. A tiny but exceptionally well-resolved benchmark for force fields.",
    pdbUrl: pdbUrl("1CRN"),
    trajectoryUrl: null,
    hasTrajectory: false,
    thumbnailUrl: thumb("1CRN"),
    author: AUTHORS.daniel,
    createdAt: "2026-04-15T13:20:00Z",
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    tags: ["plant-protein", "benchmark", "small"],
    category: "protein",
    organism: "Crambe abyssinica",
    experimentType: "folding",
    resolution: 0.54,
  },

  // Histones
  {
    id: "nucleosome-1kx5",
    pdbCode: "1KX5",
    title: "Nucleosome core particle",
    description:
      "147 base pairs of DNA wrapped around a histone octamer (two copies of H2A, H2B, H3, H4). The fundamental unit of chromatin.",
    pdbUrl: pdbUrl("1KX5"),
    trajectoryUrl: null,
    hasTrajectory: false,
    thumbnailUrl: thumb("1KX5"),
    author: AUTHORS.elena,
    createdAt: "2026-03-05T10:50:00Z",
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    tags: ["chromatin", "dna-binding", "octamer"],
    category: "protein",
    proteinFamily: "Histones",
    organism: "Xenopus laevis",
    experimentType: "equilibrium MD",
    resolution: 1.9,
  },
];

export const mockSimulations: Simulation[] = RAW_SEED.map((s) => ({
  ...s,
  provenance: { ...SEED_PROVENANCE },
  trajectory: { ...SEED_TRAJECTORY },
  structureSource: "experimental-xray",
  uniprotId: null,
  alphafoldId: null,
  predictionMeanPlddt: null,
  predictionPaeUrl: null,
  predictionPaeMax: null,
  requestedBy: null,
  requestedByAffiliation: null,
  scientificallyReviewedBy: null,
  reviewedByAffiliation: null,
}));

export function getSimulation(id: string): Simulation | undefined {
  return mockSimulations.find((s) => s.id === id);
}

export function getSimulationsByFamily(family: string): Simulation[] {
  return mockSimulations.filter((s) => s.proteinFamily === family);
}

export function getRelatedSimulations(
  sim: Simulation,
  count = 3,
): Simulation[] {
  const all = mockSimulations.filter((s) => s.id !== sim.id);
  if (sim.proteinFamily) {
    const sameFamily = all.filter((s) => s.proteinFamily === sim.proteinFamily);
    if (sameFamily.length >= count) return sameFamily.slice(0, count);
    // Top up with same-category sims if family doesn't have enough.
    const sameCategory = all.filter(
      (s) => s.category === sim.category && s.proteinFamily !== sim.proteinFamily,
    );
    return [...sameFamily, ...sameCategory].slice(0, count);
  }
  return all.filter((s) => s.category === sim.category).slice(0, count);
}
