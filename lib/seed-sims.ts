// Canonical list of reference simulations for the Simedo Team account.
// Used by both the schema migration and the /api/admin/reseed route so
// a future read of this file is the single source of truth.
//
// Every PDB code in this file was verified to return HTTP 200 from
// https://files.rcsb.org/download/<code>.pdb before being committed.
// NMR ensembles (multi-model PDBs) are flagged via the NMR_PDBS set so
// the viewer's existing model-to-model playback path triggers
// automatically.

export type SeedSim = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  // pdb_code is null for AlphaFold-sourced entries (UniProt IDs are 6 chars
  // and don't fit the 4-character constraint on pdb_code).
  pdb_code: string | null;
  pdb_url: string;
  thumbnail_url: string | null;
  category:
    | "protein"
    | "dna"
    | "rna"
    | "membrane"
    | "drug-complex"
    | "enzyme"
    | "antibody"
    | "receptor";
  protein_family: string | null;
  organism: string;
  experiment_type:
    | "equilibrium"
    | "steered"
    | "free-energy"
    | "binding"
    | "folding";
  resolution: number | null;
  license: "cc-by" | "cc-by-sa" | "cc0" | "all-rights-reserved";
  visibility: "public" | "unlisted" | "private";
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  // Structure provenance (added 2026-06-23). RCSB entries default to
  // 'experimental-xray'; AlphaFold entries set the AF fields below.
  structure_source:
    | "experimental-xray"
    | "experimental-nmr"
    | "experimental-cryoem"
    | "alphafold2"
    | "alphafold3"
    | "rosetta"
    | "other-prediction";
  prediction_confidence: number | null;
  prediction_pae_url: string | null;
};

// Stays in sync with seed.sql + the rebrand migration.
export const SEED_TEAM_USER_ID = "00000000-0000-0000-0000-000000000001";

export const NMR_PDBS = new Set(["1D3Z", "1L2Y", "1G6J", "1NYB"]);

type Input = Omit<
  SeedSim,
  | "user_id"
  | "pdb_url"
  | "thumbnail_url"
  | "license"
  | "visibility"
  | "view_count"
  | "like_count"
  | "comment_count"
  | "updated_at"
  | "structure_source"
  | "prediction_confidence"
  | "prediction_pae_url"
> & {
  // pdb_code is required for the RCSB helper, since the URL is derived
  // from it. AlphaFold entries go through af() instead.
  pdb_code: string;
};

function s(i: Input): SeedSim {
  return {
    ...i,
    user_id: SEED_TEAM_USER_ID,
    pdb_url: `https://files.rcsb.org/download/${i.pdb_code}.pdb`,
    thumbnail_url: null,
    license: "cc-by",
    visibility: "public",
    view_count: 0,
    like_count: 0,
    comment_count: 0,
    updated_at: i.created_at,
    structure_source: "experimental-xray",
    prediction_confidence: null,
    prediction_pae_url: null,
  };
}

// AlphaFold DB helper. We hardcode v6 (the current public release) since
// every URL on alphafold.ebi.ac.uk is versioned and that's the version
// matching the mean pLDDT we record here.
type AfInput = Omit<
  Input,
  "pdb_code"
> & {
  uniprot_id: string;       // e.g. "Q9UBX2" — used to build the AF URLs
  mean_plddt: number;       // 0-100, fetched once from the AlphaFold API
};

function af(i: AfInput): SeedSim {
  const { uniprot_id, mean_plddt, ...rest } = i;
  return {
    ...rest,
    pdb_code: null,
    user_id: SEED_TEAM_USER_ID,
    pdb_url: `https://alphafold.ebi.ac.uk/files/AF-${uniprot_id}-F1-model_v6.pdb`,
    thumbnail_url: null,
    license: "cc-by",
    visibility: "public",
    view_count: 0,
    like_count: 0,
    comment_count: 0,
    updated_at: i.created_at,
    structure_source: "alphafold2",
    prediction_confidence: mean_plddt,
    prediction_pae_url: `https://alphafold.ebi.ac.uk/files/AF-${uniprot_id}-F1-predicted_aligned_error_v6.json`,
  };
}

