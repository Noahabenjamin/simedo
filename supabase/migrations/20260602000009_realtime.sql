-- Opt comments + reactions into Supabase's realtime publication so the
-- discussion section can subscribe for live updates without polling.

do $$
begin
  alter publication supabase_realtime add table public.comments;
exception when duplicate_object then
  null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.comment_reactions;
exception when duplicate_object then
  null;
end;
$$;
