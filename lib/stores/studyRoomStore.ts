'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StudyRoom, StudyRoomMember, SilentCheerPayload, CheerType, FocusStatus, RoomRepeatMode } from '@/types/study'
import type { SavedTrack } from '@/lib/stores/musicStore'

export interface StudyRoomStore {
  currentRoom: StudyRoom | null
  members: StudyRoomMember[]
  isSoloMode: boolean
  roomVolume: number
  cheers: SilentCheerPayload[]
  currentTrack: SavedTrack | null
  isHost: boolean
  userIdentifier: string
  displayName: string
  roomSessionStartedAt: number | null
  isAmbientMixerOpen: boolean
  personalGoal: string
  isGoalCompleted: boolean

  // 部屋全体のプレイリストキュー・シャッフル・リピート状態
  roomQueue: string[]
  roomTrackIndex: number
  isRoomShuffle: boolean
  roomRepeatMode: RoomRepeatMode

  // リアルタイム通信のアクションディスパッチャー
  changeRoomTrackAction: ((trackId: string) => Promise<void>) | null
  sendSilentCheerAction: ((cheerType: CheerType) => void) | null
  updatePresenceStatusAction: ((focusStatus: FocusStatus, streakMinutes: number) => Promise<void>) | null
  toggleRoomShuffleAction: (() => Promise<void>) | null
  cycleRoomRepeatModeAction: (() => Promise<void>) | null
  nextRoomTrackAction: (() => Promise<void>) | null
  prevRoomTrackAction: (() => Promise<void>) | null
  setRoomQueueAction: ((queue: string[], startIndex?: number) => Promise<void>) | null

  setRoom: (room: StudyRoom | null) => void
  setMembers: (members: StudyRoomMember[]) => void
  addMember: (member: StudyRoomMember) => void
  removeMember: (userIdentifier: string) => void
  updateMember: (userIdentifier: string, partial: Partial<StudyRoomMember>) => void
  setIsSoloMode: (isSoloMode: boolean) => void
  setRoomVolume: (volume: number) => void
  setCurrentTrack: (track: SavedTrack | null) => void
  setUserProfile: (userIdentifier: string, displayName: string) => void
  addCheer: (cheer: SilentCheerPayload) => void
  removeCheer: (cheerId: string) => void
  setAmbientMixerOpen: (isOpen: boolean) => void
  setPersonalGoal: (goal: string) => void
  toggleGoalCompleted: () => void
  setRoomPlaybackState: (state: {
    queue?: string[]
    currentTrackIndex?: number
    isShuffle?: boolean
    repeatMode?: RoomRepeatMode
  }) => void
  setRealtimeActions: (actions: {
    changeRoomTrack: (trackId: string) => Promise<void>
    sendSilentCheer: (cheerType: CheerType) => void
    updatePresenceStatus: (focusStatus: FocusStatus, streakMinutes: number) => Promise<void>
    toggleRoomShuffle: () => Promise<void>
    cycleRoomRepeatMode: () => Promise<void>
    nextRoomTrack: () => Promise<void>
    prevRoomTrack: () => Promise<void>
    setRoomQueue: (queue: string[], startIndex?: number) => Promise<void>
  } | null) => void
  resetRoom: () => void
}