export const SEED_SIMS: SeedSim[] = [
  // ─── Original 17 reference sims ────────────────────────────────────────
  s({
    id: "11111111-0000-0000-0000-000000000001",
    title: "Oxyhemoglobin, R state",
    description:
      "Human hemoglobin in the oxygen-bound R state. The classic structure that captures cooperative binding mid-cycle.",
    pdb_code: "1HHO",
    category: "protein",
    protein_family: "Globins",
    organism: "Homo sapiens",
    experiment_type: "equilibrium",
    resolution: 2.1,
    created_at: "2026-05-18T09:12:00Z",
  }),
  s({
    id: "11111111-0000-0000-0000-000000000002",
    title: "Deoxyhemoglobin, T state",
    description:
      "Human deoxyhemoglobin in the tense T state. Pairs naturally with 1HHO to study the allosteric switch behind cooperative oxygen binding.",
    pdb_code: "4HHB",
    category: "protein",
    protein_family: "Globins",
    organism: "Homo sapiens",
    experiment_type: "equilibrium",
    resolution: 1.74,
    created_at: "2026-04-28T18:55:00Z",
  }),
  s({
    id: "11111111-0000-0000-0000-000000000003",
    title: "Sperm whale myoglobin",
    description:
      "The first protein structure ever solved by X-ray crystallography (Kendrew, 1958). Still a benchmark for oxygen-storage dynamics.",
    pdb_code: "1MBN",
    category: "protein",
    protein_family: "Globins",
    organism: "Physeter macrocephalus",
    experiment_type: "equilibrium",
    resolution: 2.0,
    created_at: "2026-05-02T11:20:00Z",
  }),
  s({
    id: "11111111-0000-0000-0000-000000000004",
    title: "β2 adrenergic receptor–Gs complex",
    description:
      "β2 adrenergic receptor captured coupled to its heterotrimeric Gs partner. A landmark GPCR signaling complex.",
    pdb_code: "3SN6",
    category: "receptor",
    protein_family: "GPCRs",
    organism: "Homo sapiens",
    experiment_type: "binding",
    resolution: 3.2,
    created_at: "2026-05-12T15:40:00Z",
  }),
  s({
    id: "11111111-0000-0000-0000-000000000005",
    title: "Bovine rhodopsin, dark state",
    description:
      "Bovine rhodopsin in its dark resting state. A cornerstone for visual-pigment activation dynamics.",
    pdb_code: "6CMO",
    category: "receptor",
    protein_family: "GPCRs",
    organism: "Bos taurus",
    experiment_type: "equilibrium",
    resolution: 3.0,
    created_at: "2026-04-22T19:10:00Z",
  }),
  s({
    id: "11111111-0000-0000-0000-000000000006",
    title: "CRISPR-Cas9 with sgRNA and DNA",
    description:
      "Cas9 bound to a single-guide RNA and target DNA. The complete editing complex in a cleavage-ready geometry.",
    pdb_code: "4OO8",
    category: "enzyme",
    protein_family: "CRISPR-Cas9",
    organism: "Streptococcus pyogenes",
    experiment_type: "equilibrium",
    resolution: 2.5,
    created_at: "2026-05-15T08:30:00Z",
  }),
  s({
    id: "11111111-0000-0000-0000-000000000007",
    title: "Intact mouse IgG2a antibody",
    description:
      "One of the few full-length immunoglobulin structures available — hinges, Fab arms, and Fc all resolved.",
    pdb_code: "1IGT",
    category: "antibody",
    protein_family: "Immunoglobulins",
    organism: "Mus musculus",
    experiment_type: "equilibrium",
    resolution: 2.8,
    created_at: "2026-04-09T13:45:00Z",
  }),
  s({
    id: "11111111-0000-0000-0000-000000000008",
    title: "Protein kinase A, catalytic subunit",
    description:
      "PKA catalytic subunit bound to ATP and substrate peptide — the textbook reference structure for protein kinases.",
    pdb_code: "1ATP",
    category: "enzyme",
    protein_family: "Kinases",
    organism: "Mus musculus",
    experiment_type: "equilibrium",
    resolution: 2.2,
    created_at: "2026-03-30T10:15:00Z",
  }),
  s({
    id: "11111111-0000-0000-0000-000000000009",
    title: "Src tyrosine kinase, autoinhibited",
    description:
      "Src tyrosine kinase in its closed, autoinhibited conformation — the regulatory baseline that activation has to overcome.",
    pdb_code: "2SRC",
    category: "enzyme",
    protein_family: "Kinases",
    organism: "Homo sapiens",
    experiment_type: "equilibrium",
    resolution: 1.5,
    created_at: "2026-04-04T17:25:00Z",
  }),
  s({
    id: "11111111-0000-0000-0000-00000000000a",
    title: "Hen egg-white lysozyme",
    description:
      "Classic 129-residue enzyme that cleaves bacterial cell walls. A long-standing benchmark for force-field validation and protein dynamics.",
    pdb_code: "1AKI",
    category: "enzyme",
    protein_family: "Lysozymes",
    organism: "Gallus gallus",
    experiment_type: "equilibrium",
    resolution: 1.5,
    created_at: "2026-05-20T14:30:00Z",
  }),
  s({
    id: "11111111-0000-0000-0000-00000000000b",
    title: "Bovine pancreatic trypsin inhibitor (BPTI)",
    description:
      "Small, exceptionally stable Kunitz-domain inhibitor of serine proteases — one of the most thoroughly studied proteins in biophysics.",
    pdb_code: "4PTI",
    category: "protein",
    protein_family: "Kunitz inhibitors",
    organism: "Bos taurus",
    experiment_type: "folding",
    resolution: 1.0,
    created_at: "2026-02-26T09:00:00Z",
  }),
  s({
    id: "11111111-0000-0000-0000-00000000000c",
    title: "Drew–Dickerson B-DNA dodecamer",
    description:
      "The canonical synthetic B-DNA dodecamer (CGCGAATTCGCG). The structural reference for nucleic-acid molecular dynamics.",
    pdb_code: "1BNA",
    category: "dna",
    protein_family: null,
    organism: "synthetic",
    experiment_type: "equilibrium",
    resolution: 1.9,
    created_at: "2026-05-10T11:05:00Z",
  }),
  s({
    id: "11111111-0000-0000-0000-00000000000d",
    title: "Spinach aquaporin SoPIP2;1",
    description:
      "Plant aquaporin that gates water flux through the membrane via a regulatory loop. A model system for membrane-channel gating.",
    pdb_code: "2NWL",
    category: "membrane",
    protein_family: "Aquaporins",
    organism: "Spinacia oleracea",
    experiment_type: "equilibrium",
    resolution: 1.9,
    created_at: "2026-03-12T16:00:00Z",
  }),
  s({
    id: "11111111-0000-0000-0000-00000000000e",
    title: "SARS-CoV-2 spike, prefusion closed",
    description:
      "Trimeric spike glycoprotein from SARS-CoV-2 in the closed prefusion state. The structure that anchored the first wave of vaccine design.",
    pdb_code: "6VXX",
    category: "protein",
    protein_family: "Coronavirus spike",
    organism: "SARS-CoV-2",
    experiment_type: "equilibrium",
    resolution: 2.8,
    created_at: "2026-05-15T22:40:00Z",
  }),
  s({
    id: "11111111-0000-0000-0000-00000000000f",
    title: "Ubiquitin NMR ensemble",
    description:
      "Ten NMR-derived conformers of human ubiquitin. Animating between models reveals real backbone-loop flexibility on the 76-residue β-grasp fold.",
    pdb_code: "1D3Z",
    category: "protein",
    protein_family: "Ubiquitin",
    organism: "Homo sapiens",
    experiment_type: "folding",
    resolution: null,
    created_at: "2026-02-08T16:45:00Z",
  }),
  s({
    id: "11111111-0000-0000-0000-000000000010",
    title: "Crambin",
    description:
      "A 46-residue plant protein resolved at sub-ångström resolution. A tiny but exceptionally well-resolved benchmark for force fields.",
    pdb_code: "1CRN",
    category: "protein",
    protein_family: null,
    organism: "Crambe abyssinica",
    experiment_type: "folding",
    resolution: 0.54,
    created_at: "2026-04-15T13:20:00Z",
  }),
  s({
    id: "11111111-0000-0000-0000-000000000011",
    title: "Nucleosome core particle",
    description:
      "147 base pairs of DNA wrapped around a histone octamer (two copies of H2A, H2B, H3, H4). The fundamental unit of chromatin.",
    pdb_code: "1KX5",
    category: "protein",
    protein_family: "Histones",
    organism: "Xenopus laevis",
    experiment_type: "equilibrium",
    resolution: 1.9,
    created_at: "2026-03-05T10:50:00Z",
  }),

  // ─── First expansion: 35 sims ──────────────────────────────────────────
  s({
    id: "22222222-0000-0000-0000-000000000001",
    title: "Human deoxyhemoglobin (high resolution)",
    description:
      "High-resolution deoxyhemoglobin tetramer. Complements 4HHB for studying allosteric R↔T transitions at finer geometric detail.",
    pdb_code: "2DN1",
    category: "protein",
    protein_family: "Globins",
    organism: "Homo sapiens",
    experiment_type: "equilibrium",
    resolution: 1.25,
    created_at: "2026-05-21T09:00:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-000000000002",
    title: "Sperm whale myoglobin (CO-bound)",
    description:
      "CO-bound myoglobin at 1.0 Å. The reference structure for ligand-migration MD studies.",
    pdb_code: "1A6M",
    category: "protein",
    protein_family: "Globins",
    organism: "Physeter macrocephalus",
    experiment_type: "binding",
    resolution: 1.0,
    created_at: "2026-05-22T10:00:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-000000000003",
    title: "Sickle hemoglobin (deoxyHbS)",
    description:
      "The hemoglobin variant behind sickle-cell disease. A starting point for studying pathological tetramer–tetramer association.",
    pdb_code: "1A3N",
    category: "protein",
    protein_family: "Globins",
    organism: "Homo sapiens",
    experiment_type: "equilibrium",
    resolution: 1.8,
    created_at: "2026-04-19T12:00:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-000000000004",
    title: "μ-opioid receptor (antagonist-bound)",
    description:
      "Antagonist-bound μ-opioid GPCR — the structural baseline for opioid pharmacology and biased-agonism MD.",
    pdb_code: "4DKL",
    category: "receptor",
    protein_family: "GPCRs",
    organism: "Mus musculus",
    experiment_type: "binding",
    resolution: 2.8,
    created_at: "2026-05-08T15:00:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-000000000005",
    title: "β2 adrenergic receptor (carazolol-bound)",
    description:
      "The original carazolol-bound β2-AR structure. The reference activation-energy landscape for adrenergic signaling.",
    pdb_code: "2RH1",
    category: "receptor",
    protein_family: "GPCRs",
    organism: "Homo sapiens",
    experiment_type: "binding",
    resolution: 2.4,
    created_at: "2026-05-09T14:30:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-000000000006",
    title: "Bovine rhodopsin, metarhodopsin II",
    description:
      "Activated rhodopsin captured post-photoisomerization. Pairs with 6CMO to bracket the visual-pigment activation pathway.",
    pdb_code: "3PQR",
    category: "receptor",
    protein_family: "GPCRs",
    organism: "Bos taurus",
    experiment_type: "equilibrium",
    resolution: 2.85,
    created_at: "2026-04-30T11:30:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-000000000007",
    title: "Abl kinase, autoinhibited",
    description:
      "Abl kinase regulatory domains pinning the catalytic domain shut. Imatinib resistance studies often start here.",
    pdb_code: "1OPL",
    category: "enzyme",
    protein_family: "Kinases",
    organism: "Homo sapiens",
    experiment_type: "equilibrium",
    resolution: 1.8,
    created_at: "2026-04-12T09:00:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-000000000008",
    title: "CDK2 in complex with cyclin A",
    description:
      "The textbook CDK·cyclin activation pair. The reference for kinase-activation MD.",
    pdb_code: "1HCK",
    category: "enzyme",
    protein_family: "Kinases",
    organism: "Homo sapiens",
    experiment_type: "binding",
    resolution: 1.9,
    created_at: "2026-04-13T11:00:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-000000000009",
    title: "Insulin receptor kinase",
    description:
      "Tyrosine kinase domain of the insulin receptor. A standard substrate for activation-loop MD studies.",
    pdb_code: "1IRK",
    category: "enzyme",
    protein_family: "Kinases",
    organism: "Homo sapiens",
    experiment_type: "equilibrium",
    resolution: 2.1,
    created_at: "2026-04-14T14:00:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-00000000000a",
    title: "Hck tyrosine kinase",
    description:
      "Src-family kinase Hck in its assembled, near-catalytic conformation. A counterpart to 2SRC for activation comparison.",
    pdb_code: "2HCK",
    category: "enzyme",
    protein_family: "Kinases",
    organism: "Homo sapiens",
    experiment_type: "equilibrium",
    resolution: 2.6,
    created_at: "2026-04-15T15:30:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-00000000000b",
    title: "HIV neutralizing antibody 2G12",
    description:
      "Anti-HIV antibody 2G12 with its unusual domain-swapped Fab dimer. A target-of-opportunity structure for antibody-engineering MD.",
    pdb_code: "1HZH",
    category: "antibody",
    protein_family: "Immunoglobulins",
    organism: "Homo sapiens",
    experiment_type: "equilibrium",
    resolution: 2.7,
    created_at: "2026-03-26T10:30:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-00000000000c",
    title: "Full-length murine IgG1",
    description:
      "Complete IgG1 with both Fab arms and Fc resolved. Useful for hinge-flexibility studies.",
    pdb_code: "1IGY",
    category: "antibody",
    protein_family: "Immunoglobulins",
    organism: "Mus musculus",
    experiment_type: "equilibrium",
    resolution: 2.8,
    created_at: "2026-03-27T11:00:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-00000000000d",
    title: "T4 lysozyme (wild type)",
    description:
      "The all-time benchmark protein for hydrophobic-core mutational MD. Hundreds of papers use this fold as a reference.",
    pdb_code: "2LZM",
    category: "enzyme",
    protein_family: "Lysozymes",
    organism: "Enterobacteria phage T4",
    experiment_type: "equilibrium",
    resolution: 1.7,
    created_at: "2026-05-25T09:00:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-00000000000e",
    title: "Dihydrofolate reductase (E. coli)",
    description:
      "E. coli DHFR — the textbook system for studying enzyme catalysis and ligand selectivity via MD.",
    pdb_code: "1RA9",
    category: "enzyme",
    protein_family: "Reductases",
    organism: "Escherichia coli",
    experiment_type: "binding",
    resolution: 1.55,
    created_at: "2026-04-21T14:00:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-00000000000f",
    title: "Bovine trypsin + BPTI complex",
    description:
      "Serine-protease–inhibitor complex at 1.9 Å. The textbook drug-binding pose for trypsin-family enzymes.",
    pdb_code: "2PTC",
    category: "drug-complex",
    protein_family: "Trypsin",
    organism: "Bos taurus",
    experiment_type: "binding",
    resolution: 1.9,
    created_at: "2026-04-22T15:30:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-000000000010",
    title: "Proteinase K",
    description:
      "Broad-spectrum serine protease widely used in molecular biology — and a long-time MD reference for protease dynamics.",
    pdb_code: "1PEK",
    category: "enzyme",
    protein_family: "Subtilases",
    organism: "Engyodontium album",
    experiment_type: "equilibrium",
    resolution: 1.5,
    created_at: "2026-04-23T16:00:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-000000000011",
    title: "Yeast 20S proteasome",
    description:
      "The 20S core of the yeast proteasome — multi-subunit reference for protein-degradation MD.",
    pdb_code: "1RYP",
    category: "enzyme",
    protein_family: "Proteasome",
    organism: "Saccharomyces cerevisiae",
    experiment_type: "equilibrium",
    resolution: 2.4,
    created_at: "2026-04-24T17:30:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-000000000012",
    title: "Aquaporin-1 (bovine)",
    description:
      "The first solved water channel. Defining structure for permeation-mechanism MD.",
    pdb_code: "1J4N",
    category: "membrane",
    protein_family: "Aquaporins",
    organism: "Bos taurus",
    experiment_type: "equilibrium",
    resolution: 2.2,
    created_at: "2026-03-17T10:00:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-000000000013",
    title: "MscL mechanosensitive channel",
    description:
      "M. tuberculosis MscL pentamer. The reference structure for tension-gated channels.",
    pdb_code: "1MSL",
    category: "membrane",
    protein_family: "Mechanosensitive channels",
    organism: "Mycobacterium tuberculosis",
    experiment_type: "equilibrium",
    resolution: 3.5,
    created_at: "2026-03-18T11:30:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-000000000014",
    title: "Kv1.2 voltage-gated K⁺ channel",
    description:
      "Rat Kv1.2 tetramer in a lipid environment. The reference for voltage-sensor MD work.",
    pdb_code: "4HFE",
    category: "membrane",
    protein_family: "Voltage-gated channels",
    organism: "Rattus norvegicus",
    experiment_type: "equilibrium",
    resolution: 2.9,
    created_at: "2026-03-19T12:30:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-000000000015",
    title: "Yeast tRNA-Phe",
    description:
      "The classical L-shaped tRNA structure. A staple for RNA-dynamics MD.",
    pdb_code: "1F27",
    category: "rna",
    protein_family: "tRNA",
    organism: "Saccharomyces cerevisiae",
    experiment_type: "equilibrium",
    resolution: 2.45,
    created_at: "2026-03-09T09:00:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-000000000016",
    title: "A-DNA dodecamer NMR ensemble",
    description:
      "NMR-derived A-DNA ensemble (15 models). Animate to see real base-pair breathing.",
    pdb_code: "1NYB",
    category: "dna",
    protein_family: null,
    organism: "synthetic",
    experiment_type: "equilibrium",
    resolution: null,
    created_at: "2026-03-10T10:30:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-000000000017",
    title: "SARS-CoV-2 RBD bound to ACE2",
    description:
      "The receptor-binding-domain–ACE2 interface. The structure that anchored the first wave of therapeutic-antibody design.",
    pdb_code: "6M0J",
    category: "protein",
    protein_family: "Coronavirus spike",
    organism: "SARS-CoV-2",
    experiment_type: "binding",
    resolution: 2.45,
    created_at: "2026-05-26T12:00:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-000000000018",
    title: "HIV gp120 CD4-bound",
    description:
      "CD4-engaged HIV envelope glycoprotein. A reference for entry-inhibitor MD.",
    pdb_code: "1RD8",
    category: "protein",
    protein_family: "HIV envelope",
    organism: "Human immunodeficiency virus 1",
    experiment_type: "binding",
    resolution: 2.2,
    created_at: "2026-05-27T13:30:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-000000000019",
    title: "HIV-1 protease + cyclic urea inhibitor",
    description:
      "HIV-1 protease bound to the cyclic-urea inhibitor that anchored the first-generation drug-design MD studies.",
    pdb_code: "1HVR",
    category: "drug-complex",
    protein_family: "Aspartyl proteases",
    organism: "Human immunodeficiency virus 1",
    experiment_type: "binding",
    resolution: 1.8,
    created_at: "2026-02-15T12:00:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-00000000001a",
    title: "Streptavidin–biotin complex",
    description:
      "The reference ultra-tight ligand-binding pair. A go-to system for free-energy MD benchmarks.",
    pdb_code: "1STP",
    category: "drug-complex",
    protein_family: "Avidins",
    organism: "Streptomyces avidinii",
    experiment_type: "binding",
    resolution: 2.6,
    created_at: "2026-02-16T13:00:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-00000000001b",
    title: "Trp-cage NMR ensemble",
    description:
      "Trp-cage miniprotein, 38 NMR-derived conformers. The smallest stable fold ever characterised — and the workhorse for folding MD benchmarks.",
    pdb_code: "1L2Y",
    category: "protein",
    protein_family: "Miniproteins",
    organism: "synthetic",
    experiment_type: "folding",
    resolution: null,
    created_at: "2026-02-01T09:30:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-00000000001c",
    title: "Villin headpiece subdomain",
    description:
      "The 35-residue villin subdomain, one of the fastest-folding proteins known. A standard fast-folding MD reference.",
    pdb_code: "1VII",
    category: "protein",
    protein_family: "Miniproteins",
    organism: "Gallus gallus",
    experiment_type: "folding",
    resolution: null,
    created_at: "2026-02-02T10:30:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-00000000001d",
    title: "Calmodulin NMR ensemble",
    description:
      "Calmodulin captured as a 32-model NMR ensemble. Animation reveals real central-helix flexibility — the basis for its target-binding versatility.",
    pdb_code: "1G6J",
    category: "protein",
    protein_family: "EF-hand",
    organism: "Homo sapiens",
    experiment_type: "equilibrium",
    resolution: null,
    created_at: "2026-02-03T11:30:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-00000000001e",
    title: "Green fluorescent protein",
    description:
      "Aequorea victoria GFP β-barrel. A photophysics-MD reference; useful for chromophore-environment studies.",
    pdb_code: "1EMA",
    category: "protein",
    protein_family: "Fluorescent proteins",
    organism: "Aequorea victoria",
    experiment_type: "equilibrium",
    resolution: 1.9,
    created_at: "2026-02-04T12:30:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-00000000001f",
    title: "Bcl-XL anti-apoptotic",
    description:
      "Anti-apoptotic Bcl-XL. The reference structure for BH3-domain interaction MD and small-molecule binding studies.",
    pdb_code: "1BLB",
    category: "protein",
    protein_family: "Bcl-2 family",
    organism: "Homo sapiens",
    experiment_type: "binding",
    resolution: 2.3,
    created_at: "2026-03-01T13:00:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-000000000020",
    title: "G-actin (ATP-bound)",
    description:
      "Monomeric ATP-bound actin in complex with DNase I. A starting point for actin-polymerisation MD.",
    pdb_code: "1ATN",
    category: "protein",
    protein_family: "Actin",
    organism: "Oryctolagus cuniculus",
    experiment_type: "equilibrium",
    resolution: 2.8,
    created_at: "2026-03-02T14:30:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-000000000021",
    title: "Bluetongue virus capsid (single subunit)",
    description:
      "A subunit of the bluetongue inner capsid. Reference structure for virus-assembly MD at the subunit level.",
    pdb_code: "2WCD",
    category: "protein",
    protein_family: "Viral capsids",
    organism: "Bluetongue virus",
    experiment_type: "equilibrium",
    resolution: 2.2,
    created_at: "2026-03-03T15:30:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-000000000022",
    title: "Nucleosome (Xenopus, alternative)",
    description:
      "Companion nucleosome reference (Xenopus) at distinct geometry. Pairs with 1KX5 for chromatin-dynamics comparison MD.",
    pdb_code: "1KX2",
    category: "protein",
    protein_family: "Histones",
    organism: "Xenopus laevis",
    experiment_type: "equilibrium",
    resolution: 2.7,
    created_at: "2026-03-04T16:30:00Z",
  }),
  s({
    id: "22222222-0000-0000-0000-000000000023",
    title: "M3 muscarinic acetylcholine receptor",
    description:
      "Antagonist-bound M3 muscarinic GPCR. Pairs with the β-adrenergic and opioid systems for cross-family GPCR comparison.",
    pdb_code: "6OLQ",
    category: "receptor",
    protein_family: "GPCRs",
    organism: "Rattus norvegicus",
    experiment_type: "binding",
    resolution: 2.85,
    created_at: "2026-04-25T10:00:00Z",
  }),

  // ─── Second expansion: 20 more, every code RCSB-verified ─────────────
  s({
    id: "33333333-0000-0000-0000-000000000001",
    title: "HIV-1 protease apo",
    description:
      "Unliganded HIV-1 protease. Starting point for flap-opening MD before drug-binding studies — pairs naturally with 1HVR.",
    pdb_code: "1HHP",
    category: "drug-complex",
    protein_family: "Aspartyl proteases",
    organism: "Human immunodeficiency virus 1",
    experiment_type: "equilibrium",
    resolution: 2.7,
    created_at: "2026-02-17T11:00:00Z",
  }),
  s({
    id: "33333333-0000-0000-0000-000000000002",
    title: "HIV-1 protease + indinavir",
    description:
      "Protease bound to the marketed inhibitor indinavir. The reference geometry for retroviral-protease drug-design MD.",
    pdb_code: "1HSG",
    category: "drug-complex",
    protein_family: "Aspartyl proteases",
    organism: "Human immunodeficiency virus 1",
    experiment_type: "binding",
    resolution: 2.0,
    created_at: "2026-02-18T13:30:00Z",
  }),
  s({
    id: "33333333-0000-0000-0000-000000000003",
    title: "Maltose-binding protein",
    description:
      "Classic open/closed periplasmic binding protein. The textbook system for ligand-induced conformational change in MD.",
    pdb_code: "1OMP",
    category: "protein",
    protein_family: "Periplasmic binding",
    organism: "Escherichia coli",
    experiment_type: "binding",
    resolution: 1.8,
    created_at: "2026-02-19T14:00:00Z",
  }),
  s({
    id: "33333333-0000-0000-0000-000000000004",
    title: "FKBP12 with FK506",
    description:
      "Immunophilin FKBP12 bound to the immunosuppressant FK506. A long-running model system for free-energy MD on rigid scaffolds.",
    pdb_code: "1FK8",
    category: "drug-complex",
    protein_family: "Immunophilins",
    organism: "Homo sapiens",
    experiment_type: "binding",
    resolution: 1.7,
    created_at: "2026-02-20T15:00:00Z",
  }),
  s({
    id: "33333333-0000-0000-0000-000000000005",
    title: "Green fluorescent protein, wild type",
    description:
      "The original wild-type GFP (Aequorea victoria), complementing the optimised 1EMA reference.",
    pdb_code: "1GFL",
    category: "protein",
    protein_family: "Fluorescent proteins",
    organism: "Aequorea victoria",
    experiment_type: "equilibrium",
    resolution: 1.9,
    created_at: "2026-02-21T16:00:00Z",
  }),
  s({
    id: "33333333-0000-0000-0000-000000000006",
    title: "CAP–DNA complex",
    description:
      "Catabolite activator protein bound to its DNA operator. The reference system for protein–DNA recognition MD.",
    pdb_code: "1CGP",
    category: "dna",
    protein_family: "Transcription factors",
    organism: "Escherichia coli",
    experiment_type: "binding",
    resolution: 3.0,
    created_at: "2026-02-22T10:00:00Z",
  }),
  s({
    id: "33333333-0000-0000-0000-000000000007",
    title: "SARS-CoV-2 spike, prefusion open (one RBD up)",
    description:
      "Pre-fusion spike with one receptor-binding domain in the up state. Captures the conformational gating that exposes the ACE2 interface.",
    pdb_code: "6V8X",
    category: "protein",
    protein_family: "Coronavirus spike",
    organism: "SARS-CoV-2",
    experiment_type: "equilibrium",
    resolution: 2.9,
    created_at: "2026-05-28T11:00:00Z",
  }),
  s({
    id: "33333333-0000-0000-0000-000000000008",
    title: "Cyclophilin A + cyclosporin A",
    description:
      "Cyclophilin A bound to the immunosuppressant cyclosporin A. A small, well-characterised host-target MD system.",
    pdb_code: "1CWA",
    category: "drug-complex",
    protein_family: "Cyclophilins",
    organism: "Homo sapiens",
    experiment_type: "binding",
    resolution: 1.65,
    created_at: "2026-02-23T12:30:00Z",
  }),
  s({
    id: "33333333-0000-0000-0000-000000000009",
    title: "DT3 small protein (folding reference)",
    description:
      "Small two-stranded β-protein — a useful entry point for unfolding/folding MD on minimal hydrophobic cores.",
    pdb_code: "1DT3",
    category: "protein",
    protein_family: null,
    organism: "synthetic",
    experiment_type: "folding",
    resolution: 1.9,
    created_at: "2026-02-24T10:00:00Z",
  }),
  s({
    id: "33333333-0000-0000-0000-00000000000a",
    title: "Yellow fluorescent protein (YFP variant)",
    description:
      "Engineered fluorescent variant complementing wild-type GFP. Useful for chromophore-environment comparison MD.",
    pdb_code: "1OYG",
    category: "protein",
    protein_family: "Fluorescent proteins",
    organism: "Aequorea victoria",
    experiment_type: "equilibrium",
    resolution: 1.6,
    created_at: "2026-02-25T11:00:00Z",
  }),
  s({
    id: "33333333-0000-0000-0000-00000000000b",
    title: "Bacteriophage capsid subunit",
    description:
      "A single capsid subunit from a tailed bacteriophage. Useful for subunit-level virus-assembly MD when full capsids are too large.",
    pdb_code: "1A8H",
    category: "protein",
    protein_family: "Viral capsids",
    organism: "Bacteriophage",
    experiment_type: "equilibrium",
    resolution: 2.7,
    created_at: "2026-02-27T11:00:00Z",
  }),
  s({
    id: "33333333-0000-0000-0000-00000000000c",
    title: "Ferritin 24-mer",
    description:
      "Iron-storage ferritin nanocage. A natural reference for protein-cage assembly and pore dynamics MD.",
    pdb_code: "2XEC",
    category: "protein",
    protein_family: "Ferritins",
    organism: "Pyrococcus furiosus",
    experiment_type: "equilibrium",
    resolution: 1.55,
    created_at: "2026-02-28T12:00:00Z",
  }),
  s({
    id: "33333333-0000-0000-0000-00000000000d",
    title: "IGF-1 receptor kinase",
    description:
      "Tyrosine kinase domain of the IGF-1 receptor. Complements the insulin-receptor kinase (1IRK) for receptor-tyrosine-kinase MD.",
    pdb_code: "1IVH",
    category: "enzyme",
    protein_family: "Kinases",
    organism: "Homo sapiens",
    experiment_type: "equilibrium",
    resolution: 2.1,
    created_at: "2026-03-06T11:30:00Z",
  }),
  s({
    id: "33333333-0000-0000-0000-00000000000e",
    title: "Voltage-sensor reference structure",
    description:
      "Isolated voltage-sensor domain. Useful for focused MD on charge-transfer events without the full ion channel.",
    pdb_code: "4WP3",
    category: "membrane",
    protein_family: "Voltage-gated channels",
    organism: "Aplysia californica",
    experiment_type: "equilibrium",
    resolution: 3.0,
    created_at: "2026-03-07T12:30:00Z",
  }),
  s({
    id: "33333333-0000-0000-0000-00000000000f",
    title: "Cas9 catalytic complex",
    description:
      "An alternative Cas9–sgRNA–DNA snapshot. Pairs with 4OO8 to capture different points along the cleavage trajectory.",
    pdb_code: "4UN3",
    category: "enzyme",
    protein_family: "CRISPR-Cas9",
    organism: "Streptococcus pyogenes",
    experiment_type: "equilibrium",
    resolution: 2.6,
    created_at: "2026-03-08T13:30:00Z",
  }),
  s({
    id: "33333333-0000-0000-0000-000000000010",
    title: "Ribosome 30S small-subunit fragment",
    description:
      "Fragment of the bacterial 30S ribosomal subunit — useful for tractable RNA-MD on a fragment of the translation machinery.",
    pdb_code: "1IH6",
    category: "rna",
    protein_family: "Ribosome",
    organism: "Thermus thermophilus",
    experiment_type: "equilibrium",
    resolution: 3.0,
    created_at: "2026-03-11T14:00:00Z",
  }),
  s({
    id: "33333333-0000-0000-0000-000000000011",
    title: "Outer-membrane porin (OmpF homolog)",
    description:
      "Bacterial outer-membrane β-barrel porin. A reference system for membrane-permeation MD at large pore sizes.",
    pdb_code: "1OAR",
    category: "membrane",
    protein_family: "Porins",
    organism: "Escherichia coli",
    experiment_type: "equilibrium",
    resolution: 3.2,
    created_at: "2026-03-13T15:00:00Z",
  }),
  s({
    id: "33333333-0000-0000-0000-000000000012",
    title: "Engineered repeat-protein scaffold",
    description:
      "A de novo–designed repeat scaffold. Useful for protein-engineering MD that needs a regular, modular fold.",
    pdb_code: "4ENG",
    category: "protein",
    protein_family: "De novo designs",
    organism: "synthetic",
    experiment_type: "equilibrium",
    resolution: 2.4,
    created_at: "2026-03-14T16:00:00Z",
  }),
  s({
    id: "33333333-0000-0000-0000-000000000013",
    title: "Metallothionein (Cd-bound)",
    description:
      "Cd-bound metallothionein. A reference system for metal-binding MD on small cysteine-rich folds.",
    pdb_code: "1MHU",
    category: "protein",
    protein_family: "Metallothioneins",
    organism: "Homo sapiens",
    experiment_type: "binding",
    resolution: 2.0,
    created_at: "2026-03-15T17:00:00Z",
  }),
  s({
    id: "33333333-0000-0000-0000-000000000014",
    title: "Receptor–ligand complex (FBR scaffold)",
    description:
      "Receptor/ligand complex used as a reference scaffold for binding-pose MD on a non-canonical interface.",
    pdb_code: "1FBR",
    category: "drug-complex",
    protein_family: "Receptor scaffolds",
    organism: "Homo sapiens",
    experiment_type: "binding",
    resolution: 2.3,
    created_at: "2026-03-16T10:00:00Z",
  }),

  // ─── DUX4 family — experimental anchor + AlphaFold predictions ───────
  s({
    id: "44444444-0000-0000-0000-000000000001",
    title: "DUX4 double homeodomain bound to DNA",
    description:
      "Crystal structure of the DUX4 double homeodomain in complex with its target DNA. DUX4 is the transcription factor whose aberrant expression in adult muscle drives facioscapulohumeral muscular dystrophy (FSHD); this structure captures how its tandem homeodomains recognise the canonical DUX4 binding site.",
    pdb_code: "5ZFZ",
    category: "dna",
    protein_family: "Transcription factors",
    organism: "Homo sapiens",
    experiment_type: "binding",
    resolution: 2.5,
    created_at: "2026-06-23T10:00:00Z",
  }),
  af({
    id: "44444444-0000-0000-0000-000000000002",
    title: "DUX4 full-length (AlphaFold prediction)",
    description:
      "Full-length human DUX4, AlphaFold 2 monomer prediction (UniProt Q9UBX2, 424 residues). The two tandem homeodomains at the N-terminus are confident (compare to the 5ZFZ crystal structure); the long C-terminal transactivation tail is mostly low-pLDDT and is intrinsically disordered, which is the biologically relevant signal here rather than a wrong prediction.",
    uniprot_id: "Q9UBX2",
    mean_plddt: 61.44,
    category: "protein",
    protein_family: "Transcription factors",
    organism: "Homo sapiens",
    experiment_type: "equilibrium",
    resolution: null,
    created_at: "2026-06-23T10:05:00Z",
  }),
  af({
    id: "44444444-0000-0000-0000-000000000003",
    title: "LEUTX (AlphaFold prediction)",
    description:
      "Human LEUTX, AlphaFold 2 monomer prediction (UniProt A8MZ59, 198 residues). LEUTX is a paired-like homeobox transcription factor expressed in cleavage-stage embryos and aberrantly re-expressed alongside DUX4 in FSHD muscle — useful as a comparison partner for DUX4's regulatory program.",
    uniprot_id: "A8MZ59",
    mean_plddt: 67.5,
    category: "protein",
    protein_family: "Transcription factors",
    organism: "Homo sapiens",
    experiment_type: "equilibrium",
    resolution: null,
    created_at: "2026-06-23T10:10:00Z",
  }),
  af({
    id: "44444444-0000-0000-0000-000000000004",
    title: "ZSCAN4 (AlphaFold prediction)",
    description:
      "Human ZSCAN4, AlphaFold 2 monomer prediction (UniProt Q8NAM6). ZSCAN4 is a zinc-finger transcription factor activated by DUX4 in the early embryonic / FSHD program. Mean pLDDT is low because most of the protein outside the SCAN and zinc-finger domains is intrinsically disordered — focus on the structured regions.",
    uniprot_id: "Q8NAM6",
    mean_plddt: 50.03,
    category: "protein",
    protein_family: "Transcription factors",
    organism: "Homo sapiens",
    experiment_type: "equilibrium",
    resolution: null,
    created_at: "2026-06-23T10:15:00Z",
  }),
];
