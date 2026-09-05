import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const music = vi.hoisted(() => ({ searchMusicTracks: vi.fn() }))
vi.mock('@/lib/music/server', () => music)

import { GET } from '@/app/api/music/search/route'

beforeEach(() => vi.resetAllMocks())

describe('GET /api/music/search', () => {
  it('returns empty data for an empty query', async () => {
    const response = await GET(new NextRequest('http://localhost/api/music/search'))
    await expect(response.json()).resolves.toEqual({ data: [], total: 0 })
    expect(music.searchMusicTracks).not.toHaveBeenCalled()
  })

  it('returns provider-aware catalog data without a stream URL', async () => {
    music.searchMusicTracks.mockResolvedValue([{ reference: 'soundcloud:42', provider: 'soundcloud', trackId: '42', access: 'playable', name: 'Birthday', artistName: 'Artist', duration: 120 }])

    const response = await GET(new NextRequest('http://localhost/api/music/search?q=birthday'))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ data: expect.any(Array), total: 1 })
    expect(payload.data[0]).toMatchObject({ reference: 'soundcloud:42', provider: 'soundcloud', trackId: '42' })
    expect(payload.data[0]).not.toHaveProperty('streamUrl')
  })

  it('rejects overlong queries before calling a provider', async () => {
    const response = await GET(new NextRequest(`http://localhost/api/music/search?q=${'a'.repeat(101)}`))

    expect(response.status).toBe(400)
    expect(music.searchMusicTracks).not.toHaveBeenCalled()
  })

  it('returns a safe upstream error', async () => {
    music.searchMusicTracks.mockRejectedValue(new Error('upstream detail'))

    const response = await GET(new NextRequest('http://localhost/api/music/search?q=birthday'))
    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({ error: '音楽検索に失敗しました' })
  })
})
