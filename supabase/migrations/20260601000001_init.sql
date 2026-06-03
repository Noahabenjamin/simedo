-- Simedo initial schema.
-- Run order: 1 init → 2 rls → 3 triggers → seed.sql

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ============================================================================
-- Enums
-- ============================================================================
create type public.simulation_category as enum (
  'protein', 'dna', 'rna', 'membrane', 'drug-complex',
  'enzyme', 'antibody', 'receptor'
);

create type public.experiment_type as enum (
  'equilibrium', 'steered', 'free-energy', 'binding', 'folding'
);

create type public.license_type as enum (
  'cc-by', 'cc-by-sa', 'cc0', 'all-rights-reserved'
);

create type public.visibility_type as enum (
  'public', 'unlisted', 'private'
);

-- ============================================================================
-- users — public profile extending auth.users
-- ============================================================================
create table public.users (
  id              uuid primary key references auth.users on delete cascade,
  username        citext unique not null,
  display_name    text default '',
  bio             text default '',
  avatar_url      text,
  institution     text,
  orcid           text,
  -- soft reputation signals, not gamified scores
  is_verified_academic boolean default false,
  reputation      int default 0,
  created_at      timestamptz default now()
);

comment on column public.users.orcid is 'Optional ORCID iD for academic verification, format 0000-0000-0000-0000';

-- ============================================================================
-- simulations — the primary content unit
-- ============================================================================
create table public.simulations (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references public.users on delete cascade,

  -- core
  title                   text not null check (length(title) between 1 and 200),
  description             text default '',
  pdb_code                text check (pdb_code is null or length(pdb_code) = 4),
  pdb_url                 text not null,

  -- trajectory storage
  trajectory_url          text,
  trajectory_compressed   boolean default false,
  trajectory_frames       int,
  trajectory_duration_ns  numeric,
  trajectory_size_mb      numeric,

  -- media
  thumbnail_url           text,

  -- categorization
  category                public.simulation_category not null,
  protein_family          text,
  organism                text,
  experiment_type         public.experiment_type not null default 'equilibrium',

  -- simulation parameters
  force_field             text,
  water_model             text,
  temperature_k           numeric,
  pressure_bar            numeric,
  ph                      numeric,
  ionic_strength_mm       numeric,
  resolution              numeric,

  -- provenance
  source_doi              text,
  source_url              text,

  -- distribution
  license                 public.license_type default 'cc-by',
  visibility              public.visibility_type default 'public',

  -- denormalized counters maintained by triggers
  view_count              int default 0,
  like_count              int default 0,
  comment_count           int default 0,

  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

create index simulations_user_id_idx on public.simulations(user_id);
create index simulations_category_idx on public.simulations(category);
create index simulations_protein_family_idx on public.simulations(protein_family) where protein_family is not null;
create index simulations_organism_idx on public.simulations(organism) where organism is not null;
create index simulations_experiment_type_idx on public.simulations(experiment_type);
create index simulations_created_at_idx on public.simulations(created_at desc);
create index simulations_view_count_idx on public.simulations(view_count desc);
create index simulations_like_count_idx on public.simulations(like_count desc);

-- Full-text search vector. Generated column lets queries hit a GIN index cheaply.
alter table public.simulations
  add column search_tsv tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(pdb_code, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(protein_family, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(organism, '')), 'C')
  ) stored;
create index simulations_search_idx on public.simulations using gin (search_tsv);

-- ============================================================================
-- tags — free-form labels, many-to-many with simulations
-- ============================================================================
create table public.tags (
  id          serial primary key,
  name        citext unique not null,
  created_at  timestamptz default now()
);

create table public.simulation_tags (
  simulation_id uuid references public.simulations on delete cascade,
  tag_id        int references public.tags on delete cascade,
  primary key (simulation_id, tag_id)
);

create index simulation_tags_tag_id_idx on public.simulation_tags(tag_id);

-- ============================================================================
-- likes — user ❤ simulation
-- ============================================================================
create table public.likes (
  user_id        uuid references public.users on delete cascade,
  simulation_id  uuid references public.simulations on delete cascade,
  created_at     timestamptz default now(),
  primary key (user_id, simulation_id)
);

create index likes_simulation_id_idx on public.likes(simulation_id);

-- ============================================================================
-- comments — with optional frame and residue anchors (Phase 7 will surface)
-- ============================================================================
create table public.comments (
  id             uuid primary key default gen_random_uuid(),
  simulation_id  uuid not null references public.simulations on delete cascade,
  user_id        uuid not null references public.users on delete cascade,
  parent_id      uuid references public.comments on delete cascade,
  body           text not null check (length(body) between 1 and 5000),
  frame_number   int,
  atom_selection text,
  is_deleted     boolean default false,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create index comments_simulation_id_idx on public.comments(simulation_id);
create index comments_parent_id_idx on public.comments(parent_id) where parent_id is not null;
create index comments_user_id_idx on public.comments(user_id);

-- ============================================================================
-- follows — directed user → user
-- ============================================================================
create table public.follows (
  follower_id  uuid references public.users on delete cascade,
  followed_id  uuid references public.users on delete cascade,
  created_at   timestamptz default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);

create index follows_followed_id_idx on public.follows(followed_id);

-- ============================================================================
-- AI tables — stubbed but defined so the contract is stable
-- ============================================================================
create table public.ai_context_cache (
  simulation_id  uuid primary key references public.simulations on delete cascade,
  bundle         jsonb not null,
  refreshed_at   timestamptz default now()
);

create table public.ai_response_cache (
  cache_key      text primary key,
  response       jsonb not null,
  model          text,
  created_at     timestamptz default now()
);

create table public.ai_reports (
  id                 uuid primary key default gen_random_uuid(),
  simulation_id      uuid references public.simulations on delete set null,
  user_id            uuid references public.users on delete set null,
  conversation       jsonb,
  context_bundle     jsonb,
  notes              text,
  status             text default 'open',
  created_at         timestamptz default now()
);

create table public.ai_usage (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.users on delete set null,
  simulation_id   uuid references public.simulations on delete set null,
  model           text not null,
  input_tokens    int not null default 0,
  output_tokens   int not null default 0,
  cost_usd        numeric(10,6) default 0,
  created_at      timestamptz default now()
);

create index ai_usage_user_id_created_at_idx
  on public.ai_usage(user_id, created_at desc);
