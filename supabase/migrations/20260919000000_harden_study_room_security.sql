begin;

-- 1. study_room_members の直接匿名 INSERT を制限（入室は /api/study/join 経由でパスコード・定員を検証）
revoke insert on table public.study_room_members from anon;
drop policy if exists "Allow insert study_room_members" on public.study_room_members;

-- 2. study_rooms の直接匿名 UPDATE を制限（BGM再生制御・選曲は /api/study/playback 経由でホスト権限を検証）
revoke update on table public.study_rooms from anon;
drop policy if exists "Allow update study_rooms" on public.study_rooms;

commit;
