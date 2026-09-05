import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('resolveMusicTrack', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
    delete process.env.JAMENDO_CLIENT_ID
    delete process.env.SOUNDCLOUD_CLIENT_ID
    delete process.env.SOUNDCLOUD_CLIENT_SECRET
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('resolves a curated Jamendo preset without JAMENDO_CLIENT_ID', async () => {
    const { resolveMusicTrack } = await import('@/lib/music/server')

    const track = await resolveMusicTrack('jamendo:1503376')

    expect(track).toMatchObject({
      provider: 'jamendo',
      trackId: '1503376',
      reference: 'jamendo:1503376',
      access: 'playable',
      name: 'Music For The Distant Distances',
      artistName: 'Ambient Samurai - Ichiro NAKAGAWA',
      duration: 321,
      licenseUrl: 'http://creativecommons.org/licenses/by/3.0/',
      sourceUrl: 'https://www.jamendo.com/track/1503376',
      streamUrl: 'https://mp3l.jamendo.com/?trackid=1503376&format=mp31&from=app-devsite',
    })
    expect(track?.streamUrl.startsWith('https://')).toBe(true)
  })

  it('also resolves a bare legacy Jamendo ID that belongs to a preset', async () => {
    const { resolveMusicTrack } = await import('@/lib/music/server')

    const track = await resolveMusicTrack('1503376')

    expect(track).not.toBeNull()
    expect(track?.streamUrl).toBe('https://mp3l.jamendo.com/?trackid=1503376&format=mp31&from=app-devsite')
  })

  it('returns null for a Jamendo ID that is not in the curated set when JAMENDO_CLIENT_ID is missing', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { resolveMusicTrack } = await import('@/lib/music/server')

    const track = await resolveMusicTrack('jamendo:999999999999')

    expect(track).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns null for an invalid reference before contacting any provider', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { resolveMusicTrack } = await import('@/lib/music/server')

    const track = await resolveMusicTrack('https://evil.test/audio.mp3')

    expect(track).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns null for SoundCloud when OAuth credentials are missing', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { resolveMusicTrack } = await import('@/lib/music/server')

    const track = await resolveMusicTrack('soundcloud:123456789')

    expect(track).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
