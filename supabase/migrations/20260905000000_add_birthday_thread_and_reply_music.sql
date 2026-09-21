begin;

-- bulletin_posts: システム生成の誕生日スレッドに必要なメタデータ
alter table public.bulletin_posts
  add column if not exists celebration_date date,
  add column if not exists timezone text not null default 'Asia/Tokyo',
  add column if not exists is_system_generated boolean not null default false;

-- 誕生日スレッドは対象者と対象日で 1 件に制限する。
-- 再実行・同時実行・再取得でも重複しない idempotency target として使う。
create unique index if not exists bulletin_posts_birthday_thread_unique
  on public.bulletin_posts (birthday_person, celebration_date)
  where is_system_generated;

-- post_replies: 楽曲付き返信とモデレーション状態、テキスト必須の緩和
alter table public.post_replies
  add column if not exists music_track_id text,
  add column if not exists moderation_status text not null default 'visible';

alter table public.post_replies alter column message drop not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.post_replies'::regclass
      and conname = 'post_replies_music_track_id_format_check'
  ) then
    alter table public.post_replies
      add constraint post_replies_music_track_id_format_check
      check (music_track_id is null or music_track_id ~ '^(?:jamendo:)?[0-9]{1,12}$|^soundcloud:[0-9]{1,20}$');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.post_replies'::regclass
      and conname = 'post_replies_moderation_status_check'
  ) then
    alter table public.post_replies
      add constraint post_replies_moderation_status_check
      check (moderation_status in ('visible', 'hidden'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.post_replies'::regclass
      and conname = 'post_replies_message_or_music_check'
  ) then
    alter table public.post_replies
      add constraint post_replies_message_or_music_check
      check (message is not null or music_track_id is not null);
  end if;
end;
$$;

create index if not exists post_replies_post_id_created_at_id_idx
  on public.post_replies (post_id, created_at, id);

-- 誕生日スレッドへの返信は、テキストまたは楽曲の少なくとも一方を持つ。
-- service_role 経由の RPC だけが書き込み、匿名の UPDATE / DELETE は許可しない。
drop function if exists public.create_birthday_reply(bigint, text, text, text);

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
  v_reply public.post_replies;
  v_post public.bulletin_posts;
begin
  if p_sender is null or char_length(btrim(p_sender)) not between 1 and 100 then
    raise exception using errcode = '22023', message = 'invalid sender';
  end if;
  if p_content is not null and char_length(p_content) > 1000 then
    raise exception using errcode = '22023', message = 'invalid content';
  end if;
  if p_music_track_id is not null and p_music_track_id !~ '^(?:jamendo:)?[0-9]{1,12}$|^soundcloud:[0-9]{1,20}$' then
    raise exception using errcode = '22023', message = 'invalid music track reference';
  end if;
  if (p_content is null or char_length(btrim(p_content)) = 0)
     and p_music_track_id is null then
    raise exception using errcode = '22023', message = 'reply requires content or music';
  end if;

  select *
  into v_post
  from public.bulletin_posts
  where id = p_post_id and is_system_generated;
  if not found then
    raise exception using errcode = '22023', message = 'birthday thread not found';
  end if;

  insert into public.post_replies (post_id, sender, message, music_track_id)
  values (
    p_post_id,
    btrim(p_sender),
    nullif(btrim(p_content), ''),
    p_music_track_id
  )
  returning * into v_reply;

  return jsonb_build_object('reply', to_jsonb(v_reply));
end;
$$;

revoke execute on function public.create_birthday_reply(bigint, text, text, text) from public, anon, authenticated;
grant execute on function public.create_birthday_reply(bigint, text, text, text) to service_role;

commit;
