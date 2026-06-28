-- 2026-06-28: AlphaFold schema rev — rename the generic confidence column
-- to the explicit prediction_mean_plddt, add the missing identifiers
-- (uniprot_id, alphafold_id), the PAE color-scale max, and the reviewer
-- affiliation. Also adds 'alphafold-multimer' to the structure_source
-- enum so the upload form can offer it as a separate option from the
-- single-chain 'alphafold2' / 'alphafold3' predictions.
--
-- Background:
--   * The earlier migration (20260623000001) shipped a generic
--     prediction_confidence numeric. The plan changed: pLDDT and ipTM are
--     scaled differently and the UI needs both names eventually. This
--     migration renames the existing column to the explicit name; an
--     ipTM column will be added separately when multimer support lands.
--   * Backfills the three existing AlphaFold rows with their UniProt and
--     full AlphaFold accession IDs so the detail page can deep-link, and
--     sets prediction_pae_max to AlphaFold DB's canonical 31.75 Å cap.
--
-- RLS is row-scoped (visibility / user_id), so renaming and adding columns
-- has no effect on the existing simulations_* policies.
--
-- Safe to re-run.

-- ============================================================================
-- 1. Enum value: alphafold-multimer (inserted after alphafold2 so the
--    enum reads in roughly increasing complexity).
-- ============================================================================
alter type public.structure_source
  add value if not exists 'alphafold-multimer' after 'alphafold2';

-- ============================================================================
-- 2. Rename prediction_confidence -> prediction_mean_plddt.
--    Idempotent: only renames if the old column still exists.
-- ============================================================================
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'simulations'
      and column_name = 'prediction_confidence'
  ) then
    alter table public.simulations
      rename column prediction_confidence to prediction_mean_plddt;
  end if;
end$$;

-- ============================================================================
-- 3. New columns. Use IF NOT EXISTS so re-running on a partially-migrated
--    DB is safe.
-- ============================================================================
alter table public.simulations
  add column if not exists uniprot_id              text,
  add column if not exists alphafold_id            text,
  add column if not exists prediction_pae_max      numeric,
  add column if not exists reviewed_by_affiliation text;

comment on column public.simulations.prediction_mean_plddt is
  'For AlphaFold monomer predictions: mean pLDDT (0-100). Drives the badge tooltip + the per-residue confidence coloring in the viewer.';
comment on column public.simulations.uniprot_id is
  'UniProt accession (e.g. Q9UBX2) for the predicted protein. Used to build deep links back to the source database.';
comment on column public.simulations.alphafold_id is
  'Full AlphaFold model identifier (e.g. AF-Q9UBX2-F1-v6). Versioned — pin the exact model that was scored.';
comment on column public.simulations.prediction_pae_max is
  'Maximum PAE value (Å) used to scale the PAE heatmap. AlphaFold DB caps at 31.75; AlphaFold 3 server runs may vary.';
comment on column public.simulations.reviewed_by_affiliation is
  'Affiliation of the scientific reviewer. Pairs with scientifically_reviewed_by for the reviewer badge.';

-- ============================================================================
-- 4. Backfill the three seeded AlphaFold rows so the UI has the new fields
--    immediately. All three live under the Simedo Team account.
-- ============================================================================
update public.simulations
   set uniprot_id          = 'Q9UBX2',
       alphafold_id        = 'AF-Q9UBX2-F1-v6',
       prediction_pae_max  = 31.75
 where id = '44444444-0000-0000-0000-000000000002';

update public.simulations
   set uniprot_id          = 'A8MZ59',
       alphafold_id        = 'AF-A8MZ59-F1-v6',
       prediction_pae_max  = 31.75
 where id = '44444444-0000-0000-0000-000000000003';

update public.simulations
   set uniprot_id          = 'Q8NAM6',
       alphafold_id        = 'AF-Q8NAM6-F1-v6',
       prediction_pae_max  = 31.75
 where id = '44444444-0000-0000-0000-000000000004';
