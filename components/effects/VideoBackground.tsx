'use client'

import { useState, useRef, useEffect, useMemo, useSyncExternalStore } from 'react'
import { usePrefersReducedMotion } from '@/lib/hooks/useMediaQuery'

interface VideoBackgroundProps {
  videoUrl?: string
  youtubeId?: string
  fallbackUrl?: string
  active?: boolean
  opacity?: number
  syncToServerTime?: boolean
  videoDuration?: number
}

function computeStartSeconds(videoDuration: number): number {
  return Math.floor((Date.now() / 1000) % videoDuration)
}

export function VideoBackground({
  videoUrl,
  youtubeId,
  fallbackUrl,
  active = true,
  opacity = 0.6,
  syncToServerTime = true,
  videoDuration = 0,
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasError, setHasError] = useState(false)
  const [prevVideoUrl, setPrevVideoUrl] = useState(videoUrl)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const prefersReducedMotion = usePrefersReducedMotion()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  // videoUrl 変更時に error とロード状態をリセット
  if (videoUrl !== prevVideoUrl) {
    setPrevVideoUrl(videoUrl)
    setHasError(false)
    setVideoLoaded(false)
  }

  const currentSrc = hasError && fallbackUrl ? fallbackUrl : videoUrl

  // YouTube の開始位置を props の最新状態から導出
  const startSeconds = useMemo(() => {
    if (!mounted || !syncToServerTime || !videoDuration || videoDuration <= 0) return null
    return computeStartSeconds(videoDuration)
  }, [mounted, syncToServerTime, videoDuration])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !syncToServerTime) return

    const syncVideoPosition = () => {
      const duration = videoDuration > 0 ? videoDuration : video.duration

      if (duration && duration > 0 && !isNaN(duration)) {
        const now = Date.now() / 1000
        const position = now % duration

        video.currentTime = position
        video.play().catch(() => {})
      }
    }

    const handleLoadedMetadata = () => {
      syncVideoPosition()
    }

    const handleCanPlay = () => {
      if (!video.duration || isNaN(video.duration)) return
      syncVideoPosition()
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('canplay', handleCanPlay)

    if (video.readyState >= 1 && video.duration && !isNaN(video.duration)) {
      syncVideoPosition()
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('canplay', handleCanPlay)
    }
  }, [currentSrc, syncToServerTime, videoDuration])

  useEffect(() => {
    if (videoRef.current && videoLoaded && !syncToServerTime) {
      videoRef.current.play().catch(() => {})
    }
  }, [videoLoaded, syncToServerTime])

  const handleError = () => {
    setHasError(true)
  }

  if (!active) return null

  // reduced-motion 時は背景動画/YouTube を描画しない（親のグラデーションが代替）
  if (prefersReducedMotion) return null

  if (!mounted) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          background: 'linear-gradient(135deg, var(--theme-background) 0%, var(--theme-secondary) 50%, var(--theme-background) 100%)',
        }}
      />
    )
  }

  if (youtubeId) {
    const origin = window.location.origin

    let startParam = ''
    if (startSeconds !== null) {
      startParam = `&start=${startSeconds}`
    }

    return (
      <>
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1&playlist=${youtubeId}&origin=${origin}&disablekb=1&fs=0${startParam}`}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none',
              opacity: opacity,
              pointerEvents: 'none',
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      </>
    )
  }

  if (currentSrc) {
    return (
      <>
        <video
          ref={videoRef}
          key={currentSrc}
          src={currentSrc}
          autoPlay
          loop
          muted
          playsInline
          onError={handleError}
          onLoadedData={() => setVideoLoaded(true)}
          onCanPlay={() => setVideoLoaded(true)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
            opacity: opacity,
          }}
        >
          <source src={currentSrc} type="video/mp4" />
        </video>
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.05) 100%)',
            pointerEvents: 'none',
          }}
        />
      </>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        background: 'linear-gradient(135deg, var(--theme-background) 0%, var(--theme-secondary) 50%, var(--theme-background) 100%)',
      }}
    />
  )
}