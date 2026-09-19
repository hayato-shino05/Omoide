'use client'

import { useEffect } from 'react'
import { useAmbientSoundStore } from '@/lib/stores/ambientSoundStore'
import { ambientEngine } from '@/lib/audio/ambientEngine'

export function useAmbientAudio() {
  const { volumes, isPlaying, masterVolume } = useAmbientSoundStore()

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

