'use client'

import { useEffect, useRef } from 'react'
import { useAmbientSoundStore } from '@/lib/stores/ambientSoundStore'
import { AMBIENT_SOUNDS } from '@/lib/audio/ambientSources'
import type { AmbientSoundType } from '@/types/study'

export function useAmbientAudio() {
  const { volumes, isPlaying, masterVolume } = useAmbientSoundStore()
  const audioElementsRef = useRef<Map<AmbientSoundType, HTMLAudioElement>>(new Map())

  useEffect(() => {
    // Khởi tạo audio elements nếu chưa có
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

  // Đồng bộ âm lượng và phát/dừng dựa trên store
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
            // Trình duyệt chặn autoplay khi chưa có tương tác người dùng
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
