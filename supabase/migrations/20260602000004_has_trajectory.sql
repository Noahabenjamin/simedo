-- Adds an honest "this simulation has playable motion" flag.
-- Set to true only when:
--   - a trajectory_url is uploaded, OR
--   - the pdb_url points at an NMR ensemble (multi-model PDB)
-- Otherwise the detail page renders the static structure with no
-- playback controls.

alter table public.simulations
  add column has_trajectory boolean not null default false;

create index simulations_has_trajectory_idx
  on public.simulations(has_trajectory)
  where has_trajectory = true;
