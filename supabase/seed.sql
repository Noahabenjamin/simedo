-- Seed data: one Helix Team account that owns the 17 reference simulations.
-- We chose a single curator over inventing fictional researchers — the
-- platform stays populated without claiming users it doesn't have.
-- Run after migrations.

-- ============================================================================
-- Helix Team auth account. Password intentionally not set; this account
-- can't be logged into. It exists so the reference simulations have an
-- author record to FK against until real users upload their own work.
-- ============================================================================
insert into auth.users (id, email, raw_user_meta_data, created_at, email_confirmed_at)
values
  ('00000000-0000-0000-0000-000000000001',
   'team@helix.example',
   '{"username":"helix-team","display_name":"Helix Team","is_seed":true}'::jsonb,
   '2025-09-01', '2025-09-01')
on conflict (id) do nothing;

-- handle_new_auth_user trigger already created the public.users row.
update public.users set
  bio = 'Reference structures curated by the Helix team. Browse to explore — upload your own simulation to claim a real profile.',
  institution = null,
  is_verified_academic = false,
  avatar_url = 'https://api.dicebear.com/9.x/shapes/svg?seed=helix-team&backgroundColor=0a1437&shape1Color=2563eb&shape2Color=60a5fa&shape3Color=93c5fd'
  where id = '00000000-0000-0000-0000-000000000001';

