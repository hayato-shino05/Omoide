import { describe, it, expect } from 'vitest'
import { AMBIENT_SOUNDS, AMBIENT_PRESETS } from '@/lib/audio/ambientSources'

describe('Study Room & Ambient Sound Config Tests', () => {
  it('should have 4 predefined ambient sound sources', () => {
    expect(AMBIENT_SOUNDS).toHaveLength(4)
    const soundIds = AMBIENT_SOUNDS.map((s) => s.id)
    expect(soundIds).toContain('rain')
    expect(soundIds).toContain('cafe')
    expect(soundIds).toContain('wind_chime')
    expect(soundIds).toContain('fireplace')
  })

  it('should have valid ambient sound presets', () => {
    expect(AMBIENT_PRESETS.length).toBeGreaterThan(0)
    AMBIENT_PRESETS.forEach((preset) => {
      expect(preset.volumes.rain).toBeGreaterThanOrEqual(0)
      expect(preset.volumes.rain).toBeLessThanOrEqual(1)
      expect(preset.volumes.cafe).toBeGreaterThanOrEqual(0)
      expect(preset.volumes.cafe).toBeLessThanOrEqual(1)
    })
  })
})
