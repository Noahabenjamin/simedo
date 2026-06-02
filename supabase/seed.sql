-- Seed data: 8 fake but realistic-looking academic users + the 17 simulations
-- currently in lib/mock-data.ts. Run after migrations.

-- ============================================================================
-- Fake auth.users rows. Passwords intentionally not set; these accounts can't
-- be logged into. They exist so simulations have author records to FK against.
-- ============================================================================
insert into auth.users (id, email, raw_user_meta_data, created_at, email_confirmed_at)
values
  ('00000000-0000-0000-0000-000000000001', 'mira@example.helix', '{"username":"miraokafor","display_name":"Mira Okafor"}'::jsonb, '2025-09-01', '2025-09-01'),
  ('00000000-0000-0000-0000-000000000002', 'jin@example.helix',  '{"username":"jtanaka","display_name":"Jin Tanaka"}'::jsonb,  '2025-09-01', '2025-09-01'),
  ('00000000-0000-0000-0000-000000000003', 'sofia@example.helix','{"username":"svargas","display_name":"Sofia Vargas"}'::jsonb,'2025-09-01', '2025-09-01'),
  ('00000000-0000-0000-0000-000000000004', 'henrik@example.helix','{"username":"hnilsson","display_name":"Henrik Nilsson"}'::jsonb,'2025-09-01', '2025-09-01'),
  ('00000000-0000-0000-0000-000000000005', 'priya@example.helix','{"username":"piyer","display_name":"Priya Iyer"}'::jsonb,'2025-09-01', '2025-09-01'),
  ('00000000-0000-0000-0000-000000000006', 'daniel@example.helix','{"username":"dcohen","display_name":"Daniel Cohen"}'::jsonb,'2025-09-01', '2025-09-01'),
  ('00000000-0000-0000-0000-000000000007', 'aisha@example.helix','{"username":"amwangi","display_name":"Aisha Mwangi"}'::jsonb,'2025-09-01', '2025-09-01'),
  ('00000000-0000-0000-0000-000000000008', 'lukas@example.helix','{"username":"lbecker","display_name":"Lukas Becker"}'::jsonb,'2025-09-01', '2025-09-01'),
  ('00000000-0000-0000-0000-000000000009', 'anya@example.helix','{"username":"apetrova","display_name":"Anya Petrova"}'::jsonb,'2025-09-01', '2025-09-01'),
  ('00000000-0000-0000-0000-00000000000a', 'marcus@example.helix','{"username":"madebayo","display_name":"Marcus Adebayo"}'::jsonb,'2025-09-01', '2025-09-01'),
  ('00000000-0000-0000-0000-00000000000b', 'yuki@example.helix','{"username":"ysato","display_name":"Yuki Sato"}'::jsonb,'2025-09-01', '2025-09-01'),
  ('00000000-0000-0000-0000-00000000000c', 'elena@example.helix','{"username":"erossi","display_name":"Elena Rossi"}'::jsonb,'2025-09-01', '2025-09-01')
on conflict (id) do nothing;

-- handle_new_auth_user trigger already created the public.users rows.
-- Now backfill profiles with real institutional context so they feel populated.
update public.users set
  bio = 'Computational biologist studying enzyme dynamics.',
  institution = 'Imperial College London',
  is_verified_academic = true,
  avatar_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Mira%20Okafor&backgroundColor=0F6E56'
  where id = '00000000-0000-0000-0000-000000000001';

update public.users set
  bio = 'Hemoglobin allostery, oxygen transport, molecular dynamics.',
  institution = 'RIKEN',
  is_verified_academic = true,
  avatar_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Jin%20Tanaka&backgroundColor=0F6E56'
  where id = '00000000-0000-0000-0000-000000000002';

update public.users set
  bio = 'Viral surface proteins and antibody recognition.',
  institution = 'Universidad Nacional Autónoma de México',
  is_verified_academic = true,
  avatar_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Sofia%20Vargas&backgroundColor=0F6E56'
  where id = '00000000-0000-0000-0000-000000000003';

update public.users set
  bio = 'Nucleic acid structure and dynamics.',
  institution = 'Karolinska Institutet',
  is_verified_academic = true,
  avatar_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Henrik%20Nilsson&backgroundColor=0F6E56'
  where id = '00000000-0000-0000-0000-000000000004';

update public.users set
  bio = 'Conformational sampling and protein folding.',
  institution = 'Indian Institute of Science',
  is_verified_academic = true,
  avatar_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Priya%20Iyer&backgroundColor=0F6E56'
  where id = '00000000-0000-0000-0000-000000000005';

update public.users set
  bio = 'Kinase regulation and signal transduction.',
  institution = 'Weizmann Institute of Science',
  is_verified_academic = true,
  avatar_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Daniel%20Cohen&backgroundColor=0F6E56'
  where id = '00000000-0000-0000-0000-000000000006';

update public.users set
  bio = 'Membrane protein dynamics and ion channels.',
  institution = 'University of Nairobi',
  is_verified_academic = true,
  avatar_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Aisha%20Mwangi&backgroundColor=0F6E56'
  where id = '00000000-0000-0000-0000-000000000007';

