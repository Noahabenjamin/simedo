-- One row per (user, comment, emoji). Limited to a curated set so the UI
-- doesn't have to handle every emoji in existence.

create type public.reaction_emoji as enum (
  'thumbs_up',     -- 👍
  'heart',         -- ❤️
  'microscope',    -- 🔬
  'idea'           -- 💡
);

create table public.comment_reactions (
  comment_id  uuid not null references public.comments on delete cascade,
  user_id     uuid not null references public.users on delete cascade,
  emoji       public.reaction_emoji not null,
  created_at  timestamptz default now(),
  primary key (comment_id, user_id, emoji)
);

create index comment_reactions_comment_id_idx
  on public.comment_reactions(comment_id);
create index comment_reactions_user_id_idx
  on public.comment_reactions(user_id);

-- RLS: anyone signed in can read reactions; users can only add / remove
-- their own.
alter table public.comment_reactions enable row level security;

create policy "comment_reactions are world-readable"
  on public.comment_reactions for select
  using (true);

create policy "users can react as themselves"
  on public.comment_reactions for insert
  with check (auth.uid() = user_id);

create policy "users can remove their own reactions"
  on public.comment_reactions for delete
  using (auth.uid() = user_id);
