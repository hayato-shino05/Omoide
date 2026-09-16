import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/community/reply/route'
import { NextRequest } from 'next/server'
import * as replyModule from '@/lib/community/reply'

vi.mock('@/lib/community/reply', () => ({
  createBirthdayReply: vi.fn(),
}))

describe('/api/community/reply POST Logic Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reject requests with invalid json body', async () => {
    const request = new NextRequest('http://localhost:3000/api/community/reply', {
      method: 'POST',
      body: 'invalid json string',
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBeDefined()
  })

  it('should reject requests missing required fields (postId, sender)', async () => {
    const request = new NextRequest('http://localhost:3000/api/community/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'Hello without sender or postId',
      }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('should reject requests with neither content nor musicTrackId', async () => {
    const request = new NextRequest('http://localhost:3000/api/community/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: 1,
        sender: 'Test User',
        content: null,
        musicTrackId: null,
      }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('should accept valid reply with text content and dispatch to createBirthdayReply', async () => {
    vi.mocked(replyModule.createBirthdayReply).mockResolvedValueOnce({ id: 1, message: 'Great post!' })

    const request = new NextRequest('http://localhost:3000/api/community/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: 42,
        sender: 'Alice',
        content: 'Happy Birthday!',
      }),
    })
    const response = await POST(request)
    expect(response.status).toBe(201)
    expect(replyModule.createBirthdayReply).toHaveBeenCalledWith({
      postId: 42,
      sender: 'Alice',
      content: 'Happy Birthday!',
      musicTrackId: null,
    })
  })

  it('should accept valid reply with omoide: musicTrackId', async () => {
    vi.mocked(replyModule.createBirthdayReply).mockResolvedValueOnce({ id: 2, music_track_id: 'omoide:1' })

    const request = new NextRequest('http://localhost:3000/api/community/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: 42,
        sender: 'Bob',
        content: null,
        musicTrackId: 'omoide:1',
      }),
    })
    const response = await POST(request)
    expect(response.status).toBe(201)
    expect(replyModule.createBirthdayReply).toHaveBeenCalledWith({
      postId: 42,
      sender: 'Bob',
      content: null,
      musicTrackId: 'omoide:1',
    })
  })

  it('should return 500 when createBirthdayReply throws', async () => {
    vi.mocked(replyModule.createBirthdayReply).mockRejectedValueOnce(new Error('DB failure'))

    const request = new NextRequest('http://localhost:3000/api/community/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: 42,
        sender: 'Alice',
        content: 'Test failure',
      }),
    })
    const response = await POST(request)
    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json.error).toBe('返信を送信できません')
  })
})
