'use client'

import { useState, useCallback, useEffect } from 'react'
import type { MediaFile } from '@/types'

interface UseSlideshowReturn {
  currentIndex: number
  isPlaying: boolean
  currentMedia: MediaFile | null
  play: () => void
  pause: () => void
  toggle: () => void
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  setInterval: (ms: number) => void
}

export function useSlideshow(
  media: MediaFile[],
  options: { autoPlay?: boolean; interval?: number } = {}
): UseSlideshowReturn {
  const { autoPlay = false, interval: initialInterval = 5000 } = options

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [interval, setIntervalState] = useState(initialInterval)

  const next = useCallback(() => {
    if (media.length === 0) return
    setCurrentIndex((prev) => (prev + 1) % media.length)
  }, [media.length])

  const prev = useCallback(() => {
    if (media.length === 0) return
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length)
  }, [media.length])

  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < media.length) {
        setCurrentIndex(index)
      }
    },
    [media.length]
  )

  const play = useCallback(() => setIsPlaying(true), [])
  const pause = useCallback(() => setIsPlaying(false), [])
  const toggle = useCallback(() => setIsPlaying((prev) => !prev), [])

  const setIntervalTime = useCallback((ms: number) => {
    setIntervalState(ms)
  }, [])

  // 自動再生タイマー
  useEffect(() => {
    if (!isPlaying || media.length === 0) return

    const timer = window.setInterval(next, interval)
    return () => window.clearInterval(timer)
  }, [isPlaying, interval, next, media.length])

  // メディアが変更されたらインデックスをリセット
  useEffect(() => {
    if (currentIndex >= media.length) {
      const raf = requestAnimationFrame(() => setCurrentIndex(0))
      return () => cancelAnimationFrame(raf)
    }
  }, [media.length, currentIndex])

  return {
    currentIndex,
    isPlaying,
    currentMedia: media[currentIndex] || null,
    play,
    pause,
    toggle,
    next,
    prev,
    goTo,
    setInterval: setIntervalTime,
  }
}
