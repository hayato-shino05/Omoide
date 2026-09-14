'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { JAPAN_PRESET_TRACKS } from '@/lib/music/presets'

export interface Track {
  id: string
  name: string
  url: string
  duration?: number
  category?: string
  reference?: string
  albumImage?: string
  artistName?: string
}

const DEFAULT_TRACKS: Track[] = JAPAN_PRESET_TRACKS.map((track) => ({
  id: track.id,
  name: track.name,
  url: track.audioUrl,
  duration: track.duration,
  category: track.artistName || 'Birthday',
  reference: track.reference,
  albumImage: track.albumImage,
  artistName: track.artistName,
}))

export interface UseMusicPlayerReturn {
  isPlaying: boolean
  currentTrack: Track | null
  currentTrackIndex: number
  volume: number
  tracks: Track[]
  currentTime: number
  duration: number
  isLoading: boolean
  playbackError: string | null
  play: () => void
  pause: () => void
  toggle: () => void
  setVolume: (volume: number) => void
  selectTrack: (trackId: string) => void
  nextTrack: () => void
  prevTrack: () => void
  seekTo: (time: number) => void
  addTrack: (track: Track) => void
  removeTrack: (trackId: string) => void
  autoPlayOnBirthday: (isBirthday: boolean) => void
  previewReference: (reference: string) => Promise<void>
  commitReference: (reference: string) => Promise<boolean>
  retry: () => void
}

const MusicPlayerContext = createContext<UseMusicPlayerReturn | undefined>(undefined)

