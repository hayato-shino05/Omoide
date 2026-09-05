begin;

alter table public.messages
  add column if not exists music_track_id text
    check (music_track_id is null or char_length(btrim(music_track_id)) between 1 and 100);

create index if not exists messages_music_track_id_idx
  on public.messages (music_track_id)
  where music_track_id is not null;

commit;
