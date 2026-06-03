-- Simedo Storage buckets for uploaded simulation files.
--   helix-trajectories — motion files (XTC, DCD, TRR, etc.)
--   helix-topologies   — structure / connectivity files (PDB, GRO, PSF, CIF)
--
-- Both are private; we serve files through signed URLs from the simulation
-- detail page so visibility and access rules still flow through public
-- .simulations RLS.

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('helix-trajectories', 'helix-trajectories', false, 104857600),  -- 100 MB
  ('helix-topologies',   'helix-topologies',   false, 26214400)    -- 25 MB
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Storage policies
-- ---------------------------------------------------------------------------
-- Paths follow `<user_id>/<filename>` so we can scope writes to "your own
-- folder". Reads are scoped to any signed-in user — for finer control we
-- generate signed URLs from the server side using the service-role client.
-- ---------------------------------------------------------------------------

create policy "helix trajectories: owners can upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'helix-trajectories'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "helix trajectories: owners can update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'helix-trajectories'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "helix trajectories: owners can delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'helix-trajectories'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "helix trajectories: any signed-in user can read"
  on storage.objects for select to authenticated
  using (bucket_id = 'helix-trajectories');

create policy "helix topologies: owners can upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'helix-topologies'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "helix topologies: owners can update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'helix-topologies'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "helix topologies: owners can delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'helix-topologies'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "helix topologies: any signed-in user can read"
  on storage.objects for select to authenticated
  using (bucket_id = 'helix-topologies');
