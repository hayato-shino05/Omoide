import type { ThemeName } from '@/types'

export type PlaybackState = 'playing' | 'paused' | 'stopped'
export type FocusStatus = 'focusing' | 'short_break' | 'long_break' | 'idle'
export type CheerType = 'coffee' | 'fire' | 'sparkle' | 'book'
export type RoomRepeatMode = 'off' | 'all' | 'one'

export interface SongRequest {
  id: string
  track_id: string
  track_name: string
  artist_name: string
  album_image?: string | null
  requested_by_id: string
  requested_by_name: string
  created_at: string
}

export interface StudyRoom {
  id: string
  name: string
  description?: string | null
  host_id: string
  current_track_id?: string | null
  epoch_started_at?: string
  playback_state: PlaybackState
  theme_override?: ThemeName | null
  is_private: boolean
  passcode?: string | null
  max_members: number
  queue?: string[]
  current_track_index?: number
  is_shuffle?: boolean
  repeat_mode?: RoomRepeatMode
  song_requests?: SongRequest[]
  created_at: string
  updated_at: string
  study_room_members?: Array<{
    id: string
    display_name: string
    avatar_url?: string | null
    focus_status?: FocusStatus
    last_heartbeat_at?: string
  }>
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
  queue?: string[]
  current_track_index?: number
  is_shuffle?: boolean
  repeat_mode?: RoomRepeatMode
  triggered_by?: string
  signature?: string
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

export interface PomodoroDurations {
  focus: number
  short_break: number
  long_break: number
}

export interface PomodoroPreset {
  id: string
  nameKey: TranslationKey
  defaultName: string
  focus: number
  short_break: number
  long_break: number
}

export const DEFAULT_POMODORO_DURATIONS: PomodoroDurations = {
  focus: 25,
  short_break: 5,
  long_break: 15,
}

export const POMODORO_PRESETS: PomodoroPreset[] = [
  {
    id: 'classic',
    nameKey: 'studyPomodoroPresetClassic',
    defaultName: 'Classic (25 / 5 / 15m)',
    focus: 25,
    short_break: 5,
    long_break: 15,
  },
  {
    id: 'deep',
    nameKey: 'studyPomodoroPresetDeep',
    defaultName: 'Deep Work (50 / 10 / 20m)',
    focus: 50,
    short_break: 10,
    long_break: 20,
  },
  {
    id: 'sprint',
    nameKey: 'studyPomodoroPresetSprint',
    defaultName: 'Sprint (15 / 3 / 10m)',
    focus: 15,
    short_break: 3,
    long_break: 10,
  },
  {
    id: 'ultradian',
    nameKey: 'studyPomodoroPresetUltradian',
    defaultName: 'Ultradian (90 / 20 / 30m)',
    focus: 90,
    short_break: 20,
    long_break: 30,
  },
]

export interface PomodoroState {
  mode: PomodoroMode
  timeLeft: number
  isRunning: boolean
  completedCycles: number
  totalFocusMinutes: number
}