function useMusicPlayerState(customTracks?: Track[]): UseMusicPlayerReturn {
  const [tracks, setTracks] = useState<Track[]>(customTracks || DEFAULT_TRACKS)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(0.5)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [playbackError, setPlaybackError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const volumeRef = useRef(volume)
  const isPlayingRef = useRef(isPlaying)
  const currentTrackRef = useRef<Track | null>(null)
  const tracksRef = useRef(tracks)
  const audioModeRef = useRef<'track' | 'preview'>('track')
  const previewAbortRef = useRef<AbortController | null>(null)
  const previewReferenceRef = useRef<string | null>(null)
  const previewRequestRef = useRef(0)
  const sourceGenerationRef = useRef(0)
  const playbackRequestRef = useRef(0)

  const currentTrack = tracks[currentTrackIndex] || null

  useEffect(() => {
    volumeRef.current = volume
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  useEffect(() => {
    tracksRef.current = tracks
  }, [tracks])

  useEffect(() => {
    currentTrackRef.current = currentTrack
  }, [currentTrack])

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const audio = new Audio()
    audio.volume = volumeRef.current
    audioRef.current = audio

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime || 0)
    const handleLoadedMetadata = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
      setIsLoading(false)
    }
    const handleLoadStart = () => {
      setIsLoading(true)
      setCurrentTime(0)
      setDuration(0)
    }
    const handleCanPlay = () => setIsLoading(false)
    const handleEnded = () => {
      if (audioModeRef.current === 'preview') {
        sourceGenerationRef.current += 1
        playbackRequestRef.current += 1
        audioModeRef.current = 'track'
        previewReferenceRef.current = null
        if (currentTrackRef.current) {
          audio.src = currentTrackRef.current.url
          audio.load()
        }
        setIsPlaying(false)
        return
      }
      const count = tracksRef.current.length
      if (count === 0) {
        setIsPlaying(false)
        return
      }
      setCurrentTrackIndex((index) => (index + 1) % count)
    }
    const handleError = () => {
      setIsPlaying(false)
      setIsLoading(false)
      setPlaybackError('Unable to play this track.')
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      previewAbortRef.current?.abort()
      previewAbortRef.current = null
      audio.pause()
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.src = ''
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    const sourceGeneration = ++sourceGenerationRef.current
    const playbackRequest = ++playbackRequestRef.current
    if (!audio || !currentTrack) {
      if (audio) audio.pause()
      setIsPlaying(false)
      setIsLoading(false)
      return
    }

    audioModeRef.current = 'track'
    previewReferenceRef.current = null
    const wasPlaying = isPlayingRef.current
    audio.src = currentTrack.url
    audio.load()
    if (wasPlaying) {
      audio.play().then(() => {
        if (sourceGenerationRef.current !== sourceGeneration || playbackRequestRef.current !== playbackRequest || audioRef.current !== audio) return
        setIsPlaying(true)
        setIsLoading(false)
      }).catch(() => {
        if (sourceGenerationRef.current !== sourceGeneration || playbackRequestRef.current !== playbackRequest || audioRef.current !== audio) return
        setIsPlaying(false)
        setIsLoading(false)
        setPlaybackError('Unable to play this track.')
      })
    }
  }, [currentTrackIndex, currentTrack])

  const play = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return
    const sourceGeneration = sourceGenerationRef.current
    const playbackRequest = ++playbackRequestRef.current
    setPlaybackError(null)
    setIsLoading(true)
    audio.play().then(() => {
      if (sourceGenerationRef.current !== sourceGeneration || playbackRequestRef.current !== playbackRequest || audioRef.current !== audio) return
      setIsPlaying(true)
      setIsLoading(false)
    }).catch(() => {
      if (sourceGenerationRef.current !== sourceGeneration || playbackRequestRef.current !== playbackRequest || audioRef.current !== audio) return
      setIsPlaying(false)
      setIsLoading(false)
      setPlaybackError('Unable to play this track.')
    })
  }, [currentTrack])

  const pause = useCallback(() => {
    playbackRequestRef.current += 1
    previewAbortRef.current?.abort()
    previewAbortRef.current = null
    const audio = audioRef.current
    if (audioModeRef.current === 'preview' && audio && currentTrackRef.current) {
      sourceGenerationRef.current += 1
      audioModeRef.current = 'track'
      previewReferenceRef.current = null
      audio.src = currentTrackRef.current.url
      audio.load()
    }
    audio?.pause()
    setIsPlaying(false)
    setIsLoading(false)
  }, [])

  const toggle = useCallback(() => {
    if (isPlaying) pause()
    else play()
  }, [isPlaying, pause, play])

  const setVolume = useCallback((newVolume: number) => {
    const nextVolume = Math.min(1, Math.max(0, newVolume))
    setVolumeState(nextVolume)
    if (audioRef.current) audioRef.current.volume = nextVolume
  }, [])

  const selectTrack = useCallback((trackId: string) => {
    const index = tracksRef.current.findIndex((track) => track.id === trackId)
    if (index < 0) return
    if (index === currentTrackIndex) {
      play()
      return
    }
    setPlaybackError(null)
    setCurrentTrackIndex(index)
    setIsPlaying(true)
  }, [currentTrackIndex, play])

  const nextTrack = useCallback(() => {
    const count = tracksRef.current.length
    if (count === 0) return
    setPlaybackError(null)
    setCurrentTrackIndex((index) => (index + 1) % count)
  }, [])

  const prevTrack = useCallback(() => {
    const count = tracksRef.current.length
    if (count === 0) return
    setPlaybackError(null)
    setCurrentTrackIndex((index) => (index - 1 + count) % count)
  }, [])

  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio) return
    const nextTime = Math.max(0, Math.min(time, Number.isFinite(audio.duration) ? audio.duration : time))
    audio.currentTime = nextTime
    setCurrentTime(nextTime)
  }, [])

  const addTrack = useCallback((track: Track) => {
    setTracks((currentTracks) => {
      if (currentTracks.some((item) => item.id === track.id)) return currentTracks
      const nextTracks = [...currentTracks, track]
      setCurrentTrackIndex((index) => Math.min(Math.max(index, 0), nextTracks.length - 1))
      return nextTracks
    })
  }, [])

  const removeTrack = useCallback((trackId: string) => {
    setTracks((currentTracks) => {
      const removedIndex = currentTracks.findIndex((track) => track.id === trackId)
      if (removedIndex < 0) return currentTracks
      const nextTracks = currentTracks.filter((track) => track.id !== trackId)
      if (nextTracks.length === 0) {
        audioRef.current?.pause()
        playbackRequestRef.current += 1
        setIsPlaying(false)
        setCurrentTrackIndex(-1)
      } else {
        setCurrentTrackIndex((index) => {
          const adjustedIndex = index > removedIndex ? index - 1 : index
          return Math.min(Math.max(adjustedIndex, 0), nextTracks.length - 1)
        })
      }
      return nextTracks
    })
  }, [])

  const autoPlayOnBirthday = useCallback((isBirthday: boolean) => {
    if (isBirthday && !isPlayingRef.current) play()
  }, [play])

  const previewReference = useCallback(async (reference: string): Promise<void> => {
    const normalizedReference = reference.trim()
    if (!normalizedReference) return

    previewAbortRef.current?.abort()
    const requestId = ++previewRequestRef.current
    const sourceGeneration = ++sourceGenerationRef.current
    const controller = new AbortController()
    previewAbortRef.current = controller
    const timeoutId = window.setTimeout(() => controller.abort(), 8_000)
    const audio = audioRef.current

    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    audioModeRef.current = 'preview'
    previewReferenceRef.current = normalizedReference
    setIsPlaying(false)
    setPlaybackError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/music/resolve?ref=${encodeURIComponent(normalizedReference)}`, {
        signal: controller.signal,
      })
      const payload: unknown = await response.json().catch(() => null)
      const resolved = payload && typeof payload === 'object' && 'data' in payload
        ? payload.data
        : null
      if (
        !response.ok ||
        !resolved ||
        typeof resolved !== 'object' ||
        !('streamUrl' in resolved) ||
        typeof resolved.streamUrl !== 'string' ||
        !resolved.streamUrl.startsWith('https://')
      ) {
        throw new Error('Unable to resolve this preview.')
      }
      if (requestId !== previewRequestRef.current || sourceGenerationRef.current !== sourceGeneration || !audio) return

      const playbackRequest = ++playbackRequestRef.current
      audio.src = resolved.streamUrl
      audio.load()
      await audio.play()
      if (requestId !== previewRequestRef.current || sourceGenerationRef.current !== sourceGeneration || playbackRequestRef.current !== playbackRequest) {
        audio.pause()
        audio.currentTime = 0
        return
      }
      setIsPlaying(true)
      setIsLoading(false)
    } catch (error) {
      if (controller.signal.aborted || requestId !== previewRequestRef.current || sourceGenerationRef.current !== sourceGeneration) return
      audioModeRef.current = 'track'
      previewReferenceRef.current = null
      setIsPlaying(false)
      setIsLoading(false)
      setPlaybackError(error instanceof Error ? error.message : 'Unable to play this preview.')
    } finally {
      window.clearTimeout(timeoutId)
      if (previewAbortRef.current === controller) previewAbortRef.current = null
    }
  }, [])

  const commitReference = useCallback(async (reference: string): Promise<boolean> => {
    const normalizedReference = reference.trim()
    if (!normalizedReference) return false

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 8_000)
    setPlaybackError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/music/resolve?ref=${encodeURIComponent(normalizedReference)}`, {
        signal: controller.signal,
      })
      const payload: unknown = await response.json().catch(() => null)
      const resolved = payload && typeof payload === 'object' && 'data' in payload ? payload.data : null
      if (
        !response.ok ||
        !resolved ||
        typeof resolved !== 'object' ||
        !('trackId' in resolved) ||
        typeof resolved.trackId !== 'string' ||
        !('reference' in resolved) ||
        typeof resolved.reference !== 'string' ||
        !('name' in resolved) ||
        typeof resolved.name !== 'string' ||
        !('streamUrl' in resolved) ||
        typeof resolved.streamUrl !== 'string' ||
        !resolved.streamUrl.startsWith('https://')
      ) {
        throw new Error('Unable to load this track.')
      }

      const nextTrack: Track = {
        id: resolved.trackId,
        name: resolved.name,
        url: resolved.streamUrl,
        duration: 'duration' in resolved && typeof resolved.duration === 'number' ? resolved.duration : undefined,
        category: 'artistName' in resolved && typeof resolved.artistName === 'string' ? resolved.artistName : undefined,
        reference: resolved.reference,
        albumImage: 'albumImage' in resolved && typeof resolved.albumImage === 'string' ? resolved.albumImage : undefined,
        artistName: 'artistName' in resolved && typeof resolved.artistName === 'string' ? resolved.artistName : undefined,
      }

      setTracks((currentTracks) => {
        const existingIndex = currentTracks.findIndex((track) => track.reference === nextTrack.reference || track.id === nextTrack.id)
        if (existingIndex >= 0) {
          setCurrentTrackIndex(existingIndex)
          return currentTracks
        } else {
          setCurrentTrackIndex(currentTracks.length)
          return [...currentTracks, nextTrack]
        }
      })

      const audio = audioRef.current
      if (audio) {
        audioModeRef.current = 'track'
        previewReferenceRef.current = null
        audio.src = nextTrack.url
        audio.load()
        const sourceGeneration = ++sourceGenerationRef.current
        const playbackRequest = ++playbackRequestRef.current
        void audio.play().then(() => {
          if (sourceGenerationRef.current !== sourceGeneration || playbackRequestRef.current !== playbackRequest) return
          setIsPlaying(true)
          setIsLoading(false)
        }).catch(() => {
          if (sourceGenerationRef.current !== sourceGeneration || playbackRequestRef.current !== playbackRequest) return
          setIsPlaying(false)
          setIsLoading(false)
          setPlaybackError('Unable to play this track.')
        })
      } else {
        setIsPlaying(true)
      }
      return true
    } catch (error) {
      if (!controller.signal.aborted) {
        setPlaybackError(error instanceof Error ? error.message : 'Unable to load this track.')
      }
      return false
    } finally {
      window.clearTimeout(timeoutId)
      setIsLoading(false)
    }
  }, [])

  const retry = useCallback(() => {
    if (!currentTrack) return
    audioRef.current?.load()
    play()
  }, [currentTrack, play])

  return useMemo(() => ({
    isPlaying,
    currentTrack,
    currentTrackIndex,
    volume,
    tracks,
    currentTime,
    duration,
    isLoading,
    playbackError,
    play,
    pause,
    toggle,
    setVolume,
    selectTrack,
    nextTrack,
    prevTrack,
    seekTo,
    addTrack,
    removeTrack,
    autoPlayOnBirthday,
    previewReference,
    commitReference,
    retry,
  }), [isPlaying, currentTrack, currentTrackIndex, volume, tracks, currentTime, duration, isLoading, playbackError, play, pause, toggle, setVolume, selectTrack, nextTrack, prevTrack, seekTo, addTrack, removeTrack, autoPlayOnBirthday, previewReference, commitReference, retry])
}

export function MusicPlayerProvider({ children, customTracks }: { children: ReactNode; customTracks?: Track[] }) {
  const value = useMusicPlayerState(customTracks)
  return <MusicPlayerContext.Provider value={value}>{children}</MusicPlayerContext.Provider>
}

export function useMusicPlayer(_customTracks?: Track[]): UseMusicPlayerReturn {
  void _customTracks
  const context = useContext(MusicPlayerContext)
  if (!context) {
    throw new Error('useMusicPlayer must be used within MusicPlayerProvider')
  }
  return context
}
