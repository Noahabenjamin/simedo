-- 2026-06-23: AlphaFold prediction support — schema only.
--
-- Adds structure_source + confidence/PAE/requester/reviewer fields so
-- AlphaFold and other predicted structures can be distinguished from
-- experimental ones on the detail page and in the viewer.
--
-- Existing rows are filled with 'experimental-xray' as a safe default;
-- visual rendering for those rows is unchanged. Only structures with
-- structure_source LIKE 'alphafold%' or 'rosetta' will get new UI
-- treatment (badge, confidence score, PAE plot, disclosure block) once
-- the detail-page wiring lands.
--
-- Also seeds DUX4 5ZFZ — the double homeodomain crystal structure —
-- as a reference X-ray entry. The AlphaFold-predicted DUX4 family
-- entries (full-length DUX4, LEUTX, ZSCAN4, DUX4–ZSCAN4 complex) will
-- be added in a later migration once the PDB + PAE assets are hosted.
--
-- Safe to re-run.

-- ============================================================================
-- 1. Enum + new columns on simulations.
-- ============================================================================
create type public.structure_source as enum (
  'experimental-xray',
  'experimental-nmr',
  'experimental-cryoem',
  'alphafold2',
  'alphafold3',
  'rosetta',
  'other-prediction'
);

alter table public.simulations
  add column structure_source           public.structure_source
                                          not null
                                          default 'experimental-xray',
  add column prediction_confidence      numeric,
  add column prediction_pae_url         text,
  add column requested_by               text,
  add column requested_by_affiliation   text,
  add column scientifically_reviewed_by text;

comment on column public.simulations.structure_source is
  'Origin of the structural coordinates. experimental-* = solved structure (X-ray / NMR / cryo-EM). alphafold* / rosetta / other-prediction = computational. Drives UI badges, default viewer coloring, and the prediction-disclosure block on the detail page.';

comment on column public.simulations.prediction_confidence is
  'For AlphaFold monomers: mean pLDDT (0-100). For AlphaFold 3 multimer predictions: ipTM (0-1). Null for experimental entries.';

comment on column public.simulations.prediction_pae_url is
  'URL to a JSON PAE matrix (residue x residue predicted aligned error). Rendered as a heatmap beneath the viewer for AlphaFold entries.';

comment on column public.simulations.requested_by is
  'Name of the researcher who requested this entry be added (independent of who uploaded it). Shown as a small italic line near the title.';

comment on column public.simulations.scientifically_reviewed_by is
  'Name of the expert who reviewed this prediction. Shown as a small badge near the title. Used to signal that a computational structure has been vetted by someone qualified.';

create index simulations_structure_source_idx on public.simulations(structure_source);

-- ============================================================================
-- 2. Seed: DUX4 5ZFZ (double homeodomain bound to DNA, experimental X-ray).
--    Attributed to the Simedo Team account so it surfaces alongside the
--    other reference structures. Idempotent.
-- ============================================================================
insert into public.simulations (
  id, user_id, title, description, pdb_code, pdb_url, thumbnail_url,
  category, protein_family, organism, experiment_type, resolution, license,
  visibility, view_count, like_count, comment_count, created_at, updated_at,
  structure_source
) values
  ('44444444-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
    'DUX4 double homeodomain bound to DNA',
    'Crystal structure of the DUX4 double homeodomain in complex with its target DNA. DUX4 is the transcription factor whose aberrant expression in adult muscle drives facioscapulohumeral muscular dystrophy (FSHD); this structure captures how its tandem homeodomains recognise the canonical DUX4 binding site.',
    '5ZFZ', 'https://files.rcsb.org/download/5ZFZ.pdb', null,
    'dna', 'Transcription factors', 'Homo sapiens', 'binding', 2.5, 'cc-by', 'public',
    0, 0, 0, '2026-06-23T10:00:00Z', '2026-06-23T10:00:00Z',
    'experimental-xray')
on conflict (id) do nothing;
