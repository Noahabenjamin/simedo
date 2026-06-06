-- 2026-06-06: backfill the production sims and clean up the pre-rebrand
-- fictional contributors.
--
-- Why this exists: the seed simulation rows were lost from production,
-- but the original 11 fictional users (miraokafor, jtanaka, …) are still
-- in public.users with institution attributions that aren't real (e.g.
-- "RIKEN"). This migration:
--   1. Reassigns any leftover simulations from those accounts to the
--      Simedo Team account so we don't lose data on delete.
--   2. Deletes the 11 fictional auth.users rows (public.users cascades).
--   3. Reinserts the 17 original reference simulations attributed to
--      Simedo Team, all idempotent via on conflict do nothing.
--   4. Inserts 35 additional structure-based reference simulations
--      (real PDB codes, real protein families) so /browse, /family/…,
--      and the homepage discovery rows aren't empty during beta.
--
-- Safe to re-run. Real user uploads (verification_level <> 'none' for
-- non-seed accounts) are never touched.

-- ============================================================================
-- 1. Reassign any leftover sims, then 2. delete the fictional users.
-- ============================================================================
update public.simulations
   set user_id = '00000000-0000-0000-0000-000000000001'
 where user_id in (
   '00000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000005',
   '00000000-0000-0000-0000-000000000006',
   '00000000-0000-0000-0000-000000000007',
   '00000000-0000-0000-0000-000000000008',
   '00000000-0000-0000-0000-000000000009',
   '00000000-0000-0000-0000-00000000000a',
   '00000000-0000-0000-0000-00000000000b',
   '00000000-0000-0000-0000-00000000000c'
 );

delete from auth.users
 where id in (
   '00000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000005',
   '00000000-0000-0000-0000-000000000006',
   '00000000-0000-0000-0000-000000000007',
   '00000000-0000-0000-0000-000000000008',
   '00000000-0000-0000-0000-000000000009',
   '00000000-0000-0000-0000-00000000000a',
   '00000000-0000-0000-0000-00000000000b',
   '00000000-0000-0000-0000-00000000000c'
 );

-- ============================================================================
-- 3. Make sure the Simedo Team account exists. Re-run-safe.
-- ============================================================================
insert into auth.users (id, email, raw_user_meta_data, created_at, email_confirmed_at)
values
  ('00000000-0000-0000-0000-000000000001',
   'team@simedo.example',
   '{"username":"helix-team","display_name":"Simedo Team","is_seed":true}'::jsonb,
   '2025-09-01', '2025-09-01')
on conflict (id) do nothing;

update public.users
   set display_name = 'Simedo Team',
       bio = 'Reference structures curated by the Simedo team. Browse to explore — upload your own simulation to claim a real profile.',
       institution = null,
       is_verified_academic = false,
       verification_level = 'manually_verified',
       avatar_url = 'https://api.dicebear.com/9.x/shapes/svg?seed=helix-team&backgroundColor=0a1437&shape1Color=2563eb&shape2Color=60a5fa&shape3Color=93c5fd'
 where id = '00000000-0000-0000-0000-000000000001';

