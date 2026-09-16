begin;

-- Add rich metadata and live LRC lyrics columns to public.music_tracks
alter table public.music_tracks
  add column if not exists title text,
  add column if not exists artist text,
  add column if not exists duration integer default 0,
  add column if not exists cover_url text,
  add column if not exists lyrics_url text,
  add column if not exists lyrics_lrc text,
  add column if not exists is_preset boolean default true,
  add column if not exists sort_order integer default 0;

create index if not exists music_tracks_sort_order_idx on public.music_tracks (sort_order asc, id asc);

commit;
