'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AmbientSoundType } from '@/types/study'
import { AMBIENT_PRESETS } from '@/lib/audio/ambientSources'

export interface AmbientSoundStore {
  volumes: Record<AmbientSoundType, number>
  isPlaying: boolean
  masterVolume: number
  setVolume: (id: AmbientSoundType, volume: number) => void
  setMasterVolume: (volume: number) => void
  togglePlaying: () => void
  setIsPlaying: (playing: boolean) => void
  applyPreset: (presetId: string) => void
  muteAll: () => void
}

const initialVolumes: Record<AmbientSoundType, number> = {
  rain: 0,
  cafe: 0,
  wind_chime: 0,
  fireplace: 0,
}

export const useAmbientSoundStore = create<AmbientSoundStore>()(
  persist(
    (set) => ({
      volumes: initialVolumes,
      isPlaying: false,
      masterVolume: 0.7,

      setVolume: (id, volume) =>
        set((state) => {
          const nextVolume = Math.max(0, Math.min(1, volume))
          const nextVolumes = { ...state.volumes, [id]: nextVolume }
          const anyActive = Object.values(nextVolumes).some((v) => v > 0)
          return {
            volumes: nextVolumes,
            isPlaying: anyActive ? true : state.isPlaying,
          }
        }),

      setMasterVolume: (masterVolume) =>
        set({ masterVolume: Math.max(0, Math.min(1, masterVolume)) }),

      togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),

      setIsPlaying: (isPlaying) => set({ isPlaying }),

      applyPreset: (presetId) => {
        const preset = AMBIENT_PRESETS.find((p) => p.id === presetId)
        if (!preset) return
        set({
          volumes: { ...preset.volumes },
          isPlaying: true,
        })
      },

      muteAll: () =>
        set({
          volumes: { rain: 0, cafe: 0, wind_chime: 0, fireplace: 0 },
          isPlaying: false,
        }),
    }),
    {
      name: 'omoide_ambient_sounds',
      partialize: (state) => ({
        volumes: state.volumes,
        masterVolume: state.masterVolume,
      }),
    }
  )
)
