-- Phase 5: upload pipeline + academic verification + smart compression.
-- Adds institutional-email verification, provenance metadata on sims, and
-- raw / streamed trajectory pointers so the viewer can serve a small
-- compressed preview by default and fall back to range-streaming the raw
-- file when a power user opts in.

-- ============================================================================
-- institutional_verifications — pending email-verification tokens
-- ============================================================================
create table public.institutional_verifications (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.users on delete cascade,
  institutional_email   citext not null,
  institution_name      text not null,
  domain                text not null,
  verification_token    text not null,
  verified_at           timestamptz,
  expires_at            timestamptz not null default (now() + interval '24 hours'),
  created_at            timestamptz default now(),
  unique (user_id, institutional_email)
);

create index institutional_verifications_token_idx
  on public.institutional_verifications(verification_token)
  where verified_at is null;

-- ============================================================================
-- users: verification level + cached institution
-- ============================================================================
alter table public.users
  add column if not exists institutional_email  citext,
  add column if not exists institutional_domain text,
  add column if not exists verification_level   text default 'none'
    check (verification_level in ('none','email_verified','manually_verified'));

-- The seed Simedo Team account owns all 17 reference sims; without this it
-- couldn't insert under the new RLS rule below. Manually_verified so the
-- badge reads gold, not green.
update public.users
   set verification_level = 'manually_verified',
       is_verified_academic = true
 where id = '00000000-0000-0000-0000-000000000001';

-- ============================================================================
-- simulations: provenance + compression metadata
-- ============================================================================
alter table public.simulations
  add column if not exists software                       text,
  add column if not exists software_version               text,
  add column if not exists force_field_full               text,
  add column if not exists simulation_lab                 text,
  add column if not exists simulation_institution         text,
  add column if not exists corresponding_author           text,
  add column if not exists corresponding_author_email     citext,
  add column if not exists data_origin                    text default 'original'
    check (data_origin in ('original','reupload_with_permission','public_repository')),
  add column if not exists original_source_url            text,
  add column if not exists raw_trajectory_url             text,
  add column if not exists raw_trajectory_size_mb         numeric,
  add column if not exists compressed_trajectory_url      text,
  add column if not exists compressed_trajectory_size_mb  numeric,
  add column if not exists frames_original                int,
  add column if not exists frames_streamed                int,
  add column if not exists compression_method             text
    check (compression_method in ('none','downsample','pca','downsample_and_pca')),
  add column if not exists processing_status              text default 'pending'
    check (processing_status in ('pending','processing','ready','failed')),
  add column if not exists processing_error               text;

create index simulations_processing_status_idx
  on public.simulations(processing_status)
  where processing_status <> 'ready';

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.institutional_verifications enable row level security;

create policy "users see their own verifications"
  on public.institutional_verifications for select
  using (auth.uid() = user_id);

create policy "users create verifications for themselves"
  on public.institutional_verifications for insert
  with check (auth.uid() = user_id);

-- Replace the existing "simulations_insert_own" policy with a stricter
-- check that also requires academic verification. Multiple permissive
-- policies on the same operation are OR'd in Postgres, so we have to
-- drop the loose one first or it would let unverified users through.
drop policy if exists simulations_insert_own on public.simulations;

create policy "verified users can insert simulations"
  on public.simulations for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.users
       where id = auth.uid()
         and verification_level <> 'none'
    )
  );

-- Update + delete were already covered by simulations_update_own /
-- simulations_delete_own from the original RLS migration — leave those.
