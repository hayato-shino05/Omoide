import { getSupabase } from '@/lib/supabase/client'
import type { StudyRoom, StudyRoomMember, PlaybackState, FocusStatus } from '@/types/study'

export async function fetchStudyRooms(): Promise<StudyRoom[]> {
  const supabase = getSupabase()
  // 直近2分以内にハートビートがある実際のアクティブメンバーのみを取得
  const activeThresholdMs = Date.now() - 2 * 60 * 1000

  const { data, error } = await supabase
    .from('study_rooms')
    .select('*, study_room_members(id, display_name, avatar_url, focus_status, last_heartbeat_at)')
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
  const { data, error } = await supabase
    .from('study_rooms')
    .select('*, study_room_members(id, display_name, avatar_url, focus_status)')
    .eq('id', roomId)
    .maybeSingle()

  if (error || !data) {
    console.error('[StudyRoom] Error getting room:', error)
    return null
  }
  return data as StudyRoom
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
  }
): Promise<boolean> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('study_rooms')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', roomId)

  if (error) {
    console.error('[StudyRoom] Error updating playback:', error)
    return false
  }
  return true
}

export async function joinStudyRoom(
  roomId: string,
  member: {
    user_identifier: string
    display_name: string
    avatar_url?: string
  }
): Promise<StudyRoomMember | null> {
  const supabase = getSupabase()

  // 部屋の最大収容人数を取得
  const { data: roomData, error: roomError } = await supabase
    .from('study_rooms')
    .select('max_members')
    .eq('id', roomId)
    .maybeSingle()

  if (roomError || !roomData) {
    console.error('[StudyRoom] Error fetching room capacity:', roomError)
    return null
  }

  const maxMembers = roomData.max_members || 20
  const activeThreshold = new Date(Date.now() - 2 * 60 * 1000).toISOString()

  // 既存メンバー一覧を取得し、アクティブ人数と既存所属状況を確認
  const { data: existingMembers, error: membersError } = await supabase
    .from('study_room_members')
    .select('user_identifier, last_heartbeat_at')
    .eq('room_id', roomId)

  if (membersError) {
    console.error('[StudyRoom] Error checking room members:', membersError)
    return null
  }

  const activeMembers = ((existingMembers as StudyRoomMember[]) || []).filter(
    (m: StudyRoomMember) => m.last_heartbeat_at && m.last_heartbeat_at >= activeThreshold
  )
  const isAlreadyMember = ((existingMembers as StudyRoomMember[]) || []).some(
    (m: StudyRoomMember) => m.user_identifier === member.user_identifier
  )

  // 満席かつ新規参加の場合は入室不可として処理を中断
  if (!isAlreadyMember && activeMembers.length >= maxMembers) {
    console.warn('[StudyRoom] Room is full:', roomId)
    return null
  }

  const { data, error } = await supabase
    .from('study_room_members')
    .upsert(
      {
        room_id: roomId,
        user_identifier: member.user_identifier,
        display_name: member.display_name,
        avatar_url: member.avatar_url || null,
        focus_status: 'focusing',
        last_heartbeat_at: new Date().toISOString(),
      },
      { onConflict: 'room_id,user_identifier' }
    )
    .select()
    .single()

  if (error || !data) {
    console.error('[StudyRoom] Error joining room:', error)
    return null
  }
  return data as StudyRoomMember
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
