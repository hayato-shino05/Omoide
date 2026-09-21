-- ==============================================================================
-- Migration: 20260921000000_harden_security_and_credentials.sql
-- Description: 勉強部屋トークンハッシュの公開SELECT遮断 & 匿名直接INSERT時の信頼性メタデータ改ざん防止
-- ==============================================================================

-- 1. Study Room & Member Token Hash Column-Level Security
revoke select on public.study_rooms from anon, authenticated;
grant select (
  id, name, description, host_id, current_track_id, theme_override,
  playback_state, epoch_started_at, elapsed_seconds, queue,
  current_track_index, is_shuffle, repeat_mode, is_private,
  max_members, song_requests, created_at, updated_at
) on public.study_rooms to anon, authenticated;

revoke select on public.study_room_members from anon, authenticated;
grant select (
  id, room_id, user_identifier, display_name, avatar_url,
  is_host, status, joined_at, last_heartbeat_at
) on public.study_room_members to anon, authenticated;

-- 2. Harden RLS policies on bulletin_posts & post_replies
drop policy if exists "allow_insert_bulletin_posts" on public.bulletin_posts;
create policy "allow_insert_bulletin_posts" on public.bulletin_posts
  for insert
  with check (
    coalesce(is_system_generated, false) = false
    and coalesce(likes, 0) = 0
  );

drop policy if exists "allow_insert_post_replies" on public.post_replies;
create policy "allow_insert_post_replies" on public.post_replies
  for insert
  with check (
    coalesce(moderation_status, 'visible') = 'visible'
  );
