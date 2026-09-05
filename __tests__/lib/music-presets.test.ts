import { describe, expect, it } from 'vitest'
import { JAPAN_PRESET_TRACKS } from '@/lib/music/presets'

describe('JAPAN_PRESET_TRACKS', () => {
  it('uses the selected Jamendo stream and metadata for every preset', () => {
    expect(JAPAN_PRESET_TRACKS).toHaveLength(10)
    for (const track of JAPAN_PRESET_TRACKS) {
      expect(track.sourceUrl).toMatch(/^https:\/\/www\.jamendo\.com\/track\/\d+$/)
      expect(track.audioUrl).toBe(`https://mp3l.jamendo.com/?trackid=${track.id}&format=mp31&from=app-devsite`)
      expect(track.licenseUrl).toBe('http://creativecommons.org/licenses/by/3.0/')
      expect(track.audioUrl).not.toMatch(/^\/(audio|music)\//)
    }
  })
})
