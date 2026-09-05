import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// CI (Linux) と Windows で checkout 時の改行が異なるため、読み込み後に正規化して比較する
const readSql = (path: string): string => readFileSync(join(process.cwd(), 'supabase', 'migrations', path), 'utf8').replace(/\r\n/g, '\n')

const migration = readSql('20260905000000_add_birthday_thread_and_reply_music.sql')

describe('birthday thread + reply music migration', () => {
  it('adds system-generated thread metadata with an idempotency target', () => {
    expect(migration).toContain('add column if not exists celebration_date date')
    expect(migration).toContain("add column if not exists timezone text not null default 'Asia/Tokyo'")
    expect(migration).toContain('add column if not exists is_system_generated boolean not null default false')
    expect(migration).toContain('create unique index if not exists bulletin_posts_birthday_thread_unique')
    expect(migration).toContain('on public.bulletin_posts (birthday_person, celebration_date)')
    expect(migration).toContain('where is_system_generated')
  })

  it('relaxes reply text and constrains music-or-text', () => {
    expect(migration).toContain('add column if not exists music_track_id text')
    expect(migration).toContain("add column if not exists moderation_status text not null default 'visible'")
    expect(migration).toContain('alter column message drop not null')
    expect(migration).toContain("check (music_track_id is null or music_track_id ~ '^(?:jamendo:)?[0-9]{1,12}$|^soundcloud:[0-9]{1,20}$')")
    expect(migration).toContain("check (moderation_status in ('visible', 'hidden'))")
    expect(migration).toContain('check (message is not null or music_track_id is not null)')
    expect(migration).toContain('create index if not exists post_replies_post_id_created_at_id_idx')
    expect(migration).toContain('on public.post_replies (post_id, created_at, id)')
  })

  it('keeps the reply RPC service-only and validates its inputs', () => {
    expect(migration).toContain('create or replace function public.create_birthday_reply(')
    expect(migration).toContain('security definer')
    expect(migration).toContain('set search_path = pg_catalog, public')
    expect(migration).toContain('char_length(btrim(p_sender)) not between 1 and 100')
    expect(migration).toContain('char_length(p_content) > 1000')
    expect(migration).toContain('p_music_track_id !~')
    expect(migration).toContain('reply requires content or music')
    expect(migration).toContain('where id = p_post_id and is_system_generated')
    expect(migration).toContain('revoke execute on function public.create_birthday_reply(bigint, text, text, text) from public, anon, authenticated;')
    expect(migration).toContain('grant execute on function public.create_birthday_reply(bigint, text, text, text) to service_role;')
    expect(migration).not.toMatch(/grant .*delete .*post_replies/i)
    expect(migration).not.toMatch(/grant .*delete .*bulletin_posts/i)
    expect(migration).not.toContain('update public.post_replies')
    expect(migration).not.toContain('delete from public.post_replies')
  })
})
