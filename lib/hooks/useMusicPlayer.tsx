'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { JAPAN_PRESET_TRACKS } from '@/lib/music/presets'
import { useMusicStore } from '@/lib/stores/musicStore'

export interface Track {
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

export type RepeatMode = 'off' | 'all' | 'one'

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
  isShuffle: boolean
  repeatMode: RepeatMode
  play: () => void
  pause: () => void
  toggle: () => void
  setVolume: (volume: number) => void
  selectTrack: (trackId: string) => void
  nextTrack: () => void
  prevTrack: () => void
  seekTo: (time: number) => void
  toggleShuffle: () => void
  setShuffle: (shuffle: boolean) => void
  toggleRepeat: () => void
  setRepeatMode: (mode: RepeatMode) => void
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
  const [isShuffle, setIsShuffle] = useState(false)
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const volumeRef = useRef(volume)
  const isPlayingRef = useRef(isPlaying)
  const currentTrackRef = useRef<Track | null>(null)
  const tracksRef = useRef(tracks)
  const isShuffleRef = useRef(isShuffle)
  const repeatModeRef = useRef(repeatMode)
  const currentTrackIndexRef = useRef(currentTrackIndex)
  const audioModeRef = useRef<'track' | 'preview'>('track')
  const previewAbortRef = useRef<AbortController | null>(null)
  const previewReferenceRef = useRef<string | null>(null)
  const previewRequestRef = useRef(0)
  const sourceGenerationRef = useRef(0)
  const playbackRequestRef = useRef(0)
  const initialSeekTimeRef = useRef<number | null>(null)
  const lastSaveTimeRef = useRef(0)
  const isHydratedRef = useRef(false)
  // ユーザーが曲を明示的に選択・操作したかどうかのフラグ（初期マウント時の先行自動保存を防止）
  const userSelectedTrackRef = useRef(false)

