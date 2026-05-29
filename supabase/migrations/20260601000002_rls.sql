-- Row-level security policies.
-- Each policy named to make the intent obvious in error logs.
-- See SECURITY.md for the prose explanation of each.

alter table public.users           enable row level security;
alter table public.simulations     enable row level security;
alter table public.tags            enable row level security;
alter table public.simulation_tags enable row level security;
alter table public.likes           enable row level security;
alter table public.comments        enable row level security;
alter table public.follows         enable row level security;

alter table public.ai_context_cache  enable row level security;
alter table public.ai_response_cache enable row level security;
alter table public.ai_reports        enable row level security;
alter table public.ai_usage          enable row level security;

-- ============================================================================
-- users
-- ============================================================================
-- Public profiles are readable by anyone (even anonymous).
create policy users_select_all on public.users
  for select using (true);

-- Only the authenticated user can edit their own row.
create policy users_update_self on public.users
  for update using (auth.uid() = id);

-- Inserts happen via the on_auth_user_created trigger (security definer).
-- No direct insert policy = no client-side inserts allowed.

-- ============================================================================
-- simulations
-- ============================================================================
-- Read: public sims to anyone, unlisted via direct id to anyone,
-- private only to the owner.
create policy simulations_select_visible on public.simulations
  for select using (
    visibility in ('public', 'unlisted')
    or user_id = auth.uid()
  );

create policy simulations_insert_own on public.simulations
  for insert with check (user_id = auth.uid());

create policy simulations_update_own on public.simulations
  for update using (user_id = auth.uid());

create policy simulations_delete_own on public.simulations
  for delete using (user_id = auth.uid());

-- ============================================================================
-- tags / simulation_tags
-- ============================================================================
-- Tags are a shared dictionary. Anyone can read.
create policy tags_select_all on public.tags for select using (true);

-- Only authenticated users can create new tags.
create policy tags_insert_authed on public.tags
  for insert with check (auth.uid() is not null);

-- Linking sims to tags: only the sim owner can do it.
create policy simulation_tags_select_all on public.simulation_tags
  for select using (true);

create policy simulation_tags_write_owner on public.simulation_tags
  for all using (
    exists (
      select 1 from public.simulations s
      where s.id = simulation_id and s.user_id = auth.uid()
    )
  );

-- ============================================================================
-- likes
-- ============================================================================
create policy likes_select_all on public.likes for select using (true);

create policy likes_insert_own on public.likes
  for insert with check (user_id = auth.uid());

create policy likes_delete_own on public.likes
  for delete using (user_id = auth.uid());

-- ============================================================================
-- comments
-- ============================================================================
-- Comments inherit the sim's visibility — only readable if you can read the sim.
create policy comments_select_visible on public.comments
  for select using (
    exists (
      select 1 from public.simulations s
      where s.id = simulation_id
        and (s.visibility in ('public', 'unlisted') or s.user_id = auth.uid())
    )
  );

create policy comments_insert_own on public.comments
  for insert with check (user_id = auth.uid());

create policy comments_update_own on public.comments
  for update using (user_id = auth.uid());

create policy comments_delete_own on public.comments
  for delete using (user_id = auth.uid());

-- ============================================================================
-- follows
-- ============================================================================
create policy follows_select_all on public.follows for select using (true);

create policy follows_insert_own on public.follows
  for insert with check (follower_id = auth.uid());

create policy follows_delete_own on public.follows
  for delete using (follower_id = auth.uid());

-- ============================================================================
-- AI tables — server-only writes, no direct client access
-- ============================================================================
-- Context cache: anyone can read (it's just protein metadata).
create policy ai_context_cache_select_all on public.ai_context_cache
  for select using (true);
-- No insert/update/delete policy = only service role can write.

create policy ai_response_cache_select_all on public.ai_response_cache
  for select using (true);

-- Reports: a user can submit one for any sim they can see.
create policy ai_reports_insert_authed on public.ai_reports
  for insert with check (auth.uid() is not null);
-- No read policy for non-service users.

-- Usage: a user can read their own usage.
create policy ai_usage_select_own on public.ai_usage
  for select using (user_id = auth.uid());