-- ============================================================================
-- Simulations — the 17 we previously had in mock-data.ts
-- ============================================================================
insert into public.simulations (
  id, user_id, title, description, pdb_code, pdb_url, thumbnail_url,
  category, protein_family, organism, experiment_type, resolution, license,
  visibility, view_count, like_count, comment_count, created_at, updated_at
) values
  ('11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
    'Oxyhemoglobin, R state',
    'Human hemoglobin in the oxygen-bound R state. The classic structure that captures cooperative binding mid-cycle.',
    '1HHO', 'https://files.rcsb.org/download/1HHO.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=1HHO&font=roboto',
    'protein', 'Globins', 'Homo sapiens', 'equilibrium', 2.1, 'cc-by', 'public',
    0, 0, 0, '2026-05-18T09:12:00Z', '2026-05-18T09:12:00Z'),

  ('11111111-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
    'Deoxyhemoglobin, T state',
    'Human deoxyhemoglobin in the tense T state. Pairs naturally with 1HHO to study the allosteric switch behind cooperative oxygen binding.',
    '4HHB', 'https://files.rcsb.org/download/4HHB.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=4HHB&font=roboto',
    'protein', 'Globins', 'Homo sapiens', 'equilibrium', 1.74, 'cc-by', 'public',
    0, 0, 0, '2026-04-28T18:55:00Z', '2026-04-28T18:55:00Z'),

  ('11111111-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
    'Sperm whale myoglobin',
    'The first protein structure ever solved by X-ray crystallography (Kendrew, 1958). Still a benchmark for oxygen-storage dynamics.',
    '1MBN', 'https://files.rcsb.org/download/1MBN.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=1MBN&font=roboto',
    'protein', 'Globins', 'Physeter macrocephalus', 'equilibrium', 2.0, 'cc-by', 'public',
    0, 0, 0, '2026-05-02T11:20:00Z', '2026-05-02T11:20:00Z'),

  ('11111111-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001',
    'β2 adrenergic receptor–Gs complex',
    'β2 adrenergic receptor captured coupled to its heterotrimeric Gs partner. A landmark GPCR signaling complex.',
    '3SN6', 'https://files.rcsb.org/download/3SN6.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=3SN6&font=roboto',
    'receptor', 'GPCRs', 'Homo sapiens', 'binding', 3.2, 'cc-by', 'public',
    0, 0, 0, '2026-05-12T15:40:00Z', '2026-05-12T15:40:00Z'),

  ('11111111-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001',
    'Bovine rhodopsin, dark state',
    'Bovine rhodopsin in its dark resting state. A cornerstone for visual-pigment activation dynamics.',
    '6CMO', 'https://files.rcsb.org/download/6CMO.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=6CMO&font=roboto',
    'receptor', 'GPCRs', 'Bos taurus', 'equilibrium', 3.0, 'cc-by', 'public',
    0, 0, 0, '2026-04-22T19:10:00Z', '2026-04-22T19:10:00Z'),

  ('11111111-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001',
    'CRISPR-Cas9 with sgRNA and DNA',
    'Cas9 bound to a single-guide RNA and target DNA. The complete editing complex in a cleavage-ready geometry.',
    '4OO8', 'https://files.rcsb.org/download/4OO8.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=4OO8&font=roboto',
    'enzyme', 'CRISPR-Cas9', 'Streptococcus pyogenes', 'equilibrium', 2.5, 'cc-by', 'public',
    0, 0, 0, '2026-05-15T08:30:00Z', '2026-05-15T08:30:00Z'),

  ('11111111-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001',
    'Intact mouse IgG2a antibody',
    'One of the few full-length immunoglobulin structures available — hinges, Fab arms, and Fc all resolved.',
    '1IGT', 'https://files.rcsb.org/download/1IGT.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=1IGT&font=roboto',
    'antibody', 'Immunoglobulins', 'Mus musculus', 'equilibrium', 2.8, 'cc-by', 'public',
    0, 0, 0, '2026-04-09T13:45:00Z', '2026-04-09T13:45:00Z'),

  ('11111111-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001',
    'Protein kinase A, catalytic subunit',
    'PKA catalytic subunit bound to ATP and substrate peptide — the textbook reference structure for protein kinases.',
    '1ATP', 'https://files.rcsb.org/download/1ATP.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=1ATP&font=roboto',
    'enzyme', 'Kinases', 'Mus musculus', 'equilibrium', 2.2, 'cc-by', 'public',
    0, 0, 0, '2026-03-30T10:15:00Z', '2026-03-30T10:15:00Z'),

  ('11111111-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001',
    'Src tyrosine kinase, autoinhibited',
    'Src tyrosine kinase in its closed, autoinhibited conformation — the regulatory baseline that activation has to overcome.',
    '2SRC', 'https://files.rcsb.org/download/2SRC.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=2SRC&font=roboto',
    'enzyme', 'Kinases', 'Homo sapiens', 'equilibrium', 1.5, 'cc-by', 'public',
    0, 0, 0, '2026-04-04T17:25:00Z', '2026-04-04T17:25:00Z'),

  ('11111111-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000001',
    'Hen egg-white lysozyme',
    'Classic 129-residue enzyme that cleaves bacterial cell walls. A long-standing benchmark for force-field validation and protein dynamics.',
    '1AKI', 'https://files.rcsb.org/download/1AKI.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=1AKI&font=roboto',
    'enzyme', 'Lysozymes', 'Gallus gallus', 'equilibrium', 1.5, 'cc-by', 'public',
    0, 0, 0, '2026-05-20T14:30:00Z', '2026-05-20T14:30:00Z'),

  ('11111111-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000001',
    'Bovine pancreatic trypsin inhibitor (BPTI)',
    'Small, exceptionally stable Kunitz-domain inhibitor of serine proteases — one of the most thoroughly studied proteins in biophysics.',
    '4PTI', 'https://files.rcsb.org/download/4PTI.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=4PTI&font=roboto',
    'protein', 'Kunitz inhibitors', 'Bos taurus', 'folding', 1.0, 'cc-by', 'public',
    0, 0, 0, '2026-02-26T09:00:00Z', '2026-02-26T09:00:00Z'),

  ('11111111-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-000000000001',
    'Drew–Dickerson B-DNA dodecamer',
    'Twelve base pairs of canonical B-form DNA — the dodecamer that defined our picture of double-helix geometry.',
    '1BNA', 'https://files.rcsb.org/download/1BNA.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=1BNA&font=roboto',
    'dna', null, 'synthetic', 'equilibrium', 1.9, 'cc-by', 'public',
    0, 0, 0, '2026-05-10T11:05:00Z', '2026-05-10T11:05:00Z'),

  ('11111111-0000-0000-0000-00000000000d', '00000000-0000-0000-0000-000000000001',
    'Spinach aquaporin SoPIP2;1',
    'A tetrameric water channel embedded in a plant plasma membrane. Each monomer gates water flow through a narrow selectivity filter.',
    '2NWL', 'https://files.rcsb.org/download/2NWL.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=2NWL&font=roboto',
    'membrane', 'Aquaporins', 'Spinacia oleracea', 'equilibrium', 1.9, 'cc-by', 'public',
    0, 0, 0, '2026-03-12T16:00:00Z', '2026-03-12T16:00:00Z'),

  ('11111111-0000-0000-0000-00000000000e', '00000000-0000-0000-0000-000000000001',
    'SARS-CoV-2 spike, closed prefusion',
    'Closed-trimer prefusion conformation of the spike glycoprotein. The starting state for receptor-binding-domain opening dynamics.',
    '6VXX', 'https://files.rcsb.org/download/6VXX.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=6VXX&font=roboto',
    'protein', 'Coronavirus spike', 'SARS-CoV-2', 'equilibrium', 2.8, 'cc-by', 'public',
    0, 0, 0, '2026-05-15T22:40:00Z', '2026-05-15T22:40:00Z'),

  ('11111111-0000-0000-0000-00000000000f', '00000000-0000-0000-0000-000000000001',
    'Ubiquitin NMR ensemble',
    'Ten NMR-derived conformers of human ubiquitin. Animating between models reveals real backbone-loop flexibility on the 76-residue β-grasp fold.',
    '1D3Z', 'https://files.rcsb.org/download/1D3Z.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=1D3Z&font=roboto',
    'protein', 'Ubiquitin', 'Homo sapiens', 'folding', null, 'cc-by', 'public',
    0, 0, 0, '2026-02-08T16:45:00Z', '2026-02-08T16:45:00Z'),

  ('11111111-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001',
    'Crambin',
    'A 46-residue plant protein resolved at sub-ångström resolution. A tiny but exceptionally well-resolved benchmark for force fields.',
    '1CRN', 'https://files.rcsb.org/download/1CRN.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=1CRN&font=roboto',
    'protein', null, 'Crambe abyssinica', 'folding', 0.54, 'cc-by', 'public',
    0, 0, 0, '2026-04-15T13:20:00Z', '2026-04-15T13:20:00Z'),

  ('11111111-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001',
    'Nucleosome core particle',
    '147 base pairs of DNA wrapped around a histone octamer (two copies of H2A, H2B, H3, H4). The fundamental unit of chromatin.',
    '1KX5', 'https://files.rcsb.org/download/1KX5.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=1KX5&font=roboto',
    'protein', 'Histones', 'Xenopus laevis', 'equilibrium', 1.9, 'cc-by', 'public',
    0, 0, 0, '2026-03-05T10:50:00Z', '2026-03-05T10:50:00Z')
on conflict (id) do nothing;

-- Flag the sims that have real motion to play back.
-- 1D3Z is an NMR ensemble (10 models) so the viewer can animate model-to-model.
-- Every other seed sim is structure-only.
update public.simulations
  set has_trajectory = true
  where pdb_code = '1D3Z';

-- Sprinkle some likes and tags so the platform doesn't feel cold.
insert into public.tags (name) values
  ('enzyme'), ('benchmark'), ('protein'), ('oxygen-transport'), ('allosteric'),
  ('tetramer'), ('signaling'), ('membrane'), ('virus'), ('drug-binding'),
  ('genome-editing'), ('classic'), ('small-protein'), ('chromatin'), ('DNA'),
  ('nucleic-acid'), ('helix'), ('water-channel'), ('phosphorylation'),
  ('autoinhibition'), ('immunology')
on conflict (name) do nothing;