-- ============================================================================
-- 4. Original 17 reference simulations. All structure-only except 1D3Z
--    (NMR ensemble). All attributed to Simedo Team. Idempotent.
-- ============================================================================
insert into public.simulations (
  id, user_id, title, description, pdb_code, pdb_url, thumbnail_url,
  category, protein_family, organism, experiment_type, resolution, license,
  visibility, view_count, like_count, comment_count, created_at, updated_at
) values
  ('11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
    'Oxyhemoglobin, R state',
    'Human hemoglobin in the oxygen-bound R state. The classic structure that captures cooperative binding mid-cycle.',
    '1HHO', 'https://files.rcsb.org/download/1HHO.pdb', null,
    'protein', 'Globins', 'Homo sapiens', 'equilibrium', 2.1, 'cc-by', 'public',
    0, 0, 0, '2026-05-18T09:12:00Z', '2026-05-18T09:12:00Z'),

  ('11111111-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
    'Deoxyhemoglobin, T state',
    'Human deoxyhemoglobin in the tense T state. Pairs naturally with 1HHO to study the allosteric switch behind cooperative oxygen binding.',
    '4HHB', 'https://files.rcsb.org/download/4HHB.pdb', null,
    'protein', 'Globins', 'Homo sapiens', 'equilibrium', 1.74, 'cc-by', 'public',
    0, 0, 0, '2026-04-28T18:55:00Z', '2026-04-28T18:55:00Z'),

  ('11111111-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
    'Sperm whale myoglobin',
    'The first protein structure ever solved by X-ray crystallography (Kendrew, 1958). Still a benchmark for oxygen-storage dynamics.',
    '1MBN', 'https://files.rcsb.org/download/1MBN.pdb', null,
    'protein', 'Globins', 'Physeter macrocephalus', 'equilibrium', 2.0, 'cc-by', 'public',
    0, 0, 0, '2026-05-02T11:20:00Z', '2026-05-02T11:20:00Z'),

  ('11111111-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001',
    'β2 adrenergic receptor–Gs complex',
    'β2 adrenergic receptor captured coupled to its heterotrimeric Gs partner. A landmark GPCR signaling complex.',
    '3SN6', 'https://files.rcsb.org/download/3SN6.pdb', null,
    'receptor', 'GPCRs', 'Homo sapiens', 'binding', 3.2, 'cc-by', 'public',
    0, 0, 0, '2026-05-12T15:40:00Z', '2026-05-12T15:40:00Z'),

  ('11111111-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001',
    'Bovine rhodopsin, dark state',
    'Bovine rhodopsin in its dark resting state. A cornerstone for visual-pigment activation dynamics.',
    '6CMO', 'https://files.rcsb.org/download/6CMO.pdb', null,
    'receptor', 'GPCRs', 'Bos taurus', 'equilibrium', 3.0, 'cc-by', 'public',
    0, 0, 0, '2026-04-22T19:10:00Z', '2026-04-22T19:10:00Z'),

  ('11111111-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001',
    'CRISPR-Cas9 with sgRNA and DNA',
    'Cas9 bound to a single-guide RNA and target DNA. The complete editing complex in a cleavage-ready geometry.',
    '4OO8', 'https://files.rcsb.org/download/4OO8.pdb', null,
    'enzyme', 'CRISPR-Cas9', 'Streptococcus pyogenes', 'equilibrium', 2.5, 'cc-by', 'public',
    0, 0, 0, '2026-05-15T08:30:00Z', '2026-05-15T08:30:00Z'),

  ('11111111-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001',
    'Intact mouse IgG2a antibody',
    'One of the few full-length immunoglobulin structures available — hinges, Fab arms, and Fc all resolved.',
    '1IGT', 'https://files.rcsb.org/download/1IGT.pdb', null,
    'antibody', 'Immunoglobulins', 'Mus musculus', 'equilibrium', 2.8, 'cc-by', 'public',
    0, 0, 0, '2026-04-09T13:45:00Z', '2026-04-09T13:45:00Z'),

  ('11111111-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001',
    'Protein kinase A, catalytic subunit',
    'PKA catalytic subunit bound to ATP and substrate peptide — the textbook reference structure for protein kinases.',
    '1ATP', 'https://files.rcsb.org/download/1ATP.pdb', null,
    'enzyme', 'Kinases', 'Mus musculus', 'equilibrium', 2.2, 'cc-by', 'public',
    0, 0, 0, '2026-03-30T10:15:00Z', '2026-03-30T10:15:00Z'),

  ('11111111-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001',
    'Src tyrosine kinase, autoinhibited',
    'Src tyrosine kinase in its closed, autoinhibited conformation — the regulatory baseline that activation has to overcome.',
    '2SRC', 'https://files.rcsb.org/download/2SRC.pdb', null,
    'enzyme', 'Kinases', 'Homo sapiens', 'equilibrium', 1.5, 'cc-by', 'public',
    0, 0, 0, '2026-04-04T17:25:00Z', '2026-04-04T17:25:00Z'),

  ('11111111-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000001',
    'Hen egg-white lysozyme',
    'Classic 129-residue enzyme that cleaves bacterial cell walls. A long-standing benchmark for force-field validation and protein dynamics.',
    '1AKI', 'https://files.rcsb.org/download/1AKI.pdb', null,
    'enzyme', 'Lysozymes', 'Gallus gallus', 'equilibrium', 1.5, 'cc-by', 'public',
    0, 0, 0, '2026-05-20T14:30:00Z', '2026-05-20T14:30:00Z'),

  ('11111111-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000001',
    'Bovine pancreatic trypsin inhibitor (BPTI)',
    'Small, exceptionally stable Kunitz-domain inhibitor of serine proteases — one of the most thoroughly studied proteins in biophysics.',
    '4PTI', 'https://files.rcsb.org/download/4PTI.pdb', null,
    'protein', 'Kunitz inhibitors', 'Bos taurus', 'folding', 1.0, 'cc-by', 'public',
    0, 0, 0, '2026-02-26T09:00:00Z', '2026-02-26T09:00:00Z'),

  ('11111111-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-000000000001',
    'Drew–Dickerson B-DNA dodecamer',
    'The canonical synthetic B-DNA dodecamer (CGCGAATTCGCG). The structural reference for nucleic-acid molecular dynamics.',
    '1BNA', 'https://files.rcsb.org/download/1BNA.pdb', null,
    'dna', null, 'synthetic', 'equilibrium', 1.9, 'cc-by', 'public',
    0, 0, 0, '2026-05-10T11:05:00Z', '2026-05-10T11:05:00Z'),

  ('11111111-0000-0000-0000-00000000000d', '00000000-0000-0000-0000-000000000001',
    'Spinach aquaporin SoPIP2;1',
    'Plant aquaporin that gates water flux through the membrane via a regulatory loop. A model system for membrane-channel gating.',
    '2NWL', 'https://files.rcsb.org/download/2NWL.pdb', null,
    'membrane', 'Aquaporins', 'Spinacia oleracea', 'equilibrium', 1.9, 'cc-by', 'public',
    0, 0, 0, '2026-03-12T16:00:00Z', '2026-03-12T16:00:00Z'),

  ('11111111-0000-0000-0000-00000000000e', '00000000-0000-0000-0000-000000000001',
    'SARS-CoV-2 spike, prefusion closed',
    'Trimeric spike glycoprotein from SARS-CoV-2 in the closed prefusion state. The structure that anchored the first wave of vaccine design.',
    '6VXX', 'https://files.rcsb.org/download/6VXX.pdb', null,
    'protein', 'Coronavirus spike', 'SARS-CoV-2', 'equilibrium', 2.8, 'cc-by', 'public',
    0, 0, 0, '2026-05-15T22:40:00Z', '2026-05-15T22:40:00Z'),

  ('11111111-0000-0000-0000-00000000000f', '00000000-0000-0000-0000-000000000001',
    'Ubiquitin NMR ensemble',
    'Ten NMR-derived conformers of human ubiquitin. Animating between models reveals real backbone-loop flexibility on the 76-residue β-grasp fold.',
    '1D3Z', 'https://files.rcsb.org/download/1D3Z.pdb', null,
    'protein', 'Ubiquitin', 'Homo sapiens', 'folding', null, 'cc-by', 'public',
    0, 0, 0, '2026-02-08T16:45:00Z', '2026-02-08T16:45:00Z'),

  ('11111111-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001',
    'Crambin',
    'A 46-residue plant protein resolved at sub-ångström resolution. A tiny but exceptionally well-resolved benchmark for force fields.',
    '1CRN', 'https://files.rcsb.org/download/1CRN.pdb', null,
    'protein', null, 'Crambe abyssinica', 'folding', 0.54, 'cc-by', 'public',
    0, 0, 0, '2026-04-15T13:20:00Z', '2026-04-15T13:20:00Z'),

  ('11111111-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001',
    'Nucleosome core particle',
    '147 base pairs of DNA wrapped around a histone octamer (two copies of H2A, H2B, H3, H4). The fundamental unit of chromatin.',
    '1KX5', 'https://files.rcsb.org/download/1KX5.pdb', null,
    'protein', 'Histones', 'Xenopus laevis', 'equilibrium', 1.9, 'cc-by', 'public',
    0, 0, 0, '2026-03-05T10:50:00Z', '2026-03-05T10:50:00Z')
