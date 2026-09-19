import { getSupabase } from '@/lib/supabase/client'
import type { StudyRoom, StudyRoomMember, PlaybackState, FocusStatus } from '@/types/study'

export function getStoredHostToken(roomId: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(`omoide_host_token_${roomId}`)
  } catch {
    return null
  }
}

export function setStoredHostToken(roomId: string, token: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`omoide_host_token_${roomId}`, token)
  } catch {}
}

export function getStoredMemberToken(roomId: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(`omoide_member_token_${roomId}`)
  } catch {
    return null
  }
}

export function setStoredMemberToken(roomId: string, token: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`omoide_member_token_${roomId}`, token)
  } catch {}
}

export async function fetchStudyRooms(): Promise<StudyRoom[]> {
  const supabase = getSupabase()
  // 直近2分以内にハートビートがある実際のアクティブメンバーのみを取得
  const activeThresholdMs = Date.now() - 2 * 60 * 1000

  // パスコード・トークン等の機密情報を除外した安全な公開カラムのみを取得
  const { data, error } = await supabase
    .from('study_rooms')
    .select(
      'id, name, description, host_id, current_track_id, playback_state, theme_override, is_private, max_members, created_at, updated_at, study_room_members(id, display_name, avatar_url, focus_status, last_heartbeat_at)'
    )
    .order('updated_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('[StudyRoom] Error fetching rooms:', error)
    return []
  }

  // 取得したメンバーのうち、ハートビートが有効なメンバーのみにフィルタリング
  const rooms = ((data as StudyRoom[]) || []).map((room) => ({
    ...room,
    study_room_members: (room.study_room_members || []).filter(
      (m) => m.last_heartbeat_at && new Date(m.last_heartbeat_at).getTime() >= activeThresholdMs
    ),
  }))

  return rooms
}

export async function getStudyRoom(roomId: string): Promise<StudyRoom | null> {
  const supabase = getSupabase()
  // パスコード等の機密情報を除外した安全なカラムのみを取得
  const { data, error } = await supabase
    .from('study_rooms')
    .select(
      'id, name, description, host_id, current_track_id, playback_state, theme_override, is_private, max_members, created_at, updated_at, study_room_members(id, display_name, avatar_url, focus_status)'
    )
    .eq('id', roomId)
    .maybeSingle()

  if (error || !data) {
    console.error('[StudyRoom] Error getting room:', error)
    return null
  }
  return data as StudyRoom
}

/**
 * 非公開部屋のパスコードをサーバーサイドAPI経由で安全に検証する
 */
export async function verifyRoomPasscode(roomId: string, passcode: string): Promise<boolean> {
  try {
    const res = await fetch('/api/study/verify-passcode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomId, passcode }),
    })
    if (!res.ok) {
      return false
    }
    const data = await res.json()
    return Boolean(data?.valid)
  } catch (err) {
    console.error('[StudyRoom] Error verifying passcode:', err)
    return false
  }
}

export interface CreateStudyRoomInput {
  name: string
  description?: string
  host_id: string
  current_track_id?: string
  is_private?: boolean
  passcode?: string
  theme_override?: string
}

export async function createStudyRoom(input: CreateStudyRoomInput): Promise<StudyRoom | null> {
  try {
    const res = await fetch('/api/study/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    if (!res.ok) {
      return null
    }

    const payload = await res.json()
    if (payload?.data && payload?.hostToken) {
      setStoredHostToken(payload.data.id, payload.hostToken)
      return payload.data as StudyRoom
    }
    return null
  } catch (err) {
    console.error('[StudyRoom] Error creating room via API:', err)
    return null
  }
}

export async function updateStudyRoomPlayback(
  roomId: string,
  payload: {
    current_track_id?: string | null
    epoch_started_at?: string
    playback_state?: PlaybackState
  },
  hostId?: string
): Promise<boolean> {
  if (!hostId) {
    console.warn('[StudyRoom] Host ID is required to update playback')
    return false
  }

  const hostToken = getStoredHostToken(roomId)

  // サーバーサイドAPI経由でホスト権限を厳格に検証して更新（クライアント直接更新バイパスを排除）
  try {
    const res = await fetch('/api/study/playback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, hostId, hostToken, payload }),
    })
    if (res.ok) {
      const data = await res.json()
      return Boolean(data?.success)
    }
    return false
  } catch (err) {
    console.error('[StudyRoom] Error updating playback via API:', err)
    return false
  }
}

// 互換性のためのエイリアス
export const updateRoomPlayback = updateStudyRoomPlayback

export async function joinStudyRoom(
  roomId: string,
  member: {
    user_identifier: string
    display_name: string
    avatar_url?: string
  },
  passcode?: string
): Promise<StudyRoomMember | null> {
  const memberToken = getStoredMemberToken(roomId)

  // サーバーサイドAPI経由でパスコード検証・トークン照合・定員制限をアトミックに検証
  try {
    const res = await fetch('/api/study/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, member, passcode, memberToken }),
    })
    if (res.ok) {
      const payload = await res.json()
      if (payload?.data) {
        if (payload.memberToken) {
          setStoredMemberToken(roomId, payload.memberToken)
        }
        return payload.data as StudyRoomMember
      }
    }
    return null
  } catch (err) {
    console.error('[StudyRoom] Error joining room via API:', err)
    return null
  }
}

export async function leaveStudyRoom(roomId: string, user_identifier: string): Promise<boolean> {
  const memberToken = getStoredMemberToken(roomId)
  try {
    const res = await fetch('/api/study/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, userIdentifier: user_identifier, memberToken }),
    })
    return res.ok
  } catch (err) {
    console.error('[StudyRoom] Error leaving room via API:', err)
    return false
  }
}

export async function updateMemberStatus(
  roomId: string,
  user_identifier: string,
  focus_status: FocusStatus,
  current_streak_minutes: number
): Promise<boolean> {
  const memberToken = getStoredMemberToken(roomId)
  try {
    const res = await fetch('/api/study/member-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId,
        userIdentifier: user_identifier,
        memberToken,
        focusStatus: focus_status,
        streakMinutes: current_streak_minutes,
      }),
    })
    return res.ok
  } catch (err) {
    console.error('[StudyRoom] Error updating member status via API:', err)
    return false
  }
}

export async function fetchRoomMembers(roomId: string): Promise<StudyRoomMember[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('study_room_members')
    .select('*')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true })

  if (error) {
    console.error('[StudyRoom] Error fetching members:', error)
    return []
  }
  return (data as StudyRoomMember[]) || []
}
