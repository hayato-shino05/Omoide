'use client'

import { useEffect, useRef } from 'react'
import { useAmbientSoundStore } from '@/lib/stores/ambientSoundStore'
import { AMBIENT_SOUNDS } from '@/lib/audio/ambientSources'
import type { AmbientSoundType } from '@/types/study'

export function useAmbientAudio() {
  const { volumes, isPlaying, masterVolume } = useAmbientSoundStore()
  const audioElementsRef = useRef<Map<AmbientSoundType, HTMLAudioElement>>(new Map())

  useEffect(() => {
    // 未生成の環境音Audioインスタンスを生成
    if (typeof window === 'undefined') return

    const audioMap = audioElementsRef.current

    AMBIENT_SOUNDS.forEach((sound) => {
      if (!audioMap.has(sound.id)) {
        const audio = new Audio(sound.audioUrl)
        audio.loop = true
        audio.preload = 'none'
        audioMap.set(sound.id, audio)
      }
    })

    return () => {
      audioMap.forEach((audio) => {
        audio.pause()
        audio.src = ''
      })
      audioMap.clear()
    }
  }, [])

  // ストアの状態に基づく音量および再生・停止の同期
  useEffect(() => {
    if (typeof window === 'undefined') return

    const audioMap = audioElementsRef.current

    AMBIENT_SOUNDS.forEach((sound) => {
      const audio = audioMap.get(sound.id)
      if (!audio) return

      const soundVolume = volumes[sound.id] ?? 0
      const effectiveVolume = isPlaying ? soundVolume * masterVolume : 0
      audio.volume = Math.max(0, Math.min(1, effectiveVolume))

      if (isPlaying && soundVolume > 0) {
        if (audio.paused) {
          audio.play().catch(() => {
            // ブラウザの自動再生ブロックに対するフォールバック
          })
        }
      } else {
        if (!audio.paused) {
          audio.pause()
        }
      }
    })
  }, [volumes, isPlaying, masterVolume])

  return {
    isPlaying,
    volumes,
    masterVolume,
  }
}