export const useStudyRoomStore = create<StudyRoomStore>()(
  persist(
    (set, get) => ({
      currentRoom: null,
      members: [],
      isSoloMode: false,
      roomVolume: 0.6,
      cheers: [],
      currentTrack: null,
      isHost: false,
      userIdentifier: '',
      displayName: 'Guest',
      roomSessionStartedAt: null,
      isAmbientMixerOpen: false,
      personalGoal: '',
      isGoalCompleted: false,

      roomQueue: [],
      roomTrackIndex: 0,
      isRoomShuffle: false,
      roomRepeatMode: 'all',

      changeRoomTrackAction: null,
      sendSilentCheerAction: null,
      updatePresenceStatusAction: null,
      toggleRoomShuffleAction: null,
      cycleRoomRepeatModeAction: null,
      nextRoomTrackAction: null,
      prevRoomTrackAction: null,
      setRoomQueueAction: null,

      setRoom: (room) => {
        const userId = get().userIdentifier
        set({
          currentRoom: room,
          isHost: Boolean(room && userId && room.host_id === userId),
          roomSessionStartedAt: room ? get().roomSessionStartedAt || Date.now() : null,
          roomQueue: room?.current_track_id ? [room.current_track_id] : get().roomQueue,
        })
      },

      setMembers: (members) => set({ members }),

      addMember: (member) =>
        set((state) => {
          const exists = state.members.some((m) => m.user_identifier === member.user_identifier)
          if (exists) {
            return {
              members: state.members.map((m) =>
                m.user_identifier === member.user_identifier ? { ...m, ...member } : m
              ),
            }
          }
          return { members: [...state.members, member] }
        }),

      removeMember: (userIdentifier) =>
        set((state) => ({
          members: state.members.filter((m) => m.user_identifier !== userIdentifier),
        })),

      updateMember: (userIdentifier, partial) =>
        set((state) => ({
          members: state.members.map((m) =>
            m.user_identifier === userIdentifier ? { ...m, ...partial } : m
          ),
        })),

      setIsSoloMode: (isSoloMode) => set({ isSoloMode }),

      setRoomVolume: (roomVolume) => set({ roomVolume: Math.max(0, Math.min(1, roomVolume)) }),

      setCurrentTrack: (currentTrack) => set({ currentTrack }),

      setUserProfile: (userIdentifier, displayName) => {
        const room = get().currentRoom
        set({
          userIdentifier,
          displayName,
          isHost: Boolean(room && room.host_id === userIdentifier),
        })
      },

      addCheer: (cheer) =>
        set((state) => ({
          cheers: state.cheers.slice(-14).concat(cheer), // 最大15件の最新リアクションを保持
        })),

      removeCheer: (cheerId) =>
        set((state) => ({
          cheers: state.cheers.filter((c) => c.id !== cheerId),
        })),

      setAmbientMixerOpen: (isAmbientMixerOpen) => set({ isAmbientMixerOpen }),

      setPersonalGoal: (personalGoal) => set({ personalGoal, isGoalCompleted: false }),

      toggleGoalCompleted: () => set((state) => ({ isGoalCompleted: !state.isGoalCompleted })),

      setRoomPlaybackState: (playbackState) =>
        set((state) => ({
          roomQueue: playbackState.queue !== undefined ? playbackState.queue : state.roomQueue,
          roomTrackIndex:
            playbackState.currentTrackIndex !== undefined
              ? playbackState.currentTrackIndex
              : state.roomTrackIndex,
          isRoomShuffle:
            playbackState.isShuffle !== undefined ? playbackState.isShuffle : state.isRoomShuffle,
          roomRepeatMode:
            playbackState.repeatMode !== undefined ? playbackState.repeatMode : state.roomRepeatMode,
        })),

      setRealtimeActions: (actions) =>
        set({
          changeRoomTrackAction: actions?.changeRoomTrack ?? null,
          sendSilentCheerAction: actions?.sendSilentCheer ?? null,
          updatePresenceStatusAction: actions?.updatePresenceStatus ?? null,
          toggleRoomShuffleAction: actions?.toggleRoomShuffle ?? null,
          cycleRoomRepeatModeAction: actions?.cycleRoomRepeatMode ?? null,
          nextRoomTrackAction: actions?.nextRoomTrack ?? null,
          prevRoomTrackAction: actions?.prevRoomTrack ?? null,
          setRoomQueueAction: actions?.setRoomQueue ?? null,
        }),

      resetRoom: () =>
        set({
          currentRoom: null,
          members: [],
          isSoloMode: false,
          cheers: [],
          currentTrack: null,
          isHost: false,
          roomSessionStartedAt: null,
          isAmbientMixerOpen: false,
          personalGoal: '',
          isGoalCompleted: false,
          roomQueue: [],
          roomTrackIndex: 0,
          isRoomShuffle: false,
          roomRepeatMode: 'all',
          changeRoomTrackAction: null,
          sendSilentCheerAction: null,
          updatePresenceStatusAction: null,
          toggleRoomShuffleAction: null,
          cycleRoomRepeatModeAction: null,
          nextRoomTrackAction: null,
          prevRoomTrackAction: null,
          setRoomQueueAction: null,
        }),
    }),
    {
      name: 'omoide_study_room_session',
      partialize: (state) => ({
        currentRoom: state.currentRoom,
        roomSessionStartedAt: state.roomSessionStartedAt,
        userIdentifier: state.userIdentifier,
        displayName: state.displayName,
        isSoloMode: state.isSoloMode,
        roomVolume: state.roomVolume,
        isRoomShuffle: state.isRoomShuffle,
        roomRepeatMode: state.roomRepeatMode,
      }),
    }
  )
)
