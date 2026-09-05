begin;

alter table public.messages
  add column if not exists music_track_id text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.messages'::regclass
      and conname = 'messages_music_track_id_format_check'
  ) then
    alter table public.messages
      add constraint messages_music_track_id_format_check
      check (music_track_id is null or music_track_id ~ '^(?:jamendo:)?[0-9]{1,12}$|^soundcloud:[0-9]{1,20}$');
  end if;
end;
$$;

-- 匿名の音楽付きメッセージは sender と birthday_person の組で 1 件に制限する。
-- 同一入力の再送・二重クリック・同時実行を DB レベルで重複させない。
-- 部分ユニーク制約は CREATE UNIQUE INDEX でなければ書けない（ADD CONSTRAINT ... UNIQUE ... WHERE は構文エラー）。
create unique index if not exists messages_music_track_sender_birthday_unique
  on public.messages (sender, birthday_person)
  where music_track_id is not null;

drop function if exists public.create_community_submission(
  text, text, text, text, text, text, text, text, text, bigint
);

create or replace function public.create_community_submission(
  p_kind text,
  p_sender text,
  p_content text,
  p_birthday_person text default null,
  p_description text default null,
  p_object_path text default null,
  p_media_kind text default null,
  p_mime_type text default null,
  p_original_name text default null,
  p_size_bytes bigint default null,
  p_music_track_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_media public.media_submissions;
  v_message public.messages;
  v_post public.bulletin_posts;
begin
  if p_kind is null or p_kind not in ('message', 'post') then
    raise exception using errcode = '22023', message = 'invalid community submission kind';
  end if;
  if p_sender is null or char_length(btrim(p_sender)) not between 1 and 100 then
    raise exception using errcode = '22023', message = 'invalid sender';
  end if;
  if p_content is null or char_length(btrim(p_content)) not between 1 and 1000 then
    raise exception using errcode = '22023', message = 'invalid content';
  end if;
  if p_birthday_person is not null and char_length(btrim(p_birthday_person)) not between 1 and 100 then
    raise exception using errcode = '22023', message = 'invalid birthday person';
  end if;
  if p_description is not null and char_length(p_description) > 1000 then
    raise exception using errcode = '22023', message = 'invalid description';
  end if;
  if p_music_track_id is not null and p_music_track_id !~ '^(?:jamendo:)?[0-9]{1,12}$|^soundcloud:[0-9]{1,20}$' then
    raise exception using errcode = '22023', message = 'invalid music track reference';
  end if;
  if p_music_track_id is not null and p_kind <> 'message' then
    raise exception using errcode = '22023', message = 'music track is only supported for messages';
  end if;

  if p_object_path is null then
    if p_description is not null
      or p_media_kind is not null or p_mime_type is not null or p_original_name is not null or p_size_bytes is not null then
      raise exception using errcode = '22023', message = 'incomplete media metadata';
    end if;
  else
    if p_media_kind is null or p_media_kind not in ('image', 'video')
      or p_mime_type is null or char_length(p_mime_type) not between 1 and 255
      or p_original_name is null or char_length(btrim(p_original_name)) not between 1 and 255
      or p_size_bytes is null or p_size_bytes <= 0 or p_size_bytes > 52428800
      or char_length(p_object_path) not between 1 and 500
      or p_mime_type not in ('image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm')
      or (p_media_kind = 'image' and (p_mime_type not like 'image/%' or p_object_path !~ '^images/'))
      or (p_media_kind = 'video' and (p_mime_type not like 'video/%' or p_object_path !~ '^videos/'))
      or p_object_path !~ '^(images|videos)/[0-9a-f-]+\.[a-z0-9]+$' then
      raise exception using errcode = '22023', message = 'invalid media metadata';
    end if;

    insert into public.media_submissions (
      sender, object_path, media_kind, mime_type, original_name, size_bytes,
      birthday_person, description
    ) values (
      btrim(p_sender), p_object_path, p_media_kind, p_mime_type, btrim(p_original_name), p_size_bytes,
      nullif(btrim(p_birthday_person), ''), nullif(btrim(p_description), '')
    ) returning * into v_media;
  end if;

  if p_kind = 'message' then
    insert into public.messages (sender, message, birthday_person, media_object_path, music_track_id)
    values (
      btrim(p_sender), btrim(p_content), nullif(btrim(p_birthday_person), ''), p_object_path, p_music_track_id
    )
    on conflict (sender, birthday_person)
      where music_track_id is not null
    do update set music_track_id = excluded.music_track_id
    returning * into v_message;
    return jsonb_build_object('message', to_jsonb(v_message), 'media_submission', to_jsonb(v_media));
  end if;

  insert into public.bulletin_posts (sender, message, media_object_path, birthday_person)
  values (btrim(p_sender), btrim(p_content), p_object_path, nullif(btrim(p_birthday_person), ''))
  returning * into v_post;
  return jsonb_build_object('post', to_jsonb(v_post), 'media_submission', to_jsonb(v_media));
end;
$$;

revoke execute on function public.create_community_submission(text, text, text, text, text, text, text, text, text, bigint, text) from public, anon, authenticated;
grant execute on function public.create_community_submission(text, text, text, text, text, text, text, text, text, bigint, text) to service_role;

commit;
