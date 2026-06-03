-- Rebrand: the user-facing product name is Simedo, not Helix. The
-- "helix-team" username slug stays the same (it's an identifier baked
-- into URLs like /u/helix-team), but the display name + bio on the
-- seed account get the new wording. Safe to re-run.

update public.users
  set display_name = 'Simedo Team',
      bio = 'Reference structures curated by the Simedo team. Browse to explore — upload your own simulation to claim a real profile.'
  where username = 'helix-team'
    and (display_name = 'Helix Team' or display_name is null);

update auth.users
  set raw_user_meta_data =
    jsonb_set(
      coalesce(raw_user_meta_data, '{}'::jsonb),
      '{display_name}',
      '"Simedo Team"'::jsonb
    )
  where id = '00000000-0000-0000-0000-000000000001'
    and (raw_user_meta_data->>'display_name') = 'Helix Team';
