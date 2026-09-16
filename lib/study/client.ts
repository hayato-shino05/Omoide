import { getSupabase } from '@/lib/supabase/client'
import type { StudyRoom, StudyRoomMember, PlaybackState, FocusStatus } from '@/types/study'

export async function fetchStudyRooms(): Promise<StudyRoom[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('study_rooms')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('[StudyRoom] Error fetching rooms:', error)
    return []
  }
  return (data as StudyRoom[]) || []
}

export async function getStudyRoom(roomId: string): Promise<StudyRoom | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('study_rooms')
    .select('*')
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
