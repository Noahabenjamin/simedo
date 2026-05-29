-- Triggers and helper functions.

-- ============================================================================
-- updated_at maintenance
-- ============================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger simulations_touch_updated_at
  before update on public.simulations
  for each row execute function public.touch_updated_at();

create trigger comments_touch_updated_at
  before update on public.comments
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- Counter maintenance for simulations.like_count
-- ============================================================================
create or replace function public.bump_like_count()
returns trigger language plpgsql as $$
begin
  if (TG_OP = 'INSERT') then
    update public.simulations
      set like_count = like_count + 1
      where id = new.simulation_id;
  elsif (TG_OP = 'DELETE') then
    update public.simulations
      set like_count = greatest(like_count - 1, 0)
      where id = old.simulation_id;
  end if;
  return null;
end;
$$;

create trigger likes_bump_count
  after insert or delete on public.likes
  for each row execute function public.bump_like_count();

-- ============================================================================
-- Counter maintenance for simulations.comment_count
-- (Exclude soft-deleted comments via the boolean filter on the count itself.)
-- ============================================================================
create or replace function public.bump_comment_count()
returns trigger language plpgsql as $$
begin
  if (TG_OP = 'INSERT') then
    update public.simulations
      set comment_count = comment_count + 1
      where id = new.simulation_id;
  elsif (TG_OP = 'DELETE') then
    update public.simulations
      set comment_count = greatest(comment_count - 1, 0)
      where id = old.simulation_id;
  end if;
  return null;
end;
$$;

create trigger comments_bump_count
  after insert or delete on public.comments
  for each row execute function public.bump_comment_count();

-- ============================================================================
-- Auto-provision a public.users row when a new auth.users is created.
-- The trigger runs as SECURITY DEFINER so it bypasses RLS for this one write.
-- Username falls back to email-local-part if not provided in user metadata.
-- ============================================================================
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_username text;
  candidate text;
  collision int := 0;
begin
  base_username := lower(
    coalesce(
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1),
      'user'
    )
  );
  -- Strip non-alphanumeric, ensure non-empty
  base_username := regexp_replace(base_username, '[^a-z0-9_]', '', 'g');
  if length(base_username) < 2 then
    base_username := 'user';
  end if;

  candidate := base_username;
  while exists (select 1 from public.users where username = candidate) loop
    collision := collision + 1;
    candidate := base_username || collision::text;
  end loop;

  insert into public.users (id, username, display_name, avatar_url)
  values (
    new.id,
    candidate,
    coalesce(new.raw_user_meta_data->>'display_name', ''),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ============================================================================
-- View counter — increment via RPC rather than client UPDATE.
-- Client never has UPDATE permission on simulations it doesn't own,
-- so view counts go through a SECURITY DEFINER function.
-- ============================================================================
create or replace function public.increment_view_count(sim_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.simulations
    set view_count = view_count + 1
    where id = sim_id
      and visibility in ('public', 'unlisted');
end;
$$;

grant execute on function public.increment_view_count(uuid) to anon, authenticated;