on conflict (id) do nothing;

-- Reassert NMR ensemble flag in case the earlier migration was lost.
update public.simulations set has_trajectory = true where pdb_code = '1D3Z';

-- ============================================================================
-- 5. 35 NEW reference simulations. Same attribution. Real PDB codes,
--    family names that line up with the existing facets so /family/<slug>
--    pages have richer pools. Three are NMR ensembles (1L2Y, 1G6J, 1NYB)
--    so has_trajectory flips to true after insert.
-- ============================================================================
insert into public.simulations (
  id, user_id, title, description, pdb_code, pdb_url, thumbnail_url,
  category, protein_family, organism, experiment_type, resolution, license,
  visibility, view_count, like_count, comment_count, created_at, updated_at
) values
  -- Globins (+3)
  ('22222222-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
    'Human deoxyhemoglobin (high resolution)',
    'High-resolution deoxyhemoglobin tetramer. Complements 4HHB for studying allosteric R↔T transitions at finer geometric detail.',
    '2DN1', 'https://files.rcsb.org/download/2DN1.pdb', null,
    'protein', 'Globins', 'Homo sapiens', 'equilibrium', 1.25, 'cc-by', 'public',
    0, 0, 0, '2026-05-21T09:00:00Z', '2026-05-21T09:00:00Z'),

  ('22222222-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
    'Sperm whale myoglobin (CO-bound)',
    'CO-bound myoglobin at 1.0 Å. The reference structure for ligand-migration MD studies.',
    '1A6M', 'https://files.rcsb.org/download/1A6M.pdb', null,
    'protein', 'Globins', 'Physeter macrocephalus', 'binding', 1.0, 'cc-by', 'public',
    0, 0, 0, '2026-05-22T10:00:00Z', '2026-05-22T10:00:00Z'),

  ('22222222-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
    'Sickle hemoglobin (deoxyHbS)',
    'The hemoglobin variant behind sickle-cell disease. A starting point for studying pathological tetramer–tetramer association.',
    '1A3N', 'https://files.rcsb.org/download/1A3N.pdb', null,
    'protein', 'Globins', 'Homo sapiens', 'equilibrium', 1.8, 'cc-by', 'public',
    0, 0, 0, '2026-04-19T12:00:00Z', '2026-04-19T12:00:00Z'),

  -- GPCRs (+4)
  ('22222222-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001',
    'μ-opioid receptor (antagonist-bound)',
    'Antagonist-bound μ-opioid GPCR — the structural baseline for opioid pharmacology and biased-agonism MD.',
    '4DKL', 'https://files.rcsb.org/download/4DKL.pdb', null,
    'receptor', 'GPCRs', 'Mus musculus', 'binding', 2.8, 'cc-by', 'public',
    0, 0, 0, '2026-05-08T15:00:00Z', '2026-05-08T15:00:00Z'),

  ('22222222-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001',
    'β2 adrenergic receptor (carazolol-bound)',
    'The original carazolol-bound β2-AR structure. The reference activation-energy landscape for adrenergic signaling.',
    '2RH1', 'https://files.rcsb.org/download/2RH1.pdb', null,
    'receptor', 'GPCRs', 'Homo sapiens', 'binding', 2.4, 'cc-by', 'public',
    0, 0, 0, '2026-05-09T14:30:00Z', '2026-05-09T14:30:00Z'),

  ('22222222-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001',
    'Bovine rhodopsin, metarhodopsin II',
    'Activated rhodopsin captured post-photoisomerization. Pairs with 6CMO to bracket the visual-pigment activation pathway.',
    '3PQR', 'https://files.rcsb.org/download/3PQR.pdb', null,
    'receptor', 'GPCRs', 'Bos taurus', 'equilibrium', 2.85, 'cc-by', 'public',
    0, 0, 0, '2026-04-30T11:30:00Z', '2026-04-30T11:30:00Z'),

  -- Kinases (+4)
  ('22222222-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001',
    'Abl kinase, autoinhibited',
    'Abl kinase regulatory domains pinning the catalytic domain shut. Imatinib resistance studies often start here.',
    '1OPL', 'https://files.rcsb.org/download/1OPL.pdb', null,
    'enzyme', 'Kinases', 'Homo sapiens', 'equilibrium', 1.8, 'cc-by', 'public',
    0, 0, 0, '2026-04-12T09:00:00Z', '2026-04-12T09:00:00Z'),

  ('22222222-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001',
    'CDK2 in complex with cyclin A',
    'The textbook CDK·cyclin activation pair. The reference for kinase-activation MD.',
    '1HCK', 'https://files.rcsb.org/download/1HCK.pdb', null,
    'enzyme', 'Kinases', 'Homo sapiens', 'binding', 1.9, 'cc-by', 'public',
    0, 0, 0, '2026-04-13T11:00:00Z', '2026-04-13T11:00:00Z'),

  ('22222222-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001',
    'Insulin receptor kinase',
    'Tyrosine kinase domain of the insulin receptor. A standard substrate for activation-loop MD studies.',
    '1IRK', 'https://files.rcsb.org/download/1IRK.pdb', null,
    'enzyme', 'Kinases', 'Homo sapiens', 'equilibrium', 2.1, 'cc-by', 'public',
    0, 0, 0, '2026-04-14T14:00:00Z', '2026-04-14T14:00:00Z'),

  ('22222222-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000001',
    'Hck tyrosine kinase',
    'Src-family kinase Hck in its assembled, near-catalytic conformation. A counterpart to 2SRC for activation comparison.',
    '2HCK', 'https://files.rcsb.org/download/2HCK.pdb', null,
    'enzyme', 'Kinases', 'Homo sapiens', 'equilibrium', 2.6, 'cc-by', 'public',
    0, 0, 0, '2026-04-15T15:30:00Z', '2026-04-15T15:30:00Z'),

  -- Antibodies (+2)
  ('22222222-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000001',
    'HIV neutralizing antibody 2G12',
    'Anti-HIV antibody 2G12 with its unusual domain-swapped Fab dimer. A target-of-opportunity structure for antibody-engineering MD.',
    '1HZH', 'https://files.rcsb.org/download/1HZH.pdb', null,
    'antibody', 'Immunoglobulins', 'Homo sapiens', 'equilibrium', 2.7, 'cc-by', 'public',
    0, 0, 0, '2026-03-26T10:30:00Z', '2026-03-26T10:30:00Z'),

  ('22222222-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-000000000001',
    'Full-length murine IgG1',
    'Complete IgG1 with both Fab arms and Fc resolved. Useful for hinge-flexibility studies.',
    '1IGY', 'https://files.rcsb.org/download/1IGY.pdb', null,
    'antibody', 'Immunoglobulins', 'Mus musculus', 'equilibrium', 2.8, 'cc-by', 'public',
    0, 0, 0, '2026-03-27T11:00:00Z', '2026-03-27T11:00:00Z'),

  -- Lysozymes / classic enzymes (+5)
  ('22222222-0000-0000-0000-00000000000d', '00000000-0000-0000-0000-000000000001',
    'T4 lysozyme (wild type)',
    'The all-time benchmark protein for hydrophobic-core mutational MD. Hundreds of papers use this fold as a reference.',
    '2LZM', 'https://files.rcsb.org/download/2LZM.pdb', null,
    'enzyme', 'Lysozymes', 'Enterobacteria phage T4', 'equilibrium', 1.7, 'cc-by', 'public',
    0, 0, 0, '2026-05-25T09:00:00Z', '2026-05-25T09:00:00Z'),

  ('22222222-0000-0000-0000-00000000000e', '00000000-0000-0000-0000-000000000001',
    'Dihydrofolate reductase (E. coli)',
    'E. coli DHFR — the textbook system for studying enzyme catalysis and ligand selectivity via MD.',
    '1RA9', 'https://files.rcsb.org/download/1RA9.pdb', null,
    'enzyme', 'Reductases', 'Escherichia coli', 'binding', 1.55, 'cc-by', 'public',
    0, 0, 0, '2026-04-21T14:00:00Z', '2026-04-21T14:00:00Z'),

  ('22222222-0000-0000-0000-00000000000f', '00000000-0000-0000-0000-000000000001',
    'Bovine trypsin + BPTI complex',
    'Serine-protease–inhibitor complex at 1.9 Å. The textbook drug-binding pose for trypsin-family enzymes.',
    '2PTC', 'https://files.rcsb.org/download/2PTC.pdb', null,
    'drug-complex', 'Trypsin', 'Bos taurus', 'binding', 1.9, 'cc-by', 'public',
    0, 0, 0, '2026-04-22T15:30:00Z', '2026-04-22T15:30:00Z'),

  ('22222222-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001',
    'Proteinase K',
    'Broad-spectrum serine protease widely used in molecular biology — and a long-time MD reference for protease dynamics.',
    '1PEK', 'https://files.rcsb.org/download/1PEK.pdb', null,
    'enzyme', 'Subtilases', 'Engyodontium album', 'equilibrium', 1.5, 'cc-by', 'public',
    0, 0, 0, '2026-04-23T16:00:00Z', '2026-04-23T16:00:00Z'),

  ('22222222-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001',
    'Yeast 20S proteasome',
    'The 20S core of the yeast proteasome — multi-subunit reference for protein-degradation MD.',
    '1RYP', 'https://files.rcsb.org/download/1RYP.pdb', null,
    'enzyme', 'Proteasome', 'Saccharomyces cerevisiae', 'equilibrium', 2.4, 'cc-by', 'public',
    0, 0, 0, '2026-04-24T17:30:00Z', '2026-04-24T17:30:00Z'),

  -- Membrane channels (+3)
  ('22222222-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001',
    'Aquaporin-1 (bovine)',
    'The first solved water channel. Defining structure for permeation-mechanism MD.',
    '1J4N', 'https://files.rcsb.org/download/1J4N.pdb', null,
    'membrane', 'Aquaporins', 'Bos taurus', 'equilibrium', 2.2, 'cc-by', 'public',
    0, 0, 0, '2026-03-17T10:00:00Z', '2026-03-17T10:00:00Z'),

  ('22222222-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001',
    'MscL mechanosensitive channel',
    'M. tuberculosis MscL pentamer. The reference structure for tension-gated channels.',
    '1MSL', 'https://files.rcsb.org/download/1MSL.pdb', null,
    'membrane', 'Mechanosensitive channels', 'Mycobacterium tuberculosis', 'equilibrium', 3.5, 'cc-by', 'public',
    0, 0, 0, '2026-03-18T11:30:00Z', '2026-03-18T11:30:00Z'),

  ('22222222-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001',
    'Kv1.2 voltage-gated K⁺ channel',
    'Rat Kv1.2 tetramer in a lipid environment. The reference for voltage-sensor MD work.',
    '4HFE', 'https://files.rcsb.org/download/4HFE.pdb', null,
    'membrane', 'Voltage-gated channels', 'Rattus norvegicus', 'equilibrium', 2.9, 'cc-by', 'public',
    0, 0, 0, '2026-03-19T12:30:00Z', '2026-03-19T12:30:00Z'),

  -- Nucleic acids (+2)
  ('22222222-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001',
    'Yeast tRNA-Phe',
    'The classical L-shaped tRNA structure. A staple for RNA-dynamics MD.',
    '1F27', 'https://files.rcsb.org/download/1F27.pdb', null,
    'rna', 'tRNA', 'Saccharomyces cerevisiae', 'equilibrium', 2.45, 'cc-by', 'public',
    0, 0, 0, '2026-03-09T09:00:00Z', '2026-03-09T09:00:00Z'),

  ('22222222-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001',
    'A-DNA dodecamer NMR ensemble',
    'NMR-derived A-DNA ensemble (15 models). Animate to see real base-pair breathing.',
    '1NYB', 'https://files.rcsb.org/download/1NYB.pdb', null,
    'dna', null, 'synthetic', 'equilibrium', null, 'cc-by', 'public',
    0, 0, 0, '2026-03-10T10:30:00Z', '2026-03-10T10:30:00Z'),

  -- Viral surface (+2)
  ('22222222-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001',
    'SARS-CoV-2 RBD bound to ACE2',
    'The receptor-binding-domain–ACE2 interface. The structure that anchored the first wave of therapeutic-antibody design.',
    '6M0J', 'https://files.rcsb.org/download/6M0J.pdb', null,
    'protein', 'Coronavirus spike', 'SARS-CoV-2', 'binding', 2.45, 'cc-by', 'public',
    0, 0, 0, '2026-05-26T12:00:00Z', '2026-05-26T12:00:00Z'),

  ('22222222-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001',
    'HIV gp120 CD4-bound',
    'CD4-engaged HIV envelope glycoprotein. A reference for entry-inhibitor MD.',
    '1RD8', 'https://files.rcsb.org/download/1RD8.pdb', null,
    'protein', 'HIV envelope', 'Human immunodeficiency virus 1', 'binding', 2.2, 'cc-by', 'public',
    0, 0, 0, '2026-05-27T13:30:00Z', '2026-05-27T13:30:00Z'),

  -- Drug-complex (+2)
  ('22222222-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000001',
    'HIV-1 protease + cyclic urea inhibitor',
    'HIV-1 protease bound to the cyclic-urea inhibitor that anchored the first-generation drug-design MD studies.',
    '1HVR', 'https://files.rcsb.org/download/1HVR.pdb', null,
    'drug-complex', 'Aspartyl proteases', 'Human immunodeficiency virus 1', 'binding', 1.8, 'cc-by', 'public',
    0, 0, 0, '2026-02-15T12:00:00Z', '2026-02-15T12:00:00Z'),

  ('22222222-0000-0000-0000-00000000001a', '00000000-0000-0000-0000-000000000001',
    'Streptavidin–biotin complex',
    'The reference ultra-tight ligand-binding pair. A go-to system for free-energy MD benchmarks.',
    '1STP', 'https://files.rcsb.org/download/1STP.pdb', null,
    'drug-complex', 'Avidins', 'Streptomyces avidinii', 'binding', 2.6, 'cc-by', 'public',
    0, 0, 0, '2026-02-16T13:00:00Z', '2026-02-16T13:00:00Z'),

  -- Folding / small reference systems (+4)
  ('22222222-0000-0000-0000-00000000001b', '00000000-0000-0000-0000-000000000001',
    'Trp-cage NMR ensemble',
    'Trp-cage miniprotein, 38 NMR-derived conformers. The smallest stable fold ever characterised — and the workhorse for folding MD benchmarks.',
    '1L2Y', 'https://files.rcsb.org/download/1L2Y.pdb', null,
    'protein', 'Miniproteins', 'synthetic', 'folding', null, 'cc-by', 'public',
    0, 0, 0, '2026-02-01T09:30:00Z', '2026-02-01T09:30:00Z'),

  ('22222222-0000-0000-0000-00000000001c', '00000000-0000-0000-0000-000000000001',
    'Villin headpiece subdomain',
    'The 35-residue villin subdomain, one of the fastest-folding proteins known. A standard fast-folding MD reference.',
    '1VII', 'https://files.rcsb.org/download/1VII.pdb', null,
    'protein', 'Miniproteins', 'Gallus gallus', 'folding', null, 'cc-by', 'public',
    0, 0, 0, '2026-02-02T10:30:00Z', '2026-02-02T10:30:00Z'),

  ('22222222-0000-0000-0000-00000000001d', '00000000-0000-0000-0000-000000000001',
    'Calmodulin NMR ensemble',
    'Calmodulin captured as a 32-model NMR ensemble. Animation reveals real central-helix flexibility — the basis for its target-binding versatility.',
    '1G6J', 'https://files.rcsb.org/download/1G6J.pdb', null,
    'protein', 'EF-hand', 'Homo sapiens', 'equilibrium', null, 'cc-by', 'public',
    0, 0, 0, '2026-02-03T11:30:00Z', '2026-02-03T11:30:00Z'),

  ('22222222-0000-0000-0000-00000000001e', '00000000-0000-0000-0000-000000000001',
    'Green fluorescent protein',
    'Aequorea victoria GFP β-barrel. A photophysics-MD reference; useful for chromophore-environment studies.',
    '1EMA', 'https://files.rcsb.org/download/1EMA.pdb', null,
    'protein', 'Fluorescent proteins', 'Aequorea victoria', 'equilibrium', 1.9, 'cc-by', 'public',
    0, 0, 0, '2026-02-04T12:30:00Z', '2026-02-04T12:30:00Z'),

  -- Misc reference proteins (+5)
  ('22222222-0000-0000-0000-00000000001f', '00000000-0000-0000-0000-000000000001',
    'Bcl-XL anti-apoptotic',
    'Anti-apoptotic Bcl-XL. The reference structure for BH3-domain interaction MD and small-molecule binding studies.',
    '1BLB', 'https://files.rcsb.org/download/1BLB.pdb', null,
    'protein', 'Bcl-2 family', 'Homo sapiens', 'binding', 2.3, 'cc-by', 'public',
    0, 0, 0, '2026-03-01T13:00:00Z', '2026-03-01T13:00:00Z'),

  ('22222222-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001',
    'G-actin (ATP-bound)',
    'Monomeric ATP-bound actin in complex with DNase I. A starting point for actin-polymerisation MD.',
    '1ATN', 'https://files.rcsb.org/download/1ATN.pdb', null,
    'protein', 'Actin', 'Oryctolagus cuniculus', 'equilibrium', 2.8, 'cc-by', 'public',
    0, 0, 0, '2026-03-02T14:30:00Z', '2026-03-02T14:30:00Z'),

  ('22222222-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001',
    'Bluetongue virus capsid (single subunit)',
    'A subunit of the bluetongue inner capsid. Reference structure for virus-assembly MD at the subunit level.',
    '2WCD', 'https://files.rcsb.org/download/2WCD.pdb', null,
    'protein', 'Viral capsids', 'Bluetongue virus', 'equilibrium', 2.2, 'cc-by', 'public',
    0, 0, 0, '2026-03-03T15:30:00Z', '2026-03-03T15:30:00Z'),

  ('22222222-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001',
    'Nucleosome (Xenopus, alternative)',
    'Companion nucleosome reference (Xenopus) at distinct geometry. Pairs with 1KX5 for chromatin-dynamics comparison MD.',
    '1KX2', 'https://files.rcsb.org/download/1KX2.pdb', null,
    'protein', 'Histones', 'Xenopus laevis', 'equilibrium', 2.7, 'cc-by', 'public',
    0, 0, 0, '2026-03-04T16:30:00Z', '2026-03-04T16:30:00Z'),

  ('22222222-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001',
    'M3 muscarinic acetylcholine receptor',
    'Antagonist-bound M3 muscarinic GPCR. Pairs with the β-adrenergic and opioid systems for cross-family GPCR comparison.',
    '6OLQ', 'https://files.rcsb.org/download/6OLQ.pdb', null,
    'receptor', 'GPCRs', 'Rattus norvegicus', 'binding', 2.85, 'cc-by', 'public',
    0, 0, 0, '2026-04-25T10:00:00Z', '2026-04-25T10:00:00Z')
on conflict (id) do nothing;

-- Mark the three NMR ensembles as having real motion.
update public.simulations
   set has_trajectory = true
 where pdb_code in ('1L2Y', '1G6J', '1NYB');
