import { describe, expect, it } from 'vitest'
import { parseMusicTrackReference } from '@/lib/music/reference'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const hookSource = readFileSync(join(process.cwd(), 'lib', 'hooks', 'useMessages.ts'), 'utf8')

describe('useMessages music track validation contract', () => {
  it.each(['soundcloud:123456', 'jamendo:1503376', '1503376'])('routes %s through parseMusicTrackReference', (value) => {
    expect(parseMusicTrackReference(value)).not.toBeNull()
  })

  it.each(['https://evil.test/audio.mp3', 'user-upload', 'spotify:abc'])('rejects %s before inserting', (value) => {
    expect(parseMusicTrackReference(value)).toBeNull()
  })

  it('uses parseMusicTrackReference, not the legacy Jamendo pattern', () => {
    expect(hookSource).toContain('parseMusicTrackReference')
    expect(hookSource).not.toContain('JAMENDO_TRACK_ID_PATTERN')
  })
})
