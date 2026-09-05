import { describe, expect, it } from 'vitest'
import { JAPAN_PRESET_TRACKS } from '@/lib/music/presets'
import {
  DEFAULT_MUSIC_TRACKS,
  getCuratedMusicTrack,
  MUSIC_CATEGORIES,
} from '@/config/music'

describe('curated music catalog', () => {
  it('exposes the curated Jamendo presets as the bundled catalog', () => {
    expect(DEFAULT_MUSIC_TRACKS).toHaveLength(JAPAN_PRESET_TRACKS.length)
    expect(DEFAULT_MUSIC_TRACKS.map((track) => track.id)).toEqual(
      JAPAN_PRESET_TRACKS.map((track) => track.id),
    )
  })

  it('does not expose a custom upload category', () => {
    expect(MUSIC_CATEGORIES).not.toContain('Custom')
  })

  it('resolves only catalog track IDs', () => {
    const firstPreset = JAPAN_PRESET_TRACKS[0]
    expect(getCuratedMusicTrack(firstPreset.id)?.url).toBe(firstPreset.audioUrl)
    expect(getCuratedMusicTrack('user-upload')).toBeNull()
  })
})
