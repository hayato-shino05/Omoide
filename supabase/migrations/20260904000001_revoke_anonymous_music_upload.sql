begin;

revoke insert on table public.music_tracks from anon;
revoke usage, select on sequence public.music_tracks_id_seq from anon;
drop policy if exists U&"\533F\540D\4F5C\6210: \97F3\697D\30B9\30C8\30EC\30FC\30B8" on storage.objects;

commit;
