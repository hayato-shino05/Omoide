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

  it('resolves a Jamendo ID with fallback stream URL when JAMENDO_CLIENT_ID is missing', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { resolveMusicTrack } = await import('@/lib/music/server')

    const track = await resolveMusicTrack('jamendo:999999999999')

    expect(track).toMatchObject({
      provider: 'jamendo',
      trackId: '999999999999',
      reference: 'jamendo:999999999999',
      access: 'playable',
      streamUrl: 'https://mp3l.jamendo.com/?trackid=999999999999&format=mp31&from=app-devsite',
    })
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

  it('exchanges one SoundCloud token for two requests and keeps it out of track metadata', async () => {
    process.env.SOUNDCLOUD_CLIENT_ID = 'client-id'
    process.env.SOUNDCLOUD_CLIENT_SECRET = 'client-secret'
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'secret-token', expires_in: 3600 }), { status: 200 }))
      .mockImplementation(async () => new Response(JSON.stringify({
        id: 123,
        title: 'Birthday',
        access: 'playable',
        stream_url: 'https://cf-media.sndcdn.com/streams/123',
        user: { username: 'Artist' },
      }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const { resolveMusicTrack } = await import('@/lib/music/server')

    const first = await resolveMusicTrack('soundcloud:123')
    const second = await resolveMusicTrack('soundcloud:123')

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ Authorization: 'Basic Y2xpZW50LWlkOmNsaWVudC1zZWNyZXQ=' })
    expect(fetchMock.mock.calls[1][1]?.headers).toMatchObject({ Authorization: 'OAuth secret-token' })
    expect(first).toMatchObject({ access: 'playable', streamUrl: 'https://cf-media.sndcdn.com/streams/123' })
    expect(second).toMatchObject({ access: 'playable' })
    expect(JSON.stringify(first)).not.toContain('secret-token')
  })

  it('re-exchanges an expired SoundCloud token once', async () => {
    process.env.SOUNDCLOUD_CLIENT_ID = 'client-id'
    process.env.SOUNDCLOUD_CLIENT_SECRET = 'client-secret'
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'first-token', expires_in: 1 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 1, title: 'First', access: 'playable', stream_url: 'https://cf-media.sndcdn.com/streams/1' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'second-token', expires_in: 3600 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 2, title: 'Second', access: 'playable', stream_url: 'https://cf-media.sndcdn.com/streams/2' }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const { resolveMusicTrack } = await import('@/lib/music/server')

    await resolveMusicTrack('soundcloud:1')
    await resolveMusicTrack('soundcloud:2')

    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(fetchMock.mock.calls[2][1]?.headers).toMatchObject({ Authorization: 'Basic Y2xpZW50LWlkOmNsaWVudC1zZWNyZXQ=' })
  })

  it.each([
    ['preview', 'preview'],
    ['blocked', 'blocked'],
  ] as const)('preserves SoundCloud %s access state', async (access, expectedAccess) => {
    process.env.SOUNDCLOUD_CLIENT_ID = 'client-id'
    process.env.SOUNDCLOUD_CLIENT_SECRET = 'client-secret'
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'secret-token', expires_in: 3600 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ collection: [{ id: 123, title: 'Birthday', access }] }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const { searchMusicTracks } = await import('@/lib/music/server')

    const tracks = await searchMusicTracks('birthday', 10)

    expect(tracks).toMatchObject([{ access: expectedAccess }])
  })

  it('maps SoundCloud array search responses', async () => {
    process.env.SOUNDCLOUD_CLIENT_ID = 'client-id'
    process.env.SOUNDCLOUD_CLIENT_SECRET = 'client-secret'
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'secret-token', expires_in: 3600 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 123, title: 'Vaundy', access: 'playable' }]), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const { searchMusicTracks } = await import('@/lib/music/server')

    const tracks = await searchMusicTracks('vaundy', 10)

    expect(tracks).toMatchObject([{ reference: 'soundcloud:123', name: 'Vaundy', access: 'playable' }])
  })

  it.each(['preview', 'blocked'] as const)('does not resolve SoundCloud %s tracks into full playback', async (access) => {
    process.env.SOUNDCLOUD_CLIENT_ID = 'client-id'
    process.env.SOUNDCLOUD_CLIENT_SECRET = 'client-secret'
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'secret-token', expires_in: 3600 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 123, title: 'Birthday', access, stream_url: 'https://cf-media.sndcdn.com/streams/123' }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const { resolveMusicTrack } = await import('@/lib/music/server')

    const track = await resolveMusicTrack('soundcloud:123')

    expect(track).toBeNull()
  })

  it('rejects SoundCloud stream URLs from unapproved hosts', async () => {
    process.env.SOUNDCLOUD_CLIENT_ID = 'client-id'
    process.env.SOUNDCLOUD_CLIENT_SECRET = 'client-secret'
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'secret-token', expires_in: 3600 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 123, title: 'Birthday', access: 'playable', stream_url: 'https://evil.test/stream.mp3' }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const { resolveMusicTrack } = await import('@/lib/music/server')

    const track = await resolveMusicTrack('soundcloud:123')

    expect(track).toBeNull()
  })

  it('resolves SoundCloud api stream endpoint to CDN URL via redirect or http_mp3_128_url', async () => {
    process.env.SOUNDCLOUD_CLIENT_ID = 'client-id'
    process.env.SOUNDCLOUD_CLIENT_SECRET = 'client-secret'
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'secret-token', expires_in: 3600 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 123, title: 'Birthday', access: 'playable', stream_url: 'https://api.soundcloud.com/tracks/123/stream' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ http_mp3_128_url: 'https://cf-media.sndcdn.com/tracks/123/audio.mp3' }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const { resolveMusicTrack } = await import('@/lib/music/server')

    const track = await resolveMusicTrack('soundcloud:123')

    expect(track?.streamUrl).toBe('https://cf-media.sndcdn.com/tracks/123/audio.mp3')
  })

  it('uses a fresh timeout signal for each SoundCloud retry', async () => {
    process.env.SOUNDCLOUD_CLIENT_ID = 'client-id'
    process.env.SOUNDCLOUD_CLIENT_SECRET = 'client-secret'
    const signals: AbortSignal[] = []
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'secret-token', expires_in: 3600 }), { status: 200 }))
      .mockImplementationOnce(async (_input, init) => {
        signals.push(init?.signal as AbortSignal)
        throw new DOMException('timed out', 'TimeoutError')
      })
      .mockImplementationOnce(async (_input, init) => {
        signals.push(init?.signal as AbortSignal)
        return new Response(JSON.stringify({ id: 123, title: 'Birthday', access: 'playable', stream_url: 'https://cf-media.sndcdn.com/streams/123' }), { status: 200 })
      })
    vi.stubGlobal('fetch', fetchMock)
    const { resolveMusicTrack } = await import('@/lib/music/server')

    const track = await resolveMusicTrack('soundcloud:123')

    expect(track?.access).toBe('playable')
    expect(signals).toHaveLength(2)
    expect(signals[0]).not.toBe(signals[1])
  })

  it('marks a SoundCloud track with playable access as playable in search results', async () => {
    process.env.SOUNDCLOUD_CLIENT_ID = 'client-id'
    process.env.SOUNDCLOUD_CLIENT_SECRET = 'client-secret'
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'secret-token', expires_in: 3600 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ collection: [{ id: 123, title: 'Birthday', access: 'playable' }] }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const { searchMusicTracks } = await import('@/lib/music/server')

    const tracks = await searchMusicTracks('birthday', 10)

    expect(tracks).toMatchObject([{ access: 'playable' }])
  })

  it('returns null for a SoundCloud upstream error without exposing its body', async () => {
    process.env.SOUNDCLOUD_CLIENT_ID = 'client-id'
    process.env.SOUNDCLOUD_CLIENT_SECRET = 'client-secret'
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'secret-token', expires_in: 3600 }), { status: 200 }))
      .mockResolvedValue(new Response('upstream-secret-body', { status: 503 }))
    vi.stubGlobal('fetch', fetchMock)
    const { resolveMusicTrack } = await import('@/lib/music/server')

    const track = await resolveMusicTrack('soundcloud:123')

    expect(track).toBeNull()
    expect(JSON.stringify(track)).not.toContain('upstream-secret-body')
  })
})
