-- Per-event view tracking so trending logic stays honest.
-- Unique constraint enforces one-view-per-(user, sim, calendar-day) so
-- refreshing or revisiting doesn't inflate counts. Anonymous viewers
-- (user_id null) are deduped per (visitor_token, sim, day) instead.

create table public.simulation_views (
  simulation_id uuid not null references public.simulations on delete cascade,
  user_id       uuid references public.users on delete set null,
  visitor_token text,
  created_at    timestamptz not null default now(),
  -- Per-day partitioning for the dedup unique index.
  day           date generated always as ((created_at at time zone 'utc')::date) stored,
  check (user_id is not null or visitor_token is not null)
);

-- Authed users: at most one row per (sim, user, day).
create unique index simulation_views_unique_per_user_day
  on public.simulation_views (simulation_id, user_id, day)
  where user_id is not null;

-- Anonymous viewers: at most one row per (sim, token, day).
create unique index simulation_views_unique_per_anon_day
  on public.simulation_views (simulation_id, visitor_token, day)
  where user_id is null;

create index simulation_views_created_at_idx
  on public.simulation_views (created_at desc);
create index simulation_views_simulation_id_created_at_idx
  on public.simulation_views (simulation_id, created_at desc);

alter table public.simulation_views enable row level security;

-- Anyone can record a view; rows are write-only as far as the public is
-- concerned. Reads are server-side (service role) so no select policy.
create policy "anyone can record a view"
  on public.simulation_views for insert
  to authenticated, anon
  with check (true);

-- Track-and-increment RPC. Inserts a view row (ignored on dedup conflict)
-- and bumps the denormalized counter only when the row actually landed.
create or replace function public.track_simulation_view(
  sim_id uuid,
  token text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  inserted_count int;
begin
  if uid is null and token is null then
    return;
  end if;

  insert into public.simulation_views (simulation_id, user_id, visitor_token)
  values (sim_id, uid, case when uid is null then token else null end)
  on conflict do nothing;

  get diagnostics inserted_count = row_count;

  if inserted_count > 0 then
    update public.simulations
      set view_count = view_count + 1
      where id = sim_id;
  end if;
end;
$$;

revoke all on function public.track_simulation_view(uuid, text) from public;
grant execute on function public.track_simulation_view(uuid, text)
  to authenticated, anon;
