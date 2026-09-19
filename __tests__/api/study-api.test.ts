/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as verifyPasscodePost } from '@/app/api/study/verify-passcode/route'
import { POST as createRoomPost } from '@/app/api/study/create/route'
import { POST as joinRoomPost } from '@/app/api/study/join/route'
import { POST as playbackPost } from '@/app/api/study/playback/route'
import { POST as memberStatusPost } from '@/app/api/study/member-status/route'
import { POST as leaveRoomPost } from '@/app/api/study/leave/route'
import { POST as requestSongPost } from '@/app/api/study/request-song/route'
import { POST as respondSongRequestPost } from '@/app/api/study/respond-song-request/route'
import * as supabaseServerModule from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  getServiceSupabase: vi.fn(),
  isServerSupabaseConfigured: vi.fn(() => true),
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
      vi.mocked(supabaseServerModule.getServiceSupabase).mockReturnValue({
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
      vi.mocked(supabaseServerModule.getServiceSupabase).mockReturnValue({
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
      vi.mocked(supabaseServerModule.getServiceSupabase).mockReturnValue({
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
      vi.mocked(supabaseServerModule.getServiceSupabase).mockReturnValue({
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

  describe('POST /api/study/create', () => {
    it('正常な入力パラメータで部屋を作成しホストトークンを発行すること', async () => {
      vi.mocked(supabaseServerModule.getServiceSupabase).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({
          data: {
            id: 'room_123',
            name: 'Study Room Alpha',
            host_id: 'host_alice',
            is_private: false,
          },
          error: null,
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/study/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Study Room Alpha',
          host_id: 'host_alice',
          is_private: false,
        }),
      })
      const res = await createRoomPost(request)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data.name).toBe('Study Room Alpha')
      expect(json.hostToken).toBeDefined()
      expect(typeof json.hostToken).toBe('string')
    })
  })

  describe('POST /api/study/join', () => {
    it('他者メンバー識別子の不正ななりすましリクエストを403で拒絶すること', async () => {
      vi.mocked(supabaseServerModule.getServiceSupabase).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'INVALID_MEMBER_TOKEN' },
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/study/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: 'room_1',
          member: { user_identifier: 'victim_user', display_name: 'Imposter' },
          memberToken: 'wrong_token',
        }),
      })
      const res = await joinRoomPost(request)
      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.error).toBe('メンバー識別子の認証に失敗しました（なりすまし防止）')
    })

    it('非公開部屋への不正なパスコードでの参加を403で拒絶すること', async () => {
      vi.mocked(supabaseServerModule.getServiceSupabase).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'INVALID_PASSCODE' },
        }),
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
      vi.mocked(supabaseServerModule.getServiceSupabase).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'ROOM_FULL' },
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

    it('正常な参加リクエストでメンバー情報を保存しメンバートークンを発行して200を返すこと', async () => {
      vi.mocked(supabaseServerModule.getServiceSupabase).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({
          data: {
            id: 'mem_1',
            room_id: 'room_ok',
            user_identifier: 'u_alice',
            display_name: 'Alice',
            focus_status: 'focusing',
          },
          error: null,
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
      expect(json.memberToken).toBeDefined()
    })
  })

  describe('POST /api/study/playback', () => {
    it('非ホストによるBGM操作リクエストを403で拒絶すること（権限保護）', async () => {
      vi.mocked(supabaseServerModule.getServiceSupabase).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'UNAUTHORIZED_HOST' },
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/study/playback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: 'room_1',
          hostId: 'attacker_user',
          hostToken: 'fake_token',
          payload: { playback_state: 'paused' },
        }),
      })
      const res = await playbackPost(request)
      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.error).toBe('BGMの操作権限がありません（ホスト限定）')
    })

    it('正規ホストによるBGM操作リクエストを受け入れ200を返すこと', async () => {
      vi.mocked(supabaseServerModule.getServiceSupabase).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({
          data: { success: true },
          error: null,
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/study/playback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: 'room_1',
          hostId: 'host_real',
          hostToken: 'valid_host_token',
          payload: { playback_state: 'playing', current_track_id: 'omoide:99' },
        }),
      })
      const res = await playbackPost(request)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
    })
  })

  describe('POST /api/study/member-status', () => {
    it('メンバーステータス更新を正常に処理し200を返すこと', async () => {
      vi.mocked(supabaseServerModule.getServiceSupabase).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({
          data: { success: true },
          error: null,
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/study/member-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: 'room_1',
          userIdentifier: 'user_1',
          memberToken: 'valid_token',
          focusStatus: 'short_break',
          streakMinutes: 25,
        }),
      })
      const res = await memberStatusPost(request)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
    })
  })

  describe('POST /api/study/leave', () => {
    it('退室リクエストを正常に処理し200を返すこと', async () => {
      vi.mocked(supabaseServerModule.getServiceSupabase).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({
          data: { success: true, migrated_host_id: null },
          error: null,
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/study/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: 'room_1',
          userIdentifier: 'user_1',
          memberToken: 'valid_token',
        }),
      })
      const res = await leaveRoomPost(request)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
    })

    it('ホスト退出時に後続メンバーへの権限移行（migrated_host_id）を返すこと', async () => {
      vi.mocked(supabaseServerModule.getServiceSupabase).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({
          data: { success: true, migrated_host_id: 'next_active_user' },
          error: null,
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/study/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: 'room_1',
          userIdentifier: 'current_host',
          memberToken: 'valid_host_token',
        }),
      })
      const res = await leaveRoomPost(request)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.migrated_host_id).toBe('next_active_user')
    })
  })

  describe('POST /api/study/request-song', () => {
    it('無効なパラメータの場合は400を返すこと', async () => {
      const request = new NextRequest('http://localhost:3000/api/study/request-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: '', trackId: '' }),
      })
      const res = await requestSongPost(request)
      expect(res.status).toBe(400)
    })

    it('待機上限10曲超過エラー（429）を適切にハンドリングすること', async () => {
      vi.mocked(supabaseServerModule.getServiceSupabase).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'REQUEST_QUEUE_FULL' },
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/study/request-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: 'room_1',
          userIdentifier: 'member_1',
          memberToken: 'valid_token',
          trackId: 'omoide:track1',
          trackName: 'Sakura Breeze',
        }),
      })
      const res = await requestSongPost(request)
      expect(res.status).toBe(429)
      const json = await res.json()
      expect(json.error).toContain('リクエスト待機数が上限')
    })

    it('正規メンバーによる楽曲リクエストを受け入れ200を返すこと', async () => {
      const mockUpdatedRequests = [
        {
          id: 'req_1',
          track_id: 'omoide:track1',
          track_name: 'Sakura Breeze',
          artist_name: 'Omoide Artist',
          requested_by_id: 'member_1',
          requested_by_name: 'Bob',
          created_at: new Date().toISOString(),
        },
      ]

      vi.mocked(supabaseServerModule.getServiceSupabase).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({
          data: mockUpdatedRequests,
          error: null,
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/study/request-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: 'room_1',
          userIdentifier: 'member_1',
          memberToken: 'valid_token',
          trackId: 'omoide:track1',
          trackName: 'Sakura Breeze',
          artistName: 'Omoide Artist',
        }),
      })
      const res = await requestSongPost(request)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.song_requests).toHaveLength(1)
    })
  })

  describe('POST /api/study/respond-song-request', () => {
    it('非ホストによる審査リクエストを403で拒絶すること', async () => {
      vi.mocked(supabaseServerModule.getServiceSupabase).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'UNAUTHORIZED_HOST' },
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/study/respond-song-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: 'room_1',
          hostId: 'attacker_user',
          hostToken: 'fake_token',
          requestId: 'req_1',
          action: 'approve',
        }),
      })
      const res = await respondSongRequestPost(request)
      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.error).toBe('ホスト権限の認証に失敗しました')
    })

    it('ホストによる承認リクエストでキューに追加され200を返すこと', async () => {
      vi.mocked(supabaseServerModule.getServiceSupabase).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({
          data: {
            success: true,
            song_requests: [],
            queue: ['omoide:track1'],
          },
          error: null,
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/study/respond-song-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: 'room_1',
          hostId: 'host_1',
          hostToken: 'valid_token',
          requestId: 'req_1',
          action: 'approve',
        }),
      })
      const res = await respondSongRequestPost(request)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.queue).toContain('omoide:track1')
    })
  })
})
