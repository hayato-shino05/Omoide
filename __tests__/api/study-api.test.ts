/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as verifyPasscodePost } from '@/app/api/study/verify-passcode/route'
import { POST as joinRoomPost } from '@/app/api/study/join/route'
import { POST as playbackPost } from '@/app/api/study/playback/route'
import * as supabaseClientModule from '@/lib/supabase/client'

vi.mock('@/lib/supabase/client', () => ({
  getSupabase: vi.fn(),
}))

describe('Study Room Server-side API Authorization & Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/study/verify-passcode', () => {
    it('無効な入力パラメータの場合は400を返すこと', async () => {
      const request = new NextRequest('http://localhost:3000/api/study/verify-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: '', passcode: 123 }),
      })
      const res = await verifyPasscodePost(request)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.valid).toBe(false)
    })

    it('部屋が存在しない場合は404を返すこと', async () => {
      const mockChain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
      vi.mocked(supabaseClientModule.getSupabase).mockReturnValue({
        from: vi.fn().mockReturnValue(mockChain),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/study/verify-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: 'non_existent', passcode: '1234' }),
      })
      const res = await verifyPasscodePost(request)
      expect(res.status).toBe(404)
    })

    it('公開部屋の場合は常にvalid: trueを返すこと', async () => {
      const mockChain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'room_pub', is_private: false, passcode: null },
          error: null,
        }),
      }
      vi.mocked(supabaseClientModule.getSupabase).mockReturnValue({
        from: vi.fn().mockReturnValue(mockChain),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/study/verify-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: 'room_pub', passcode: '' }),
      })
      const res = await verifyPasscodePost(request)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.valid).toBe(true)
    })

    it('非公開部屋でパスコードが一致する場合はvalid: trueを返すこと', async () => {
      const mockChain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'room_priv', is_private: true, passcode: 'secret77' },
          error: null,
        }),
      }
      vi.mocked(supabaseClientModule.getSupabase).mockReturnValue({
        from: vi.fn().mockReturnValue(mockChain),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/study/verify-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: 'room_priv', passcode: 'secret77' }),
      })
      const res = await verifyPasscodePost(request)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.valid).toBe(true)
    })

    it('非公開部屋でパスコードが不一致の場合はvalid: falseを返すこと', async () => {
      const mockChain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'room_priv', is_private: true, passcode: 'secret77' },
          error: null,
        }),
      }
      vi.mocked(supabaseClientModule.getSupabase).mockReturnValue({
        from: vi.fn().mockReturnValue(mockChain),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/study/verify-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: 'room_priv', passcode: 'wrong_pass' }),
      })
      const res = await verifyPasscodePost(request)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.valid).toBe(false)
    })
  })

  describe('POST /api/study/join', () => {
    it('非公開部屋への不正なパスコードでの参加を403で拒絶すること', async () => {
      const mockRoomChain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'room_priv', is_private: true, passcode: 'pass123', max_members: 10 },
          error: null,
        }),
      }

      vi.mocked(supabaseClientModule.getSupabase).mockReturnValue({
        from: vi.fn().mockReturnValue(mockRoomChain),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/study/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: 'room_priv',
          member: { user_identifier: 'user_attacker', display_name: 'Attacker' },
          passcode: 'wrong_pass',
        }),
      })
      const res = await joinRoomPost(request)
      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.error).toBe('パスコードが正しくありません')
    })

    it('満席の部屋への新規参加を409で拒絶すること', async () => {
      const mockRoomChain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'room_full', is_private: false, passcode: null, max_members: 2 },
          error: null,
        }),
      }

      const mockMembersChain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [
            { user_identifier: 'u1', last_heartbeat_at: new Date().toISOString() },
            { user_identifier: 'u2', last_heartbeat_at: new Date().toISOString() },
          ],
          error: null,
        }),
      }

      vi.mocked(supabaseClientModule.getSupabase).mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === 'study_rooms') return mockRoomChain
          return mockMembersChain
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/study/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: 'room_full',
          member: { user_identifier: 'user_new', display_name: 'New Member' },
        }),
      })
      const res = await joinRoomPost(request)
      expect(res.status).toBe(409)
      const json = await res.json()
      expect(json.error).toBe('部屋が満席のため参加できません')
    })

    it('正常な参加リクエストでメンバー情報を保存し200を返すこと', async () => {
      const mockRoomChain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'room_ok', is_private: false, passcode: null, max_members: 10 },
          error: null,
        }),
      }

      const mockMembersSelectChain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'mem_1',
                room_id: 'room_ok',
                user_identifier: 'u_alice',
                display_name: 'Alice',
                focus_status: 'focusing',
              },
              error: null,
            }),
          }),
        }),
      }

      vi.mocked(supabaseClientModule.getSupabase).mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === 'study_rooms') return mockRoomChain
          return mockMembersSelectChain
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/study/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: 'room_ok',
          member: { user_identifier: 'u_alice', display_name: 'Alice' },
        }),
      })
      const res = await joinRoomPost(request)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data.display_name).toBe('Alice')
    })
  })

  describe('POST /api/study/playback', () => {
    it('非ホストによるBGM操作リクエストを403で拒絶すること（権限保護）', async () => {
      const mockChain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'room_1', host_id: 'host_real' },
          error: null,
        }),
      }

      vi.mocked(supabaseClientModule.getSupabase).mockReturnValue({
        from: vi.fn().mockReturnValue(mockChain),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/study/playback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: 'room_1',
          hostId: 'attacker_user',
          payload: { playback_state: 'paused' },
        }),
      })
      const res = await playbackPost(request)
      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.error).toBe('BGMの操作権限がありません（ホスト限定）')
    })

    it('正規ホストによるBGM操作リクエストを受け入れ200を返すこと', async () => {
      const mockSelectChain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'room_1', host_id: 'host_real' },
          error: null,
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      }

      vi.mocked(supabaseClientModule.getSupabase).mockReturnValue({
        from: vi.fn().mockReturnValue(mockSelectChain),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/study/playback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: 'room_1',
          hostId: 'host_real',
          payload: { playback_state: 'playing', current_track_id: 'omoide:99' },
        }),
      })
      const res = await playbackPost(request)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
    })
  })
})
