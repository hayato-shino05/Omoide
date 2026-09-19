begin;

-- 1. join_study_room (Security Definer RPC)
-- パスコード検証・定員制限・メンバー追加をアトミックにDB内で厳格検証
create or replace function public.join_study_room(
  p_room_id uuid,
  p_user_identifier text,
  p_display_name text,
  p_avatar_url text default null,
  p_passcode text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_room public.study_rooms;
  v_active_count integer;
  v_is_existing boolean;
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

  -- 4. 既存所属状況および直近2分のアクティブ人数の確認
  select exists (
    select 1 from public.study_room_members
    where room_id = p_room_id and user_identifier = btrim(p_user_identifier)
  ) into v_is_existing;

  select count(*) into v_active_count
  from public.study_room_members
  where room_id = p_room_id
    and last_heartbeat_at >= now() - interval '2 minutes';

  -- 満席かつ新規入室の場合は拒絶
  if not v_is_existing and v_active_count >= v_room.max_members then
    raise exception using errcode = '23514', message = 'ROOM_FULL';
  end if;

  -- 5. メンバーの参加・更新 (upsert)
  insert into public.study_room_members (
    room_id,
    user_identifier,
    display_name,
    avatar_url,
    focus_status,
    last_heartbeat_at
  ) values (
    p_room_id,
    btrim(p_user_identifier),
    btrim(p_display_name),
    nullif(btrim(p_avatar_url), ''),
    'focusing',
    now()
  )
  on conflict (room_id, user_identifier) do update set
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url,
    focus_status = 'focusing',
    last_heartbeat_at = now()
  returning * into v_member;

  return to_jsonb(v_member);
end;
$$;

-- 2. update_study_room_playback (Security Definer RPC)
-- ホスト権限をDB内で直接検証し、BGM再生状態を更新
create or replace function public.update_study_room_playback(
  p_room_id uuid,
  p_host_id text,
  p_current_track_id text default null,
  p_epoch_started_at timestamptz default now(),
  p_playback_state text default 'playing'
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

  -- ホスト権限チェック
  if v_room.host_id <> btrim(p_host_id) then
    raise exception using errcode = '42501', message = 'UNAUTHORIZED_HOST';
  end if;

  -- 再生状態の更新
  update public.study_rooms
  set
    current_track_id = p_current_track_id,
    epoch_started_at = coalesce(p_epoch_started_at, now()),
    playback_state = coalesce(p_playback_state, 'playing'),
    updated_at = now()
  where id = p_room_id and host_id = btrim(p_host_id);

  return jsonb_build_object('success', true);
end;
$$;

-- 3. study_room_members の直接匿名 INSERT / study_rooms の直接匿名 UPDATE を制限
revoke insert on table public.study_room_members from anon;
drop policy if exists "Allow insert study_room_members" on public.study_room_members;

revoke update on table public.study_rooms from anon;
drop policy if exists "Allow update study_rooms" on public.study_rooms;

-- 4. RPC実行権限の付与
grant execute on function public.join_study_room(uuid, text, text, text, text) to anon, authenticated, service_role;
grant execute on function public.update_study_room_playback(uuid, text, text, timestamptz, text) to anon, authenticated, service_role;

commit;
