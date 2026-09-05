import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// CI (Linux) と Windows で checkout 時の改行が異なるため、読み込み後に正規化して比較する
const readSql = (path: string): string => readFileSync(join(process.cwd(), 'supabase', 'migrations', path), 'utf8').replace(/\r\n/g, '\n')

const migration = readSql('20260901000000_add_community_submission_rpc.sql')
const musicMigration = readSql('20260904000000_add_music_track_to_community_submission_rpc.sql')

describe('community submission RPC migration', () => {
  it('keeps the transaction RPC fixed, constrained, and service-only', () => {
    expect(migration).toContain('create or replace function public.create_community_submission(')
    expect(migration).toContain('security definer')
    expect(migration).toContain('set search_path = pg_catalog, public')
    expect(migration).toContain("p_kind is null or p_kind not in ('message', 'post')")
    expect(migration).toContain("p_media_kind is null or p_media_kind not in ('image', 'video')")
    expect(migration).toContain("p_media_kind = 'image' and (p_mime_type not like 'image/%' or p_object_path !~ '^images/')")
    expect(migration).toContain("p_media_kind = 'video' and (p_mime_type not like 'video/%' or p_object_path !~ '^videos/')")
    expect(migration).toContain("p_object_path !~ '^(images|videos)/[0-9a-f-]+\\.[a-z0-9]+$'")
    expect(migration).not.toContain("'audio'")
    expect(migration).not.toContain('audios')
    expect(migration).not.toContain("p_media_kind = 'audio'")
    expect(migration).toMatch(/if p_object_path is null then[\s\S]*if p_description is not null[\s\S]*incomplete media metadata/)
    expect(migration).toContain('revoke execute on function public.create_community_submission')
    expect(migration).toContain('from public, anon, authenticated;')
    expect(migration).toContain('to service_role;')
    expect(migration).not.toMatch(/grant .*delete .*community/i)
    expect(migration).not.toContain("or (p_media_kind = 'video' and p_object_path !~ '^videos/')")
    expect(migration).not.toContain("or (p_media_kind = 'audio' and p_object_path !~ '^audios/')")
  })

  it('adds music track storage and keeps one backward-compatible RPC signature', () => {
    expect(musicMigration).toContain('add column if not exists music_track_id text')
    expect(musicMigration).toContain("check (music_track_id is null or music_track_id ~ '^(?:jamendo:)?[0-9]{1,12}$|^soundcloud:[0-9]{1,20}$')")
    expect(musicMigration).toContain("p_music_track_id text default null")
    expect(musicMigration).toContain("p_music_track_id !~ '^(?:jamendo:)?[0-9]{1,12}$|^soundcloud:[0-9]{1,20}$'")
    expect(musicMigration).toContain('music_track_id)')
    expect(musicMigration).toContain('p_object_path, p_music_track_id')
    expect(musicMigration).toContain('drop function if exists public.create_community_submission(')
    expect(musicMigration).toContain('text, text, text, text, text, text, text, text, text, bigint\n);')
    expect(musicMigration).toContain('messages_music_track_sender_birthday_unique')
    expect(musicMigration).toContain('create unique index if not exists')
    expect(musicMigration).toContain('(sender, birthday_person)')
    expect(musicMigration).toContain('where music_track_id is not null')
    expect(musicMigration).toContain('on conflict (sender, birthday_person)')
    expect(musicMigration).toContain('do update set music_track_id = excluded.music_track_id')
    expect(musicMigration).not.toContain('v_message_id')
  })
})
