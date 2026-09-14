'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type MusicRepeatMode = 'off' | 'all' | 'one'

export interface SavedTrack {
  id: string
  name: string
  url: string
  duration?: number
  category?: string
  reference?: string
  albumImage?: string
  artistName?: string
  lyricsLrc?: string
}

export interface MusicPreferences {
  lastTrackId: string | null
  lastTrackReference: string | null
  savedTrack: SavedTrack | null
  savedTime: number
  volume: number
  isShuffle: boolean
  repeatMode: MusicRepeatMode
  setLastTrack: (track: SavedTrack | null) => void
  setSavedTime: (time: number) => void
  setVolume: (volume: number) => void
  setShuffle: (shuffle: boolean) => void
  setRepeatMode: (mode: MusicRepeatMode) => void
}

export const useMusicStore = create<MusicPreferences>()(
  persist(
    (set) => ({
      lastTrackId: null,
      lastTrackReference: null,
      savedTrack: null,
      savedTime: 0,
      volume: 0.5,
      isShuffle: false,
      repeatMode: 'all',

      setLastTrack: (track) =>
        set({
          lastTrackId: track?.id ?? null,
          lastTrackReference: track?.reference ?? null,
          savedTrack: track ?? null,
        }),
      setSavedTime: (time) => set({ savedTime: Math.max(0, time) }),
      setVolume: (volume) => set({ volume: Math.min(1, Math.max(0, volume)) }),
      setShuffle: (isShuffle) => set({ isShuffle }),
      setRepeatMode: (repeatMode) => set({ repeatMode }),
    }),
    {
      name: 'omoide_music_playback',
      partialize: (state) => ({
        lastTrackId: state.lastTrackId,
        lastTrackReference: state.lastTrackReference,
        savedTrack: state.savedTrack,
        savedTime: state.savedTime,
        volume: state.volume,
        isShuffle: state.isShuffle,
        repeatMode: state.repeatMode,
      }),
    }
  )
)
