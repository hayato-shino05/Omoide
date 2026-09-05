import { beforeEach, describe, expect, it, vi } from 'vitest'

const server = vi.hoisted(() => ({ createServiceClient: vi.fn() }))
vi.mock('@/lib/time-capsule/server', () => server)

const birthday = vi.hoisted(() => ({
  listTodaysBirthdayThreads: vi.fn(),
}))
vi.mock('@/lib/birthday/thread', () => birthday)

import { GET } from '@/app/api/community/birthday-threads/route'

function thread(id: string, birthdayPerson: string, coverUrl: string | null) {
  return {
    id, sender: 'System', message: 'm', birthday_person: birthdayPerson,
    celebration_date: '2026-09-05', timezone: 'Asia/Tokyo', created_at: '2026-09-05T00:00:00Z', coverUrl,
  }
}

beforeEach(() => vi.resetAllMocks())

describe('GET /api/community/birthday-threads', () => {
  it('returns deterministic threads with their cover URL', async () => {
    birthday.listTodaysBirthdayThreads.mockResolvedValue([
      thread('1', 'Hayato', 'https://cdn.example/cover.jpg'),
      thread('2', 'Yui', null),
    ])
    const response = await GET()

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.data).toHaveLength(2)
    expect(payload.data[0]).toMatchObject({ birthday_person: 'Hayato', coverUrl: 'https://cdn.example/cover.jpg' })
    expect(server.createServiceClient).toHaveBeenCalled()
  })

  it('maps a service failure to a safe 500', async () => {
    birthday.listTodaysBirthdayThreads.mockRejectedValue(new Error('database detail'))
    const response = await GET()

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: '誕生日スレッドを取得できません' })
  })
})
