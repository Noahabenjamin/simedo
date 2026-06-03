# Simedo — security model

This document describes the row-level security (RLS) policies on every table.
Each policy is named in the migrations to make audit logs readable.

Tables enable RLS by default. If a policy isn't listed below, **the operation is denied** for everyone except the service role.

## Roles

- **anon** — unauthenticated visitor
- **authenticated** — any signed-in user (their `auth.uid()` returns their UUID)
- **service_role** — server only. Bypasses RLS. Never expose this key to the client.

## users

| op | who | rule |
|---|---|---|
| select | anyone | all profiles are public |
| insert | service_role only (via `handle_new_auth_user` trigger) | direct client inserts denied |
| update | self | `auth.uid() = id` |
| delete | service_role only | direct deletes denied |

## simulations

| op | who | rule |
|---|---|---|
| select | anon + authed | `visibility in ('public', 'unlisted') OR user_id = auth.uid()` |
| insert | authed | `user_id = auth.uid()` — can't impersonate |
| update | owner | `user_id = auth.uid()` |
| delete | owner | `user_id = auth.uid()` |

**Verified denials:**
- Anonymous user attempting to UPDATE another user's simulation → denied
- User attempting to INSERT a simulation with `user_id = <someone else>` → denied (WITH CHECK fails)
- Anonymous user attempting to SELECT a private simulation → denied

**Note:** `unlisted` sims are readable via direct ID but not enumerable in a public list query — list queries must filter `visibility = 'public'` in app code. The DB doesn't enforce that distinction.

## tags / simulation_tags

| op | who | rule |
|---|---|---|
| select tags | anyone | tags are a shared dictionary |
| insert tags | any authed user | so they can add new ones during upload |
| select simulation_tags | anyone | |
| insert/update/delete simulation_tags | sim owner | enforced via EXISTS subquery against `simulations.user_id` |

## likes

| op | who | rule |
|---|---|---|
| select | anyone | like counts are public |
| insert | self | `user_id = auth.uid()` |
| delete | self | `user_id = auth.uid()` |

## comments

| op | who | rule |
|---|---|---|
| select | anyone | but only if the parent sim is visible to you |
| insert | authed | `user_id = auth.uid()` |
| update | author | edit your own |
| delete | author | delete your own (soft delete via `is_deleted = true` recommended in app code) |

The visibility-inherits-from-sim policy uses an `EXISTS` join. Cost: one extra index hit per comment row.

## follows

| op | who | rule |
|---|---|---|
| select | anyone | follower graph is public |
| insert | self | `follower_id = auth.uid()` |
| delete | self | `follower_id = auth.uid()` |

Self-follows are prevented by the `CHECK (follower_id <> followed_id)` constraint.

## AI tables

| table | select | insert/update/delete |
|---|---|---|
| ai_context_cache | anyone | service_role only |
| ai_response_cache | anyone | service_role only |
| ai_reports | service_role only | authed users can insert; updates/reads via service_role |
| ai_usage | self only | service_role only |

The intent: caches are server-managed but the contents (public protein metadata) are safe to read. Usage data is private per user. Reports are write-only from the client side so users can't enumerate other reports.

## Verifying this in production

Run the test plan from `supabase/tests/rls.sql` (TODO: create this file in a follow-up phase). Each test asserts a denial under a specific role.

For now, a manual smoke test:

```sql
-- as anon
set role anon;
select count(*) from public.simulations where visibility = 'public';  -- works
update public.simulations set title = 'pwned' where id = '<any>';     -- denied

-- as authenticated user X
select set_config('request.jwt.claim.sub', '<some-uuid>', true);
insert into public.simulations (user_id, title, pdb_url, category)
  values ('<different-uuid>', 't', 'u', 'protein');  -- denied by WITH CHECK
```

## Service-role key handling

The service role key bypasses every policy above. Rules:

1. **Never** include `SUPABASE_SERVICE_ROLE_KEY` in a `NEXT_PUBLIC_*` variable.
2. Server actions and API routes use it via `lib/supabase/admin.ts` (to be created). Browser code never imports that file.
3. Rotate it if it leaks: Supabase dashboard → Project Settings → API → "Reset service_role JWT secret."
