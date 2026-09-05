import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const server = vi.hoisted(() => ({ createServiceClient: vi.fn() }))
const music = vi.hoisted(() => ({ validateMusicTrackReference: vi.fn(async (value: string) => value) }))
vi.mock('@/lib/time-capsule/server', () => server)
vi.mock('@/lib/music/server', () => music)

import { POST } from '@/app/api/community/route'

function makeClient(rpcResult: { data: unknown; error: Error | null } = { data: { message: { id: 1 } }, error: null }) {
  const remove = vi.fn().mockResolvedValue({ error: null })
  const upload = vi.fn().mockResolvedValue({ error: null })
  const client = {
    rpc: vi.fn().mockResolvedValue(rpcResult),
    storage: { from: vi.fn(() => ({ upload, remove })) },
  }
  server.createServiceClient.mockReturnValue(client)
  return { client, upload, remove }
}

function request(fields: Record<string, string>, file?: File) {
  const body = new FormData()
  Object.entries(fields).forEach(([key, value]) => body.set(key, value))
  if (file) body.set('media', file)
  return { formData: async () => body } as unknown as NextRequest
}

function malformedRequest() {
  return { formData: async () => { throw new TypeError('malformed form data') } } as unknown as NextRequest
}

beforeEach(() => vi.resetAllMocks())

describe('POST /api/community', () => {
  it('uploads media and creates a message through the fixed RPC', async () => {
    const { client, upload } = makeClient()
    const response = await POST(request({ kind: 'message', sender: '花子', content: 'おめでとう' }, new File(['image'], 'cake.png', { type: 'image/png' })))

    expect(response.status).toBe(201)
    expect(upload).toHaveBeenCalledOnce()
    expect(client.rpc).toHaveBeenCalledWith('create_community_submission', expect.objectContaining({ p_kind: 'message', p_object_path: expect.stringMatching(/^images\//), p_music_track_id: null }))
  })

  it('normalizes a legacy Jamendo id before validating it server-side', async () => {
    const { client } = makeClient()
    const body = new FormData()
    body.set('kind', 'message')
    body.set('sender', '花子')
    body.set('content', '本文')
    body.set('musicTrackId', '1503376')

    const response = await POST({ formData: async () => body } as unknown as NextRequest)

    expect(response.status).toBe(201)
    expect(music.validateMusicTrackReference).toHaveBeenCalledWith('jamendo:1503376')
    expect(client.rpc).toHaveBeenCalledWith('create_community_submission', expect.objectContaining({ p_music_track_id: 'jamendo:1503376' }))
  })

  it('passes a SoundCloud reference through server-side validation', async () => {
    const { client } = makeClient()
    const response = await POST(request({ kind: 'message', sender: '花子', content: '本文', musicTrackId: 'soundcloud:123456' }))

    expect(response.status).toBe(201)
    expect(music.validateMusicTrackReference).toHaveBeenCalledWith('soundcloud:123456')
    expect(client.rpc).toHaveBeenCalledWith('create_community_submission', expect.objectContaining({ p_music_track_id: 'soundcloud:123456' }))
  })

  it('rejects non-numeric music track ids before creating a service client', async () => {
    const response = await POST(request({ kind: 'message', sender: '花子', content: '本文', musicTrackId: 'user-upload' }))

    expect(response.status).toBe(400)
    expect(server.createServiceClient).not.toHaveBeenCalled()
  })

  it('removes uploaded media when the RPC fails and returns a safe error', async () => {
    const { remove } = makeClient({ data: null, error: new Error('database detail') })
    const response = await POST(request({ kind: 'post', sender: '花子', content: '本文' }, new File(['image'], 'cake.png', { type: 'image/png' })))

    expect(response.status).toBe(500)
    expect(remove).toHaveBeenCalledOnce()
    await expect(response.json()).resolves.toEqual({ error: '投稿を送信できません' })
  })

  it('does not remove media when the RPC transport rejects', async () => {
    const { client, remove } = makeClient()
    client.rpc.mockRejectedValue(new Error('transport failure'))
    const response = await POST(request({ kind: 'post', sender: '花子', content: '本文' }, new File(['image'], 'cake.png', { type: 'image/png' })))

    expect(response.status).toBe(500)
    expect(remove).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toEqual({ error: '投稿を送信できません' })
  })

  it('rejects unsupported input before creating a service client', async () => {
    makeClient()
    const response = await POST(request({ kind: 'message', sender: '', content: '本文' }))

    expect(response.status).toBe(400)
    expect(server.createServiceClient).not.toHaveBeenCalled()
  })

  it('rejects overlong optional fields instead of silently dropping them', async () => {
    makeClient()
    const birthdayPersonResponse = await POST(request({
      kind: 'message',
      sender: '花子',
      content: '本文',
      birthdayPerson: 'あ'.repeat(101),
    }))
    const descriptionResponse = await POST(request({
      kind: 'post',
      sender: '花子',
      content: '本文',
      description: 'あ'.repeat(1001),
    }))

    expect(birthdayPersonResponse.status).toBe(400)
    expect(descriptionResponse.status).toBe(400)
    expect(server.createServiceClient).not.toHaveBeenCalled()
  })

  it('rejects descriptions when no media exists instead of dropping them', async () => {
    makeClient()
    const response = await POST(request({
      kind: 'post',
      sender: '花子',
      content: '本文',
      description: '画像の説明',
    }))

    expect(response.status).toBe(400)
    expect(server.createServiceClient).not.toHaveBeenCalled()
  })

  it('rejects overlong filenames before uploading media', async () => {
    const { upload } = makeClient()
    const longName = new File(['image'], `${'a'.repeat(252)}.png`, { type: 'image/png' })

    const response = await POST(request({ kind: 'message', sender: '花子', content: '本文' }, longName))

    expect(response.status).toBe(400)
    expect(upload).not.toHaveBeenCalled()
  })

  it.each(['path/file.png', 'path\\file.png', 'file\u0000.png'])('rejects unsafe filename %j before uploading media', async (filename) => {
    const { upload } = makeClient()
    const response = await POST(request({ kind: 'message', sender: '花子', content: '本文' }, new File(['image'], filename, { type: 'image/png' })))

    expect(response.status).toBe(400)
    expect(upload).not.toHaveBeenCalled()
  })

  it('maps malformed form data to a bad request', async () => {
    makeClient()
    const response = await POST(malformedRequest())

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: '投稿内容が無効です' })
    expect(server.createServiceClient).not.toHaveBeenCalled()
  })
})
