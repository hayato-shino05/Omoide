import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(join(process.cwd(), 'supabase', 'migrations', '20260904000001_revoke_anonymous_music_upload.sql'), 'utf8')

describe('anonymous music upload revocation migration', () => {
  it('revokes anonymous music writes without changing community media policies', () => {
    expect(migration).toContain('revoke insert on table public.music_tracks from anon;')
    expect(migration).toContain('revoke usage, select on sequence public.music_tracks_id_seq from anon;')
    expect(migration).toContain('drop policy if exists U&"\\533F\\540D\\4F5C\\6210: \\97F3\\697D\\30B9\\30C8\\30EC\\30FC\\30B8" on storage.objects;')
    expect(migration).not.toContain('community-media')
    expect(migration).not.toContain('photo-album')
  })
})