update public.users set
  bio = 'Force-field development and protein folding kinetics.',
  institution = 'Max Planck Institute for Biophysics',
  is_verified_academic = true,
  avatar_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Lukas%20Becker&backgroundColor=0F6E56'
  where id = '00000000-0000-0000-0000-000000000008';

update public.users set
  bio = 'Tyrosine kinase autoinhibition and Src-family dynamics.',
  institution = 'EPFL',
  is_verified_academic = true,
  avatar_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Anya%20Petrova&backgroundColor=0F6E56'
  where id = '00000000-0000-0000-0000-000000000009';

update public.users set
  bio = 'CRISPR-Cas9 cleavage mechanism in atomistic detail.',
  institution = 'University of Ibadan',
  is_verified_academic = true,
  avatar_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Marcus%20Adebayo&backgroundColor=0F6E56'
  where id = '00000000-0000-0000-0000-00000000000a';

update public.users set
  bio = 'Visual rhodopsin and GPCR signaling in lipid bilayers.',
  institution = 'Kyoto University',
  is_verified_academic = true,
  avatar_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Yuki%20Sato&backgroundColor=0F6E56'
  where id = '00000000-0000-0000-0000-00000000000b';

update public.users set
  bio = 'Chromatin organization and histone dynamics.',
  institution = 'Università di Bologna',
  is_verified_academic = true,
  avatar_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Elena%20Rossi&backgroundColor=0F6E56'
  where id = '00000000-0000-0000-0000-00000000000c';

