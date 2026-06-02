-- Full-text search vector for users so the Cmd-K palette can match by
-- username, display name, bio, and institution.

alter table public.users
  add column search_tsv tsvector generated always as (
    setweight(to_tsvector('english', coalesce(username::text, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(display_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(institution, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(bio, '')), 'C')
  ) stored;

create index users_search_idx on public.users using gin (search_tsv);