  const currentTrack = tracks[currentTrackIndex] || null

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = useMusicStore.getState()
      if (typeof stored.volume === 'number' && Number.isFinite(stored.volume)) {
        setVolumeState(stored.volume)
        volumeRef.current = stored.volume
        if (audioRef.current) audioRef.current.volume = stored.volume
      }
      if (typeof stored.isShuffle === 'boolean') {
        setIsShuffle(stored.isShuffle)
      }
      if (stored.repeatMode === 'off' || stored.repeatMode === 'all' || stored.repeatMode === 'one') {
        setRepeatMode(stored.repeatMode)
      }
      if (stored.savedTrack) {
        // 過去のバグで先行自動保存された Jamendo プリセット曲はフォールバックとみなし、ユーザー明示選択と扱わない
        const isPresetFallback =
          Boolean(JAPAN_PRESET_TRACKS[0] && (
            (stored.savedTrack.reference && stored.savedTrack.reference === JAPAN_PRESET_TRACKS[0].reference) ||
            (stored.savedTrack.id && stored.savedTrack.id === JAPAN_PRESET_TRACKS[0].id)
          ))
        if (!isPresetFallback) {
          userSelectedTrackRef.current = true
          const foundIdx = tracksRef.current.findIndex(
            (t) => (stored.savedTrack!.id && t.id === stored.savedTrack!.id) || (stored.savedTrack!.reference && t.reference === stored.savedTrack!.reference)
          )
          if (foundIdx >= 0) {
            setCurrentTrackIndex(foundIdx)
          } else {
            setTracks([stored.savedTrack, ...tracksRef.current])
            setCurrentTrackIndex(0)
          }
        }
      } else if (stored.lastTrackId || stored.lastTrackReference) {
        const isPresetFallback =
          Boolean(JAPAN_PRESET_TRACKS[0] && (
            (stored.lastTrackReference && stored.lastTrackReference === JAPAN_PRESET_TRACKS[0].reference) ||
            (stored.lastTrackId && stored.lastTrackId === JAPAN_PRESET_TRACKS[0].id)
          ))
        if (!isPresetFallback) {
          userSelectedTrackRef.current = true
          const foundIdx = tracksRef.current.findIndex(
            (t) => (stored.lastTrackId && t.id === stored.lastTrackId) || (stored.lastTrackReference && t.reference === stored.lastTrackReference)
          )
          if (foundIdx >= 0) {
            setCurrentTrackIndex(foundIdx)
          }
        }
      }
      if (typeof stored.savedTime === 'number' && stored.savedTime > 0) {
        initialSeekTimeRef.current = stored.savedTime
        setCurrentTime(stored.savedTime)
      }
    } catch {
    } finally {
      isHydratedRef.current = true
    }
  }, [])

  useEffect(() => {
    let isCancelled = false
    fetch('/api/music/curated')
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { data?: Array<Record<string, unknown>> } | null) => {
        if (isCancelled || !payload || !Array.isArray(payload.data) || payload.data.length === 0) return
        const loadedTracks: Track[] = payload.data.map((item) => ({
          id: String(item.id),
          name: typeof item.name === 'string' ? item.name : 'Unknown',
          url: typeof item.audioUrl === 'string' ? item.audioUrl : typeof item.url === 'string' ? item.url : '',
          duration: typeof item.duration === 'number' ? item.duration : 0,
          category: typeof item.artistName === 'string' ? item.artistName : 'Omoide',
          reference: typeof item.reference === 'string' ? item.reference : undefined,
          albumImage: typeof item.albumImage === 'string' ? item.albumImage : undefined,
          artistName: typeof item.artistName === 'string' ? item.artistName : undefined,
          lyricsLrc: typeof item.lyricsLrc === 'string' ? item.lyricsLrc : undefined,
        })).filter((t) => t.url.length > 0)

        if (loadedTracks.length > 0) {
          try {
            const stored = useMusicStore.getState()
            let nextTracks = loadedTracks
            let targetIdx = 0
            if (userSelectedTrackRef.current && stored.savedTrack) {
              const inLoaded = loadedTracks.findIndex(
                (t) => (stored.savedTrack!.id && t.id === stored.savedTrack!.id) || (stored.savedTrack!.reference && t.reference === stored.savedTrack!.reference)
              )
              if (inLoaded >= 0) {
                targetIdx = inLoaded
              } else {
                nextTracks = [stored.savedTrack, ...loadedTracks]
                targetIdx = 0
              }
            } else if (userSelectedTrackRef.current && (stored.lastTrackId || stored.lastTrackReference)) {
              const inLoaded = loadedTracks.findIndex(
                (t) => (stored.lastTrackId && t.id === stored.lastTrackId) || (stored.lastTrackReference && t.reference === stored.lastTrackReference)
              )
              if (inLoaded >= 0) {
                targetIdx = inLoaded
              }
            } else {
              // ユーザーが過去に明示的に選択した曲が存在しない場合、Supabase の先頭曲を初期 currentTrack として採用
              targetIdx = 0
              nextTracks = loadedTracks
            }
            setTracks(nextTracks)
            setCurrentTrackIndex(targetIdx)
          } catch {
            setTracks(loadedTracks)
            setCurrentTrackIndex(0)
          }
        }
      })
      .catch(() => {})

    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    volumeRef.current = volume
    if (audioRef.current) audioRef.current.volume = volume
    try {
      useMusicStore.getState().setVolume(volume)
    } catch {
    }
  }, [volume])

  useEffect(() => {
    tracksRef.current = tracks
  }, [tracks])

  useEffect(() => {
    currentTrackRef.current = currentTrack
    // ユーザーが明示的に操作・選択した場合のみ localStorage (musicStore) に同期する
    if (isHydratedRef.current && currentTrack && audioModeRef.current === 'track' && userSelectedTrackRef.current) {
      try {
        useMusicStore.getState().setLastTrack(currentTrack)
      } catch {
      }
    }
  }, [currentTrack])

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  useEffect(() => {
    isShuffleRef.current = isShuffle
    try {
      useMusicStore.getState().setShuffle(isShuffle)
    } catch {
    }
  }, [isShuffle])

  useEffect(() => {
    repeatModeRef.current = repeatMode
    try {
      useMusicStore.getState().setRepeatMode(repeatMode)
    } catch {
    }
  }, [repeatMode])

  useEffect(() => {
    currentTrackIndexRef.current = currentTrackIndex
  }, [currentTrackIndex])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleUnload = () => {
      if (audioRef.current && audioModeRef.current === 'track') {
        try {
          useMusicStore.getState().setSavedTime(audioRef.current.currentTime || 0)
        } catch {
        }
      }
    }
    window.addEventListener('beforeunload', handleUnload)
    window.addEventListener('pagehide', handleUnload)
    return () => {
      window.removeEventListener('beforeunload', handleUnload)
      window.removeEventListener('pagehide', handleUnload)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const audio = new Audio()
    audio.volume = volumeRef.current
    audioRef.current = audio

    const handleTimeUpdate = () => {
      const t = audio.currentTime || 0
      setCurrentTime(t)
      const now = Date.now()
      if (audioModeRef.current === 'track' && now - lastSaveTimeRef.current > 1500) {
        lastSaveTimeRef.current = now
        try {
          useMusicStore.getState().setSavedTime(t)
        } catch {
        }
      }
    }
    const handleLoadedMetadata = () => {
      const audioDuration = Number.isFinite(audio.duration) ? audio.duration : 0
      setDuration(audioDuration)
      setIsLoading(false)
      if (initialSeekTimeRef.current !== null && initialSeekTimeRef.current > 0) {
        const target = Math.min(initialSeekTimeRef.current, audioDuration > 0 ? audioDuration - 0.5 : initialSeekTimeRef.current)
        audio.currentTime = target
        setCurrentTime(target)
        initialSeekTimeRef.current = null
      }
    }
    const handleLoadStart = () => {
      setIsLoading(true)
      if (initialSeekTimeRef.current === null) {
        setCurrentTime(0)
      }
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

      const currentRepeat = repeatModeRef.current
      if (currentRepeat === 'one') {
        audio.currentTime = 0
        void audio.play().catch(() => {})
        return
      }

      if (isShuffleRef.current && count > 1) {
        const offset = 1 + Math.floor(Math.random() * (count - 1))
        const nextIndex = (currentTrackIndexRef.current + offset) % count
        setCurrentTrackIndex(nextIndex)
        return
      }

      if (currentRepeat === 'off') {
        if (currentTrackIndexRef.current >= count - 1) {
          setIsPlaying(false)
          return
        }
        setCurrentTrackIndex((index) => index + 1)
      } else {
        setCurrentTrackIndex((index) => (index + 1) % count)
      }
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
    userSelectedTrackRef.current = true
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
    userSelectedTrackRef.current = true
    const count = tracksRef.current.length
    if (count === 0) return
    setPlaybackError(null)
    if (isShuffleRef.current && count > 1) {
      const offset = 1 + Math.floor(Math.random() * (count - 1))
      setCurrentTrackIndex((index) => (index + offset) % count)
    } else {
      setCurrentTrackIndex((index) => (index + 1) % count)
    }
  }, [])

  const prevTrack = useCallback(() => {
    userSelectedTrackRef.current = true
    const count = tracksRef.current.length
    if (count === 0) return
    setPlaybackError(null)
    if (isShuffleRef.current && count > 1) {
      const offset = 1 + Math.floor(Math.random() * (count - 1))
      setCurrentTrackIndex((index) => (index + offset) % count)
    } else {
      setCurrentTrackIndex((index) => (index - 1 + count) % count)
    }
  }, [])

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev)
  }, [])

  const setShuffle = useCallback((shuffle: boolean) => {
    setIsShuffle(shuffle)
  }, [])

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all'
      if (prev === 'all') return 'one'
      return 'off'
    })
  }, [])

  const setRepeatModeState = useCallback((mode: RepeatMode) => {
    setRepeatMode(mode)
  }, [])

  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio) return
    const nextTime = Math.max(0, Math.min(time, Number.isFinite(audio.duration) ? audio.duration : time))
    audio.currentTime = nextTime
    setCurrentTime(nextTime)
    if (audioModeRef.current === 'track') {
      try {
        useMusicStore.getState().setSavedTime(nextTime)
      } catch {
      }
    }
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

      userSelectedTrackRef.current = true
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
    isShuffle,
    repeatMode,
    play,
    pause,
    toggle,
    setVolume,
    selectTrack,
    nextTrack,
    prevTrack,
    seekTo,
    toggleShuffle,
    setShuffle,
    toggleRepeat,
    setRepeatMode: setRepeatModeState,
    addTrack,
    removeTrack,
    autoPlayOnBirthday,
    previewReference,
    commitReference,
    retry,
  }), [isPlaying, currentTrack, currentTrackIndex, volume, tracks, currentTime, duration, isLoading, playbackError, isShuffle, repeatMode, play, pause, toggle, setVolume, selectTrack, nextTrack, prevTrack, seekTo, toggleShuffle, setShuffle, toggleRepeat, setRepeatModeState, addTrack, removeTrack, autoPlayOnBirthday, previewReference, commitReference, retry])
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
