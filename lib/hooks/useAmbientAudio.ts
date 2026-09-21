'use client'

import { useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useAmbientSoundStore } from '@/lib/stores/ambientSoundStore'
import { ambientEngine } from '@/lib/audio/ambientEngine'

export function useAmbientAudio() {
  const { volumes, isPlaying, masterVolume } = useAmbientSoundStore(
    useShallow((state) => ({
      volumes: state.volumes,
      isPlaying: state.isPlaying,
      masterVolume: state.masterVolume,
    }))
  )

  // ストアの状態に基づくWeb Audio環境音シンセサイザーのリアルタイム同期
  useEffect(() => {
    if (typeof window === 'undefined') return

    ambientEngine.update(volumes, isPlaying, masterVolume)
  }, [volumes, isPlaying, masterVolume])

  return {
    isPlaying,
    volumes,
    masterVolume,
  }
}

