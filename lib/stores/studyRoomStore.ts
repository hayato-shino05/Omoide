'use client'

import { create } from 'zustand'
import type { StudyRoom, StudyRoomMember, SilentCheerPayload } from '@/types/study'
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
  resetRoom: () => void
}

export const useStudyRoomStore = create<StudyRoomStore>((set, get) => ({
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

  setRoom: (room) => {
    const userId = get().userIdentifier
    set({
      currentRoom: room,
      isHost: Boolean(room && userId && room.host_id === userId),
      roomSessionStartedAt: room ? get().roomSessionStartedAt || Date.now() : null,
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
      cheers: [...state.cheers.slice(-15), cheer], // 最大15件の最新リアクションを保持
    })),

  removeCheer: (cheerId) =>
    set((state) => ({
      cheers: state.cheers.filter((c) => c.id !== cheerId),
    })),

  setAmbientMixerOpen: (isAmbientMixerOpen) => set({ isAmbientMixerOpen }),

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
    }),
}))
