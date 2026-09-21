begin;

-- messages: omoide: プリセット楽曲参照の許可
alter table public.messages
  drop constraint if exists messages_music_track_id_format_check;

alter table public.messages
  add constraint messages_music_track_id_format_check
  check (music_track_id is null or music_track_id ~ '^(?:jamendo:|omoide:)?[0-9]{1,12}$|^soundcloud:[0-9]{1,20}$');

-- post_replies: omoide: プリセット楽曲参照の許可
alter table public.post_replies
  drop constraint if exists post_replies_music_track_id_format_check;

alter table public.post_replies
  add constraint post_replies_music_track_id_format_check
  check (music_track_id is null or music_track_id ~ '^(?:jamendo:|omoide:)?[0-9]{1,12}$|^soundcloud:[0-9]{1,20}$');

-- create_community_submission RPC の更新
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
  if p_music_track_id is not null and p_music_track_id !~ '^(?:jamendo:|omoide:)?[0-9]{1,12}$|^soundcloud:[0-9]{1,20}$' then
    raise exception using errcode = '22023', message = 'invalid music track reference';
  end if;
  if p_music_track_id is not null and p_kind <> 'message' then
    raise exception using errcode = '22023', message = 'music track is only supported for messages';
  end if;

  if p_object_path is not null then
    insert into public.media_submissions (
      sender, object_path, media_kind, mime_type, original_name, size_bytes,
      birthday_person, description
    ) values (
      btrim(p_sender), p_object_path, p_media_kind, p_mime_type, btrim(p_original_name), p_size_bytes,
      nullif(btrim(p_birthday_person), ''), nullif(btrim(p_description), '')
    )
    returning * into v_media;
  end if;

  if p_kind = 'message' then
    if p_music_track_id is not null then
      insert into public.messages (sender, message, birthday_person, media_object_path, music_track_id)
      values (
        btrim(p_sender), btrim(p_content), nullif(btrim(p_birthday_person), ''),
        case when v_media.id is not null then v_media.object_path else null end,
        p_music_track_id
      )
      on conflict (sender, birthday_person) where music_track_id is not null
      do update set
        message = excluded.message,
        media_object_path = excluded.media_object_path,
        music_track_id = excluded.music_track_id,
        created_at = now()
      returning * into v_message;
    else
      insert into public.messages (sender, message, birthday_person, media_object_path, music_track_id)
      values (
        btrim(p_sender), btrim(p_content), nullif(btrim(p_birthday_person), ''),
        case when v_media.id is not null then v_media.object_path else null end,
        null
      )
      returning * into v_message;
    end if;

    return jsonb_build_object(
      'kind', 'message',
      'message', to_jsonb(v_message),
      'media_submission', case when v_media.id is not null then to_jsonb(v_media) else null end
    );
  else
    insert into public.bulletin_posts (sender, message, birthday_person, media_object_path)
    values (
      btrim(p_sender), btrim(p_content), nullif(btrim(p_birthday_person), ''),
      case when v_media.id is not null then v_media.object_path else null end
    )
    returning * into v_post;

    return jsonb_build_object(
      'kind', 'post',
      'post', to_jsonb(v_post),
      'media_submission', case when v_media.id is not null then to_jsonb(v_media) else null end
    );
  end if;
end;
$$;

revoke execute on function public.create_community_submission from public, anon, authenticated;
grant execute on function public.create_community_submission to service_role;

-- create_birthday_reply RPC の更新（通常投稿への返信許可および omoide: 楽曲許可）
create or replace function public.create_birthday_reply(
  p_post_id bigint,
  p_sender text,
  p_content text default null,
  p_music_track_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_post public.bulletin_posts;
  v_reply public.post_replies;
begin
  select * into v_post
  from public.bulletin_posts
  where id = p_post_id;

  if not found then
    raise exception using errcode = '22023', message = 'invalid post';
  end if;

  if p_sender is null or char_length(btrim(p_sender)) not between 1 and 100 then
    raise exception using errcode = '22023', message = 'invalid sender';
  end if;

  if (p_content is null or char_length(btrim(p_content)) = 0) and (p_music_track_id is null or char_length(btrim(p_music_track_id)) = 0) then
    raise exception using errcode = '22023', message = 'message or music track is required';
  end if;

  if p_content is not null and char_length(btrim(p_content)) > 1000 then
    raise exception using errcode = '22023', message = 'invalid message length';
  end if;

  if p_music_track_id is not null and p_music_track_id !~ '^(?:jamendo:|omoide:)?[0-9]{1,12}$|^soundcloud:[0-9]{1,20}$' then
    raise exception using errcode = '22023', message = 'invalid music track reference';
  end if;

  insert into public.post_replies (post_id, sender, message, music_track_id)
  values (p_post_id, btrim(p_sender), nullif(btrim(p_content), ''), nullif(btrim(p_music_track_id), ''))
  returning * into v_reply;

  return jsonb_build_object('reply', to_jsonb(v_reply));
end;
$$;

revoke execute on function public.create_birthday_reply from public, anon, authenticated;
grant execute on function public.create_birthday_reply to service_role;

commit;
