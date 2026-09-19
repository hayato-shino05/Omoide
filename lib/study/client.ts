import { getSupabase } from '@/lib/supabase/client'
import type { StudyRoom, StudyRoomMember, PlaybackState, FocusStatus } from '@/types/study'

export async function fetchStudyRooms(): Promise<StudyRoom[]> {
  const supabase = getSupabase()
  // 直近2分以内にハートビートがある実際のアクティブメンバーのみを取得
  const activeThresholdMs = Date.now() - 2 * 60 * 1000

  // パスコード等の機密情報を除外した安全なカラムのみを取得
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
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('study_rooms')
    .insert({
      name: input.name,
      description: input.description || null,
      host_id: input.host_id,
      current_track_id: input.current_track_id || null,
      is_private: Boolean(input.is_private),
      passcode: input.passcode || null,
      theme_override: input.theme_override || null,
      playback_state: 'playing',
      epoch_started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error || !data) {
    console.error('[StudyRoom] Error creating room:', error)
    return null
  }
  return data as StudyRoom
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

  // サーバーサイドAPI経由でホスト権限を厳格に検証して更新（クライアント直接更新バイパスを排除）
  try {
    const res = await fetch('/api/study/playback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, hostId, payload }),
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
  // サーバーサイドAPI経由でパスコード検証および最大収容人数をアトミックに検証（クライアント直接挿入バイパスを排除）
  try {
    const res = await fetch('/api/study/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, member, passcode }),
    })
    if (res.ok) {
      const { data } = await res.json()
      if (data) return data as StudyRoomMember
    }
    return null
  } catch (err) {
    console.error('[StudyRoom] Error joining room via API:', err)
    return null
  }
}

export async function leaveStudyRoom(roomId: string, user_identifier: string): Promise<boolean> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('study_room_members')
    .delete()
    .eq('room_id', roomId)
    .eq('user_identifier', user_identifier)

  if (error) {
    console.error('[StudyRoom] Error leaving room:', error)
    return false
  }
  return true
}

export async function updateMemberStatus(
  roomId: string,
  user_identifier: string,
  focus_status: FocusStatus,
  current_streak_minutes: number
): Promise<boolean> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('study_room_members')
    .update({
      focus_status,
      current_streak_minutes,
      last_heartbeat_at: new Date().toISOString(),
    })
    .eq('room_id', roomId)
    .eq('user_identifier', user_identifier)

  if (error) {
    console.error('[StudyRoom] Error updating member status:', error)
    return false
  }
  return true
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
