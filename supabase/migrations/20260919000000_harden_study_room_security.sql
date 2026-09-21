begin;

-- 1. カラムの追加（ホスト・メンバーの検証用トークンハッシュおよびキュー・シャッフル・リピート状態）
alter table public.study_rooms
  add column if not exists host_token_hash text,
  add column if not exists queue jsonb default '[]'::jsonb,
  add column if not exists current_track_index integer default 0,
  add column if not exists is_shuffle boolean default false,
  add column if not exists repeat_mode text default 'off';

alter table public.study_room_members
  add column if not exists member_token_hash text;

-- 2. create_study_room (Security Definer RPC)
-- ホストトークンハッシュを保持し部屋を安全に作成
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
    now(),
    now()
  )
  returning * into v_room;

  return to_jsonb(v_room);
end;
$$;

-- 3. join_study_room (Security Definer RPC)
-- パスコード検証・メンバートークン検証・定員制限・メンバー参加をアトミックにDB内で厳格検証
create or replace function public.join_study_room(
  p_room_id uuid,
  p_user_identifier text,
  p_display_name text,
  p_avatar_url text default null,
  p_passcode text default null,
  p_member_token_hash text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_room public.study_rooms;
  v_active_count integer;
  v_existing_member public.study_room_members;
  v_member public.study_room_members;
begin
  -- 1. 入力パラメータのバリデーション
  if p_room_id is null or p_user_identifier is null or char_length(btrim(p_user_identifier)) not between 1 and 100
     or p_display_name is null or char_length(btrim(p_display_name)) not between 1 and 50 then
    raise exception using errcode = '22023', message = 'INVALID_INPUT';
  end if;

  -- 2. 部屋の取得と存在確認
  select * into v_room from public.study_rooms where id = p_room_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'ROOM_NOT_FOUND';
  end if;

  -- 3. 非公開部屋のパスコード検証
  if v_room.is_private then
    if p_passcode is null or btrim(p_passcode) <> coalesce(v_room.passcode, '') then
      raise exception using errcode = '42501', message = 'INVALID_PASSCODE';
    end if;
  end if;

  -- 4. 既存メンバーの取得およびトークン検証（他者IDの不正ななりすまし・上書きを防止）
  select * into v_existing_member
  from public.study_room_members
  where room_id = p_room_id and user_identifier = btrim(p_user_identifier);

  if found then
    -- 既存メンバーにトークンハッシュが設定されている場合、渡されたトークンハッシュとの一致を必須化
    if v_existing_member.member_token_hash is not null then
      if p_member_token_hash is null or btrim(p_member_token_hash) <> v_existing_member.member_token_hash then
        raise exception using errcode = '42501', message = 'INVALID_MEMBER_TOKEN';
      end if;
    end if;
  else
    -- 新規参加時の満席判定（直近2分以内にアクティブなメンバー数をカウント）
    select count(*) into v_active_count
    from public.study_room_members
    where room_id = p_room_id
      and last_heartbeat_at >= now() - interval '2 minutes';

    if v_active_count >= v_room.max_members then
      raise exception using errcode = '23514', message = 'ROOM_FULL';
    end if;
  end if;

  -- 5. メンバーの参加・更新 (upsert)
  insert into public.study_room_members (
    room_id,
    user_identifier,
    display_name,
    avatar_url,
    focus_status,
    member_token_hash,
    last_heartbeat_at
  ) values (
    p_room_id,
    btrim(p_user_identifier),
    btrim(p_display_name),
    nullif(btrim(p_avatar_url), ''),
    'focusing',
    nullif(btrim(p_member_token_hash), ''),
    now()
  )
  on conflict (room_id, user_identifier) do update set
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url,
    focus_status = 'focusing',
    member_token_hash = coalesce(excluded.member_token_hash, public.study_room_members.member_token_hash),
    last_heartbeat_at = now()
  returning * into v_member;

  return to_jsonb(v_member);
end;
$$;

-- 4. update_study_room_playback (Security Definer RPC)
-- ホスト権限およびホストトークンをDB内で検証し、再生状態・キュー・シャッフル・リピートを完全同期更新
create or replace function public.update_study_room_playback(
  p_room_id uuid,
  p_host_id text,
  p_host_token_hash text default null,
  p_current_track_id text default null,
  p_epoch_started_at timestamptz default now(),
  p_playback_state text default 'playing',
  p_queue jsonb default null,
  p_current_track_index integer default null,
  p_is_shuffle boolean default null,
  p_repeat_mode text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_room public.study_rooms;
begin
  if p_room_id is null or p_host_id is null or char_length(btrim(p_host_id)) not between 1 and 100 then
    raise exception using errcode = '22023', message = 'INVALID_INPUT';
  end if;

  select * into v_room from public.study_rooms where id = p_room_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'ROOM_NOT_FOUND';
  end if;

  -- ホストIDの一致確認
  if v_room.host_id <> btrim(p_host_id) then
    raise exception using errcode = '42501', message = 'UNAUTHORIZED_HOST';
  end if;

  -- ホストトークンハッシュが設定されている場合の検証
  if v_room.host_token_hash is not null then
    if p_host_token_hash is null or btrim(p_host_token_hash) <> v_room.host_token_hash then
      raise exception using errcode = '42501', message = 'UNAUTHORIZED_HOST';
    end if;
  end if;

  -- 再生状態およびキュー・シャッフル・リピート状態の更新
  update public.study_rooms
  set
    current_track_id = p_current_track_id,
    epoch_started_at = coalesce(p_epoch_started_at, now()),
    playback_state = coalesce(p_playback_state, 'playing'),
    queue = coalesce(p_queue, queue, '[]'::jsonb),
    current_track_index = coalesce(p_current_track_index, current_track_index, 0),
    is_shuffle = coalesce(p_is_shuffle, is_shuffle, false),
    repeat_mode = coalesce(p_repeat_mode, repeat_mode, 'off'),
    updated_at = now()
  where id = p_room_id and host_id = btrim(p_host_id);

  return jsonb_build_object('success', true);
end;
$$;

-- 5. update_study_room_member_status (Security Definer RPC)
-- メンバートークンを検証してステータス・集中時間を更新
create or replace function public.update_study_room_member_status(
  p_room_id uuid,
  p_user_identifier text,
  p_member_token_hash text default null,
  p_focus_status text default 'focusing',
  p_streak_minutes integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_member public.study_room_members;
begin
  if p_room_id is null or p_user_identifier is null then
    raise exception using errcode = '22023', message = 'INVALID_INPUT';
  end if;

  select * into v_member
  from public.study_room_members
  where room_id = p_room_id and user_identifier = btrim(p_user_identifier);

  if not found then
    raise exception using errcode = 'P0002', message = 'MEMBER_NOT_FOUND';
  end if;

  if v_member.member_token_hash is not null then
    if p_member_token_hash is null or btrim(p_member_token_hash) <> v_member.member_token_hash then
      raise exception using errcode = '42501', message = 'UNAUTHORIZED_MEMBER';
    end if;
  end if;

  update public.study_room_members
  set
    focus_status = coalesce(p_focus_status, 'focusing'),
    current_streak_minutes = coalesce(p_streak_minutes, 0),
    last_heartbeat_at = now()
  where room_id = p_room_id and user_identifier = btrim(p_user_identifier);

  return jsonb_build_object('success', true);
end;
$$;

-- 6. leave_study_room (Security Definer RPC)
-- メンバートークンを検証して安全に部屋から退出
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
  v_member public.study_room_members;
begin
  if p_room_id is null or p_user_identifier is null then
    raise exception using errcode = '22023', message = 'INVALID_INPUT';
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

  delete from public.study_room_members
  where room_id = p_room_id and user_identifier = btrim(p_user_identifier);

  return jsonb_build_object('success', true);
end;
$$;

-- 7. study_room_members / study_rooms の直接テーブル変更権限を制限
revoke insert, update, delete on table public.study_rooms from anon;
drop policy if exists "Allow insert study_rooms" on public.study_rooms;
drop policy if exists "Allow update study_rooms" on public.study_rooms;
drop policy if exists "Allow delete study_rooms" on public.study_rooms;

revoke insert, update, delete on table public.study_room_members from anon;
drop policy if exists "Allow insert study_room_members" on public.study_room_members;
drop policy if exists "Allow update study_room_members" on public.study_room_members;
drop policy if exists "Allow delete study_room_members" on public.study_room_members;

-- 8. RPC実行権限の付与
grant execute on function public.create_study_room(text, text, text, text, boolean, text, text, text, jsonb, integer, boolean, text) to anon, authenticated, service_role;
grant execute on function public.join_study_room(uuid, text, text, text, text, text) to anon, authenticated, service_role;
grant execute on function public.update_study_room_playback(uuid, text, text, text, timestamptz, text, jsonb, integer, boolean, text) to anon, authenticated, service_role;
grant execute on function public.update_study_room_member_status(uuid, text, text, text, integer) to anon, authenticated, service_role;
grant execute on function public.leave_study_room(uuid, text, text) to anon, authenticated, service_role;

commit;
