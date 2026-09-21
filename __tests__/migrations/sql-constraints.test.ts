import { describe, it, expect } from 'vitest'

describe('Database SQL Constraint Regex Validation', () => {
  // Regex used in messages, post_replies, create_community_submission, create_birthday_reply
  const MUSIC_TRACK_ID_REGEX = /^(?:jamendo:|omoide:)?[0-9]{1,12}$|^soundcloud:[0-9]{1,20}$/

  describe('MUSIC_TRACK_ID_REGEX', () => {
    it('should match bare numeric Jamendo track IDs (up to 12 digits)', () => {
      expect(MUSIC_TRACK_ID_REGEX.test('1')).toBe(true)
      expect(MUSIC_TRACK_ID_REGEX.test('123456')).toBe(true)
      expect(MUSIC_TRACK_ID_REGEX.test('123456789012')).toBe(true)
      // > 12 digits should fail for Jamendo
      expect(MUSIC_TRACK_ID_REGEX.test('1234567890123')).toBe(false)
    })

    it('should match jamendo: prefix track IDs', () => {
      expect(MUSIC_TRACK_ID_REGEX.test('jamendo:1')).toBe(true)
      expect(MUSIC_TRACK_ID_REGEX.test('jamendo:123456')).toBe(true)
      expect(MUSIC_TRACK_ID_REGEX.test('jamendo:123456789012')).toBe(true)
    })

    it('should match omoide: prefix track IDs for Supabase curated tracks', () => {
      expect(MUSIC_TRACK_ID_REGEX.test('omoide:1')).toBe(true)
      expect(MUSIC_TRACK_ID_REGEX.test('omoide:42')).toBe(true)
      expect(MUSIC_TRACK_ID_REGEX.test('omoide:999999')).toBe(true)
    })

    it('should match soundcloud: prefix track IDs (up to 20 digits)', () => {
      expect(MUSIC_TRACK_ID_REGEX.test('soundcloud:1')).toBe(true)
      expect(MUSIC_TRACK_ID_REGEX.test('soundcloud:12345678901234567890')).toBe(true)
      // > 20 digits should fail
      expect(MUSIC_TRACK_ID_REGEX.test('soundcloud:123456789012345678901')).toBe(false)
    })

    it('should reject invalid providers and malformed strings', () => {
      expect(MUSIC_TRACK_ID_REGEX.test('')).toBe(false)
      expect(MUSIC_TRACK_ID_REGEX.test('spotify:123')).toBe(false)
      expect(MUSIC_TRACK_ID_REGEX.test('omoide:abc')).toBe(false)
      expect(MUSIC_TRACK_ID_REGEX.test('jamendo:xyz')).toBe(false)
      expect(MUSIC_TRACK_ID_REGEX.test('soundcloud:test')).toBe(false)
      expect(MUSIC_TRACK_ID_REGEX.test('omoide:')).toBe(false)
      expect(MUSIC_TRACK_ID_REGEX.test('omoide:1; DROP TABLE messages;')).toBe(false)
    })
  })
})
