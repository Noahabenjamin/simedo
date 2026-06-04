-- Structure files for uploaded simulations live in the pdbs bucket. Small
-- (10 MB cap), browser-uploadable, served via signed URLs to the viewer.

insert into storage.buckets (id, name, public, file_size_limit)
values ('pdbs', 'pdbs', false, 10 * 1024 * 1024)
on conflict (id) do nothing;

create policy "pdbs: verified users can upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'pdbs'
    and exists (
      select 1 from public.users
       where id = auth.uid()
         and verification_level <> 'none'
    )
  );

create policy "pdbs: uploaders can update + delete"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'pdbs'
    and owner = auth.uid()
  );

create policy "pdbs: uploaders can delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'pdbs'
    and owner = auth.uid()
  );

create policy "pdbs: any signed-in user can read"
  on storage.objects for select to authenticated
  using (bucket_id = 'pdbs');
