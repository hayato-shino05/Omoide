import type { ThemeName } from '@/types'

export type PlaybackState = 'playing' | 'paused' | 'stopped'
export type FocusStatus = 'focusing' | 'short_break' | 'long_break' | 'idle'
export type CheerType = 'coffee' | 'fire' | 'sparkle' | 'book'

export interface StudyRoom {
  id: string
  name: string
  description?: string | null
  host_id: string
  current_track_id?: string | null
  epoch_started_at: string
  playback_state: PlaybackState
  theme_override?: ThemeName | null
  is_private: boolean
  passcode?: string | null
  max_members: number
  created_at: string
  updated_at: string
}

export interface StudyRoomMember {
  id: string
  room_id: string
  user_identifier: string
  display_name: string
  avatar_url?: string | null
  focus_status: FocusStatus
  current_streak_minutes: number
  joined_at: string
  last_heartbeat_at: string
}

export interface RoomPlaybackSyncPayload {
  track_id: string | null
  epoch_started_at: string
  playback_state: PlaybackState
  elapsed_seconds: number
}

export interface SilentCheerPayload {
  id: string
  sender_name: string
  cheer_type: CheerType
  timestamp: number
}

export type AmbientSoundType = 'rain' | 'cafe' | 'wind_chime' | 'fireplace'

import type { TranslationKey } from '@/lib/i18n/types'

export interface AmbientSoundConfig {
  id: AmbientSoundType
  nameKey: TranslationKey
  defaultName: string
  icon: string
  audioUrl: string
  defaultVolume: number
}

export type PomodoroMode = 'focus' | 'short_break' | 'long_break'

export interface PomodoroState {
  mode: PomodoroMode
  timeLeft: number
  isRunning: boolean
  completedCycles: number
  totalFocusMinutes: number
}
