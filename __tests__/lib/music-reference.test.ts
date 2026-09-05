import { describe, expect, it } from 'vitest'
import { parseMusicTrackReference, toMusicTrackReference } from '@/lib/music/reference'

describe('music track references', () => {
  it('normalizes legacy Jamendo IDs into canonical provider-aware references', () => {
    const reference = parseMusicTrackReference('1503376')

    expect(reference).toEqual({ provider: 'jamendo', trackId: '1503376' })
    expect(toMusicTrackReference(reference!)).toBe('jamendo:1503376')
  })

  it.each(['soundcloud:987654321', 'jamendo:1503376'])('accepts %s', (value) => {
    expect(parseMusicTrackReference(value)).not.toBeNull()
  })

  it.each(['soundcloud:abc', 'spotify:123', 'jamendo:1:2', 'https://example.test/audio.mp3'])('rejects %s', (value) => {
    expect(parseMusicTrackReference(value)).toBeNull()
  })
})
