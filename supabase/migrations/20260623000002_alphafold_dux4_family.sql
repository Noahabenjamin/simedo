-- 2026-06-23: seed the AlphaFold-predicted DUX4 family entries.
--
-- All three are AlphaFold 2 monomer predictions pulled from the public
-- AlphaFold DB (v6, the current public release). Mean pLDDT values come
-- from the AlphaFold API's globalMetricValue field. The PDB and PAE URLs
-- below are the canonical AlphaFold DB URLs for each UniProt entry.
--
-- The fourth entry from the original spec — the DUX4–ZSCAN4 complex —
-- is intentionally deferred: it requires a custom AlphaFold 3 server run
-- (PDB + PAE assets need to be hosted somewhere first, and the ipTM
-- score isn't known until that run completes). Add it in a follow-up
-- migration once those assets exist.
--
-- Safe to re-run (on conflict do nothing).

insert into public.simulations (
  id, user_id, title, description, pdb_code, pdb_url, thumbnail_url,
  category, protein_family, organism, experiment_type, resolution, license,
  visibility, view_count, like_count, comment_count, created_at, updated_at,
  structure_source, prediction_confidence, prediction_pae_url
) values
  -- DUX4 full-length (Q9UBX2)
  ('44444444-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
    'DUX4 full-length (AlphaFold prediction)',
    'Full-length human DUX4, AlphaFold 2 monomer prediction (UniProt Q9UBX2, 424 residues). The two tandem homeodomains at the N-terminus are confident (compare to the 5ZFZ crystal structure); the long C-terminal transactivation tail is mostly low-pLDDT and is intrinsically disordered, which is the biologically relevant signal here rather than a wrong prediction.',
    null,
    'https://alphafold.ebi.ac.uk/files/AF-Q9UBX2-F1-model_v6.pdb',
    null,
    'protein', 'Transcription factors', 'Homo sapiens', 'equilibrium', null, 'cc-by', 'public',
    0, 0, 0, '2026-06-23T10:05:00Z', '2026-06-23T10:05:00Z',
    'alphafold2', 61.44,
    'https://alphafold.ebi.ac.uk/files/AF-Q9UBX2-F1-predicted_aligned_error_v6.json'),

  -- LEUTX (A8MZ59)
  ('44444444-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
    'LEUTX (AlphaFold prediction)',
    'Human LEUTX, AlphaFold 2 monomer prediction (UniProt A8MZ59, 198 residues). LEUTX is a paired-like homeobox transcription factor expressed in cleavage-stage embryos and aberrantly re-expressed alongside DUX4 in FSHD muscle — useful as a comparison partner for DUX4''s regulatory program.',
    null,
    'https://alphafold.ebi.ac.uk/files/AF-A8MZ59-F1-model_v6.pdb',
    null,
    'protein', 'Transcription factors', 'Homo sapiens', 'equilibrium', null, 'cc-by', 'public',
    0, 0, 0, '2026-06-23T10:10:00Z', '2026-06-23T10:10:00Z',
    'alphafold2', 67.5,
    'https://alphafold.ebi.ac.uk/files/AF-A8MZ59-F1-predicted_aligned_error_v6.json'),

  -- ZSCAN4 (Q8NAM6)
  ('44444444-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001',
    'ZSCAN4 (AlphaFold prediction)',
    'Human ZSCAN4, AlphaFold 2 monomer prediction (UniProt Q8NAM6). ZSCAN4 is a zinc-finger transcription factor activated by DUX4 in the early embryonic / FSHD program. Mean pLDDT is low because most of the protein outside the SCAN and zinc-finger domains is intrinsically disordered — focus on the structured regions.',
    null,
    'https://alphafold.ebi.ac.uk/files/AF-Q8NAM6-F1-model_v6.pdb',
    null,
    'protein', 'Transcription factors', 'Homo sapiens', 'equilibrium', null, 'cc-by', 'public',
    0, 0, 0, '2026-06-23T10:15:00Z', '2026-06-23T10:15:00Z',
    'alphafold2', 50.03,
    'https://alphafold.ebi.ac.uk/files/AF-Q8NAM6-F1-predicted_aligned_error_v6.json')
on conflict (id) do nothing;
