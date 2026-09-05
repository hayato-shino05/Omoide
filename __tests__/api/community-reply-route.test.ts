import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const server = vi.hoisted(() => ({ createServiceClient: vi.fn() }))
const music = vi.hoisted(() => ({ validateMusicTrackReference: vi.fn(async (value: string) => value) }))
vi.mock('@/lib/time-capsule/server', () => server)
vi.mock('@/lib/music/server', () => music)

import { POST } from '@/app/api/community/reply/route'

function makeClient(rpcResult: { data: unknown; error: Error | null } = { data: { id: 1 }, error: null }) {
  const client = { rpc: vi.fn().mockResolvedValue(rpcResult) }
  server.createServiceClient.mockReturnValue(client)
  return { client }
}

function jsonRequest(body: unknown): NextRequest {
  return {
    json: async () => body,
  } as unknown as NextRequest
}

function malformedRequest(): NextRequest {
  return { json: async () => { throw new TypeError('malformed json') } } as unknown as NextRequest
}

beforeEach(() => vi.resetAllMocks())

describe('POST /api/community/reply', () => {
  it('creates a text-only reply on a birthday thread', async () => {
    const { client } = makeClient()
    const response = await POST(jsonRequest({ postId: '12', sender: '花子', content: 'おめでとう' }))

    expect(response.status).toBe(201)
    expect(client.rpc).toHaveBeenCalledWith('create_birthday_reply', {
      p_post_id: 12,
      p_sender: '花子',
      p_content: 'おめでとう',
      p_music_track_id: null,
    })
    expect(music.validateMusicTrackReference).not.toHaveBeenCalled()
  })

  it('creates a music-only reply with a validated reference', async () => {
    const { client } = makeClient()
    const response = await POST(jsonRequest({ postId: '12', sender: '花子', content: null, musicTrackId: 'jamendo:1503376' }))

    expect(response.status).toBe(201)
    expect(music.validateMusicTrackReference).toHaveBeenCalledWith('jamendo:1503376')
    expect(client.rpc).toHaveBeenCalledWith('create_birthday_reply', {
      p_post_id: 12,
      p_sender: '花子',
      p_content: null,
      p_music_track_id: 'jamendo:1503376',
    })
  })

  it('rejects a reply with neither content nor music', async () => {
    makeClient()
    const response = await POST(jsonRequest({ postId: '12', sender: '花子' }))

    expect(response.status).toBe(400)
    expect(server.createServiceClient).not.toHaveBeenCalled()
  })

  it('rejects an invalid music reference before reaching the service client', async () => {
    makeClient()
    const response = await POST(jsonRequest({ postId: '12', sender: '花子', content: null, musicTrackId: 'user-upload' }))

    expect(response.status).toBe(400)
    expect(server.createServiceClient).not.toHaveBeenCalled()
  })

  it('rejects a non-birthday post id and overlong fields', async () => {
    makeClient()
    const badId = await POST(jsonRequest({ postId: 'abc', sender: '花子', content: '本文' }))
    const longSender = await POST(jsonRequest({ postId: '12', sender: 'あ'.repeat(101), content: '本文' }))
    const longContent = await POST(jsonRequest({ postId: '12', sender: '花子', content: 'あ'.repeat(1001) }))

    expect(badId.status).toBe(400)
    expect(longSender.status).toBe(400)
    expect(longContent.status).toBe(400)
    expect(server.createServiceClient).not.toHaveBeenCalled()
  })

  it('maps an RPC failure to a safe 500', async () => {
    makeClient({ data: null, error: new Error('database detail') })
    const response = await POST(jsonRequest({ postId: '12', sender: '花子', content: '本文' }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: '返信を送信できません' })
  })

  it('maps malformed JSON to a bad request', async () => {
    makeClient()
    const response = await POST(malformedRequest())

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: '投稿内容が無効です' })
    expect(server.createServiceClient).not.toHaveBeenCalled()
  })
})
