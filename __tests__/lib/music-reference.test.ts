import { describe, it, expect } from 'vitest'
import { parseMusicTrackReference, toMusicTrackReference } from '@/lib/music/reference'

describe('Music Reference Logic Tests', () => {
  describe('parseMusicTrackReference', () => {
    it('should parse bare numeric Jamendo track ID', () => {
      const result = parseMusicTrackReference('123456')
      expect(result).toEqual({ provider: 'jamendo', trackId: '123456' })
    })

    it('should parse explicit jamendo prefix', () => {
      const result = parseMusicTrackReference('jamendo:987654')
      expect(result).toEqual({ provider: 'jamendo', trackId: '987654' })
    })

    it('should parse soundcloud prefix with numeric track ID', () => {
      const result = parseMusicTrackReference('soundcloud:1928374650')
      expect(result).toEqual({ provider: 'soundcloud', trackId: '1928374650' })
    })

    it('should parse omoide prefix for Supabase curated tracks', () => {
      const result = parseMusicTrackReference('omoide:1')
      expect(result).toEqual({ provider: 'omoide', trackId: '1' })

      const multiDigit = parseMusicTrackReference('omoide:105')
      expect(multiDigit).toEqual({ provider: 'omoide', trackId: '105' })
    })

    it('should reject invalid providers or malformed strings', () => {
      expect(parseMusicTrackReference('')).toBeNull()
      expect(parseMusicTrackReference(null)).toBeNull()
      expect(parseMusicTrackReference(undefined)).toBeNull()
      expect(parseMusicTrackReference(12345)).toBeNull()
      expect(parseMusicTrackReference('spotify:12345')).toBeNull()
      expect(parseMusicTrackReference('omoide:')).toBeNull()
      expect(parseMusicTrackReference('omoide:abc')).toBeNull()
      expect(parseMusicTrackReference('jamendo:abc')).toBeNull()
      expect(parseMusicTrackReference('soundcloud:abc')).toBeNull()
      expect(parseMusicTrackReference('omoide:1:2')).toBeNull()
    })
  })

  describe('toMusicTrackReference', () => {
    it('should format references into standardized prefix:id strings', () => {
      expect(toMusicTrackReference({ provider: 'omoide', trackId: '1' })).toBe('omoide:1')
      expect(toMusicTrackReference({ provider: 'jamendo', trackId: '555' })).toBe('jamendo:555')
      expect(toMusicTrackReference({ provider: 'soundcloud', trackId: '999' })).toBe('soundcloud:999')
    })
  })
})