-- ============================================================================
-- Simulations — the 17 we previously had in mock-data.ts
-- ============================================================================
insert into public.simulations (
  id, user_id, title, description, pdb_code, pdb_url, thumbnail_url,
  category, protein_family, organism, experiment_type, resolution, license,
  visibility, view_count, like_count, comment_count, created_at, updated_at
) values
  ('11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
    'Oxyhemoglobin, R state',
    'Human hemoglobin in the oxygen-bound R state. The classic structure that captures cooperative binding mid-cycle.',
    '1HHO', 'https://files.rcsb.org/download/1HHO.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=1HHO&font=roboto',
    'protein', 'Globins', 'Homo sapiens', 'equilibrium', 2.1, 'cc-by', 'public',
    0, 0, 0, '2026-05-18T09:12:00Z', '2026-05-18T09:12:00Z'),

  ('11111111-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005',
    'Deoxyhemoglobin, T state',
    'Human deoxyhemoglobin in the tense T state. Pairs naturally with 1HHO to study the allosteric switch behind cooperative oxygen binding.',
    '4HHB', 'https://files.rcsb.org/download/4HHB.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=4HHB&font=roboto',
    'protein', 'Globins', 'Homo sapiens', 'equilibrium', 1.74, 'cc-by', 'public',
    0, 0, 0, '2026-04-28T18:55:00Z', '2026-04-28T18:55:00Z'),

  ('11111111-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004',
    'Sperm whale myoglobin',
    'The first protein structure ever solved by X-ray crystallography (Kendrew, 1958). Still a benchmark for oxygen-storage dynamics.',
    '1MBN', 'https://files.rcsb.org/download/1MBN.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=1MBN&font=roboto',
    'protein', 'Globins', 'Physeter macrocephalus', 'equilibrium', 2.0, 'cc-by', 'public',
    0, 0, 0, '2026-05-02T11:20:00Z', '2026-05-02T11:20:00Z'),

  ('11111111-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003',
    'β2 adrenergic receptor–Gs complex',
    'β2 adrenergic receptor captured coupled to its heterotrimeric Gs partner. A landmark GPCR signaling complex.',
    '3SN6', 'https://files.rcsb.org/download/3SN6.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=3SN6&font=roboto',
    'receptor', 'GPCRs', 'Homo sapiens', 'binding', 3.2, 'cc-by', 'public',
    0, 0, 0, '2026-05-12T15:40:00Z', '2026-05-12T15:40:00Z'),

  ('11111111-0000-0000-0000-000000000005', '00000000-0000-0000-0000-00000000000b',
    'Bovine rhodopsin, dark state',
    'Bovine rhodopsin in its dark resting state. A cornerstone for visual-pigment activation dynamics.',
    '6CMO', 'https://files.rcsb.org/download/6CMO.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=6CMO&font=roboto',
    'receptor', 'GPCRs', 'Bos taurus', 'equilibrium', 3.0, 'cc-by', 'public',
    0, 0, 0, '2026-04-22T19:10:00Z', '2026-04-22T19:10:00Z'),

  ('11111111-0000-0000-0000-000000000006', '00000000-0000-0000-0000-00000000000a',
    'CRISPR-Cas9 with sgRNA and DNA',
    'Cas9 bound to a single-guide RNA and target DNA. The complete editing complex in a cleavage-ready geometry.',
    '4OO8', 'https://files.rcsb.org/download/4OO8.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=4OO8&font=roboto',
    'enzyme', 'CRISPR-Cas9', 'Streptococcus pyogenes', 'equilibrium', 2.5, 'cc-by', 'public',
    0, 0, 0, '2026-05-15T08:30:00Z', '2026-05-15T08:30:00Z'),

  ('11111111-0000-0000-0000-000000000007', '00000000-0000-0000-0000-00000000000c',
    'Intact mouse IgG2a antibody',
    'One of the few full-length immunoglobulin structures available — hinges, Fab arms, and Fc all resolved.',
    '1IGT', 'https://files.rcsb.org/download/1IGT.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=1IGT&font=roboto',
    'antibody', 'Immunoglobulins', 'Mus musculus', 'equilibrium', 2.8, 'cc-by', 'public',
    0, 0, 0, '2026-04-09T13:45:00Z', '2026-04-09T13:45:00Z'),

  ('11111111-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000006',
    'Protein kinase A, catalytic subunit',
    'PKA catalytic subunit bound to ATP and substrate peptide — the textbook reference structure for protein kinases.',
    '1ATP', 'https://files.rcsb.org/download/1ATP.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=1ATP&font=roboto',
    'enzyme', 'Kinases', 'Mus musculus', 'equilibrium', 2.2, 'cc-by', 'public',
    0, 0, 0, '2026-03-30T10:15:00Z', '2026-03-30T10:15:00Z'),

  ('11111111-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000009',
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

  ('11111111-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000008',
    'Bovine pancreatic trypsin inhibitor (BPTI)',
    'Small, exceptionally stable Kunitz-domain inhibitor of serine proteases — one of the most thoroughly studied proteins in biophysics.',
    '4PTI', 'https://files.rcsb.org/download/4PTI.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=4PTI&font=roboto',
    'protein', 'Kunitz inhibitors', 'Bos taurus', 'folding', 1.0, 'cc-by', 'public',
    0, 0, 0, '2026-02-26T09:00:00Z', '2026-02-26T09:00:00Z'),

  ('11111111-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-000000000004',
    'Drew–Dickerson B-DNA dodecamer',
    'Twelve base pairs of canonical B-form DNA — the dodecamer that defined our picture of double-helix geometry.',
    '1BNA', 'https://files.rcsb.org/download/1BNA.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=1BNA&font=roboto',
    'dna', null, 'synthetic', 'equilibrium', 1.9, 'cc-by', 'public',
    0, 0, 0, '2026-05-10T11:05:00Z', '2026-05-10T11:05:00Z'),

  ('11111111-0000-0000-0000-00000000000d', '00000000-0000-0000-0000-000000000007',
    'Spinach aquaporin SoPIP2;1',
    'A tetrameric water channel embedded in a plant plasma membrane. Each monomer gates water flow through a narrow selectivity filter.',
    '2NWL', 'https://files.rcsb.org/download/2NWL.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=2NWL&font=roboto',
    'membrane', 'Aquaporins', 'Spinacia oleracea', 'equilibrium', 1.9, 'cc-by', 'public',
    0, 0, 0, '2026-03-12T16:00:00Z', '2026-03-12T16:00:00Z'),

  ('11111111-0000-0000-0000-00000000000e', '00000000-0000-0000-0000-000000000003',
    'SARS-CoV-2 spike, closed prefusion',
    'Closed-trimer prefusion conformation of the spike glycoprotein. The starting state for receptor-binding-domain opening dynamics.',
    '6VXX', 'https://files.rcsb.org/download/6VXX.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=6VXX&font=roboto',
    'protein', 'Coronavirus spike', 'SARS-CoV-2', 'equilibrium', 2.8, 'cc-by', 'public',
    0, 0, 0, '2026-05-15T22:40:00Z', '2026-05-15T22:40:00Z'),

  ('11111111-0000-0000-0000-00000000000f', '00000000-0000-0000-0000-000000000008',
    'Ubiquitin NMR ensemble',
    'Ten NMR-derived conformers of human ubiquitin. Animating between models reveals real backbone-loop flexibility on the 76-residue β-grasp fold.',
    '1D3Z', 'https://files.rcsb.org/download/1D3Z.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=1D3Z&font=roboto',
    'protein', 'Ubiquitin', 'Homo sapiens', 'folding', null, 'cc-by', 'public',
    0, 0, 0, '2026-02-08T16:45:00Z', '2026-02-08T16:45:00Z'),

  ('11111111-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000006',
    'Crambin',
    'A 46-residue plant protein resolved at sub-ångström resolution. A tiny but exceptionally well-resolved benchmark for force fields.',
    '1CRN', 'https://files.rcsb.org/download/1CRN.pdb',
    'https://placehold.co/800x450/0e0e0e/5DCAA5?text=1CRN&font=roboto',
    'protein', null, 'Crambe abyssinica', 'folding', 0.54, 'cc-by', 'public',
    0, 0, 0, '2026-04-15T13:20:00Z', '2026-04-15T13:20:00Z'),

  ('11111111-0000-0000-0000-000000000011', '00000000-0000-0000-0000-00000000000c',
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
