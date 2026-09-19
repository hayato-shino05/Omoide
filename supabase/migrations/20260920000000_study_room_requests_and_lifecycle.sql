begin;

-- 1. study_rooms に song_requests カラムを追加
alter table public.study_rooms
  add column if not exists song_requests jsonb default '[]'::jsonb;

-- 2. request_study_room_song (Security Definer RPC)
-- メンバーが楽曲リクエストを送信し、部屋の song_requests に追加
create or replace function public.request_study_room_song(
  p_room_id uuid,
  p_user_identifier text,
  p_member_token_hash text default null,
  p_track_id text,
  p_track_name text,
  p_artist_name text,
  p_album_image text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_room public.study_rooms;
  v_member public.study_room_members;
  v_requests jsonb;
  v_new_request jsonb;
  v_req_count integer;
begin
  -- 入力検証
  if p_room_id is null or p_user_identifier is null or p_track_id is null or p_track_name is null then
    raise exception using errcode = '22023', message = 'INVALID_INPUT';
  end if;

  select * into v_room from public.study_rooms where id = p_room_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'ROOM_NOT_FOUND';
  end if;

  -- メンバー検証
  select * into v_member from public.study_room_members
  where room_id = p_room_id and user_identifier = btrim(p_user_identifier);
  if not found then
    raise exception using errcode = 'P0002', message = 'MEMBER_NOT_FOUND';
  end if;

  if v_member.member_token_hash is not null then
    if p_member_token_hash is null or btrim(p_member_token_hash) <> v_member.member_token_hash then
      raise exception using errcode = '42501', message = 'UNAUTHORIZED_MEMBER';
    end if;
  end if;

  v_requests := coalesce(v_room.song_requests, '[]'::jsonb);
  v_req_count := jsonb_array_length(v_requests);

  -- スパム防止: 同一ルームで待機中のリクエスト上限は10曲
  if v_req_count >= 10 then
    raise exception using errcode = '23514', message = 'REQUEST_QUEUE_FULL';
  end if;

  v_new_request := jsonb_build_object(
    'id', gen_random_uuid()::text,
    'track_id', btrim(p_track_id),
    'track_name', btrim(p_track_name),
    'artist_name', coalesce(btrim(p_artist_name), 'Unknown Artist'),
    'album_image', nullif(btrim(p_album_image), ''),
    'requested_by_id', btrim(p_user_identifier),
    'requested_by_name', v_member.display_name,
    'created_at', now()
  );

  v_requests := v_requests || jsonb_build_array(v_new_request);

  update public.study_rooms
  set song_requests = v_requests,
      updated_at = now()
  where id = p_room_id;

  return v_requests;
end;
$$;

-- 3. respond_study_room_song_request (Security Definer RPC)
-- ホストが楽曲リクエストを承認（queue に追加）または却下
create or replace function public.respond_study_room_song_request(
  p_room_id uuid,
  p_host_id text,
  p_host_token_hash text default null,
  p_request_id text,
  p_action text -- 'approve' または 'reject'
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_room public.study_rooms;
  v_requests jsonb;
  v_new_requests jsonb := '[]'::jsonb;
  v_queue jsonb;
  v_item jsonb;
  v_matched_track_id text := null;
  i integer;
begin
  if p_room_id is null or p_host_id is null or p_request_id is null or p_action not in ('approve', 'reject') then
    raise exception using errcode = '22023', message = 'INVALID_INPUT';
  end if;

  select * into v_room from public.study_rooms where id = p_room_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'ROOM_NOT_FOUND';
  end if;

  -- ホスト権限検証
  if v_room.host_id <> btrim(p_host_id) then
    raise exception using errcode = '42501', message = 'UNAUTHORIZED_HOST';
  end if;

  if v_room.host_token_hash is not null then
    if p_host_token_hash is null or btrim(p_host_token_hash) <> v_room.host_token_hash then
      raise exception using errcode = '42501', message = 'UNAUTHORIZED_HOST';
    end if;
  end if;

  v_requests := coalesce(v_room.song_requests, '[]'::jsonb);
  v_queue := coalesce(v_room.queue, '[]'::jsonb);

  -- リクエスト配列を走査して対象リクエストを分離
  for i in 0 .. jsonb_array_length(v_requests) - 1 loop
    v_item := v_requests->i;
    if (v_item->>'id') = btrim(p_request_id) then
      v_matched_track_id := v_item->>'track_id';
    else
      v_new_requests := v_new_requests || jsonb_build_array(v_item);
    end if;
  end loop;

  -- 承認時に対象トラックIDを再生キューに追加
  if p_action = 'approve' and v_matched_track_id is not null then
    v_queue := v_queue || jsonb_build_array(v_matched_track_id);
  end if;

  update public.study_rooms
  set song_requests = v_new_requests,
      queue = v_queue,
      updated_at = now()
  where id = p_room_id;

  return jsonb_build_object(
    'success', true,
    'song_requests', v_new_requests,
    'queue', v_queue
  );
end;
$$;

-- 4. leave_study_room の更新 (ホスト自動移行 & クリーンアップ)
create or replace function public.leave_study_room(
  p_room_id uuid,
  p_user_identifier text,
  p_member_token_hash text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_room public.study_rooms;
  v_member public.study_room_members;
  v_next_host public.study_room_members;
  v_is_host boolean := false;
  v_new_host_id text := null;
begin
  if p_room_id is null or p_user_identifier is null then
    raise exception using errcode = '22023', message = 'INVALID_INPUT';
  end if;

  select * into v_room from public.study_rooms where id = p_room_id;
  if not found then
    return jsonb_build_object('success', true);
  end if;

  select * into v_member
  from public.study_room_members
  where room_id = p_room_id and user_identifier = btrim(p_user_identifier);

  if not found then
    return jsonb_build_object('success', true);
  end if;

  if v_member.member_token_hash is not null then
    if p_member_token_hash is null or btrim(p_member_token_hash) <> v_member.member_token_hash then
      raise exception using errcode = '42501', message = 'UNAUTHORIZED_MEMBER';
    end if;
  end if;

  v_is_host := (v_room.host_id = btrim(p_user_identifier));

  -- メンバーレコードの削除
  delete from public.study_room_members
  where room_id = p_room_id and user_identifier = btrim(p_user_identifier);

  -- ホストが離脱した場合のホスト権限自動移行処理
  if v_is_host then
    -- 直近2分以内にアクティブな最も長く滞在しているメンバーを取得
    select * into v_next_host
    from public.study_room_members
    where room_id = p_room_id
      and last_heartbeat_at >= now() - interval '2 minutes'
    order by joined_at asc
    limit 1;

    if found then
      v_new_host_id := v_next_host.user_identifier;
      update public.study_rooms
      set host_id = v_new_host_id,
          host_token_hash = v_next_host.member_token_hash, -- メンバートークンをホストトークンとして昇格
          updated_at = now()
      where id = p_room_id;
    else
      -- 部屋に誰も残っていない場合は再生停止
      update public.study_rooms
      set playback_state = 'stopped',
          updated_at = now()
      where id = p_room_id;
    end if;
  end if;

  return jsonb_build_object(
    'success', true,
    'migrated_host_id', v_new_host_id
  );
end;
$$;

-- 5. cleanup_stale_study_rooms (TTL 24h & 空室クリーンアップ)
create or replace function public.cleanup_stale_study_rooms()
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_deleted_count integer := 0;
begin
  -- 24時間以上更新がない部屋、またはメンバー不在で1時間以上経過した部屋を完全削除
  with stale_rooms as (
    delete from public.study_rooms
    where updated_at < now() - interval '24 hours'
       or (
         playback_state = 'stopped'
         and updated_at < now() - interval '1 hour'
       )
    returning id
  )
  select count(*) into v_deleted_count from stale_rooms;

  return v_deleted_count;
end;
$$;

-- 6. create_study_room の拡張 (1ユーザー1アクティブルーム制限 & 自動クリーンアップ)
create or replace function public.create_study_room(
  p_name text,
  p_description text default null,
  p_host_id text default null,
  p_host_token_hash text default null,
  p_is_private boolean default false,
  p_passcode text default null,
  p_current_track_id text default null,
  p_theme_override text default null,
  p_queue jsonb default '[]'::jsonb,
  p_current_track_index integer default 0,
  p_is_shuffle boolean default false,
  p_repeat_mode text default 'off'
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_room public.study_rooms;
begin
  if p_name is null or char_length(btrim(p_name)) not between 1 and 100
     or p_host_id is null or char_length(btrim(p_host_id)) not between 1 and 100 then
    raise exception using errcode = '22023', message = 'INVALID_INPUT';
  end if;

  -- 古い放置部屋のクリーンアップを実行
  perform public.cleanup_stale_study_rooms();

  -- 同一ホストの古い空き部屋をクリーンアップ（1ホスト1部屋ポリシー）
  delete from public.study_rooms
  where host_id = btrim(p_host_id)
    and id not in (
      select distinct room_id from public.study_room_members
      where last_heartbeat_at >= now() - interval '2 minutes'
    );

  insert into public.study_rooms (
    name,
    description,
    host_id,
    host_token_hash,
    is_private,
    passcode,
    current_track_id,
    theme_override,
    playback_state,
    epoch_started_at,
    queue,
    current_track_index,
    is_shuffle,
    repeat_mode,
    song_requests,
    created_at,
    updated_at
  ) values (
    btrim(p_name),
    nullif(btrim(p_description), ''),
    btrim(p_host_id),
    nullif(btrim(p_host_token_hash), ''),
    coalesce(p_is_private, false),
    nullif(btrim(p_passcode), ''),
    nullif(btrim(p_current_track_id), ''),
    nullif(btrim(p_theme_override), ''),
    'playing',
    now(),
    coalesce(p_queue, '[]'::jsonb),
    coalesce(p_current_track_index, 0),
    coalesce(p_is_shuffle, false),
    coalesce(p_repeat_mode, 'off'),
    '[]'::jsonb,
    now(),
    now()
  )
  returning * into v_room;

  return to_jsonb(v_room);
end;
$$;

-- 7. 実行権限の付与
grant execute on function public.request_study_room_song(uuid, text, text, text, text, text, text) to anon, authenticated, service_role;
grant execute on function public.respond_study_room_song_request(uuid, text, text, text, text) to anon, authenticated, service_role;
grant execute on function public.cleanup_stale_study_rooms() to anon, authenticated, service_role;

commit;
