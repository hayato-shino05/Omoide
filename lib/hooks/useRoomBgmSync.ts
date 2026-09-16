'use client'

import { useEffect, useRef, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { useStudyRoomStore } from '@/lib/stores/studyRoomStore'
import { JAPAN_PRESET_TRACKS } from '@/lib/music/presets'
import type { PlaybackState, CheerType, RoomPlaybackSyncPayload, SilentCheerPayload, StudyRoomMember } from '@/types/study'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useRoomBgmSync(roomId: string | null) {
  const {
    isSoloMode,
    roomVolume,
    userIdentifier,
    displayName,
    setMembers,
    addMember,
    removeMember,
    addCheer,
    setCurrentTrack,
    currentTrack,
  } = useStudyRoomStore()

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Khởi tạo Audio element
  useEffect(() => {
    if (typeof window === 'undefined') return
    const audio = new Audio()
    audio.preload = 'auto'
    audioRef.current = audio

    return () => {
      audio.pause()
      audio.src = ''
      audioRef.current = null
    }
  }, [])

  // Điều chỉnh âm lượng theo roomVolume và isSoloMode
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const effectiveVolume = isSoloMode ? 0 : roomVolume
    audio.volume = Math.max(0, Math.min(1, effectiveVolume))
  }, [isSoloMode, roomVolume])

  // Hàm resolve track URL từ trackId
  const resolveTrack = useCallback(async (trackId: string | null) => {
    if (!trackId) {
      setCurrentTrack(null)
      return null
    }

    // 1. Thử tìm trong preset
    const preset = JAPAN_PRESET_TRACKS.find((t) => t.id === trackId)
    if (preset) {
      const track = {
        id: preset.id,
        name: preset.name,
        url: preset.audioUrl,
        duration: preset.duration,
        artistName: preset.artistName,
        albumImage: preset.albumImage,
        lyricsLrc: preset.lyricsLrc,
      }
      setCurrentTrack(track)
      return track
    }

    // 2. Query Supabase public.music_tracks
    try {
      const supabase = getSupabase()
      const { data } = await supabase
        .from('music_tracks')
        .select('*')
        .eq('id', trackId)
        .maybeSingle()

      if (data) {
        const track = {
          id: data.id,
          name: data.title || data.name || 'Room BGM',
          url: data.audio_url || data.url,
          duration: data.duration,
          artistName: data.artist,
          albumImage: data.cover_url,
          lyricsLrc: data.lyrics_lrc,
        }
        setCurrentTrack(track)
        return track
      }
    } catch (e) {
      console.error('[RoomBgmSync] Failed to query track from DB:', e)
    }

    return null
  }, [setCurrentTrack])

  // Đồng bộ phát âm thanh theo epoch time
  const syncPlayback = useCallback((trackUrl: string, epochStartedAt: string, state: PlaybackState) => {
    const audio = audioRef.current
    if (!audio) return

    if (state === 'paused' || state === 'stopped') {
      if (!audio.paused) audio.pause()
      return
    }

    if (audio.src !== trackUrl) {
      audio.src = trackUrl
    }

    const elapsedSeconds = Math.max(0, (Date.now() - new Date(epochStartedAt).getTime()) / 1000)

    // Nếu track có duration và đã lặp lại chu kỳ
    const trackDuration = audio.duration || 0
    let targetTime = elapsedSeconds
    if (trackDuration > 0) {
      targetTime = elapsedSeconds % trackDuration
    }

    // Chỉ nhảy thời gian nếu lệch > 2 giây
    if (Math.abs(audio.currentTime - targetTime) > 2) {
      audio.currentTime = targetTime
    }

    if (audio.paused) {
      audio.play().catch(() => {
        // Autoplay blocked handling
      })
    }
  }, [])

  // Đăng ký Supabase Realtime Channel
  useEffect(() => {
    if (!roomId || typeof window === 'undefined') return

    const supabase = getSupabase()
    const channelName = `study_room:${roomId}`
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: false, self: false },
        presence: { key: userIdentifier || 'guest' },
      },
    })

    channelRef.current = channel

    // 1. Lắng nghe Broadcast PLAYBACK_SYNC
    channel.on('broadcast', { event: 'PLAYBACK_SYNC' }, async ({ payload }) => {
      const { track_id, epoch_started_at, playback_state } = payload as RoomPlaybackSyncPayload
      const track = await resolveTrack(track_id)
      if (track && track.url) {
        syncPlayback(track.url, epoch_started_at, playback_state)
      }
    })

    // 2. Lắng nghe Broadcast SILENT_CHEER
    channel.on('broadcast', { event: 'SILENT_CHEER' }, ({ payload }) => {
      addCheer(payload as SilentCheerPayload)
    })

    // 3. Quản lý Presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState<StudyRoomMember>()
        const activeMembers: StudyRoomMember[] = []
        Object.values(presenceState).forEach((presences) => {
          presences.forEach((p) => {
            if (p.user_identifier) {
              activeMembers.push(p)
            }
          })
        })
        if (activeMembers.length > 0) {
          setMembers(activeMembers)
        }
      })
      .on('presence', { event: 'join' }, ({ newPresences }: { newPresences: StudyRoomMember[] }) => {
        newPresences.forEach((p) => {
          if (p.user_identifier) addMember(p)
        })
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }: { leftPresences: StudyRoomMember[] }) => {
        leftPresences.forEach((p) => {
          if (p.user_identifier) removeMember(p.user_identifier)
        })
      })

    // Subscribe channel và track presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_identifier: userIdentifier,
          display_name: displayName,
          focus_status: 'focusing',
          current_streak_minutes: 0,
          joined_at: new Date().toISOString(),
        })
      }
    })

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [roomId, userIdentifier, displayName, resolveTrack, syncPlayback, addCheer, setMembers, addMember, removeMember])

  // Hàm phát nhạc phòng (chỉ Host)
  const changeRoomTrack = useCallback(async (trackId: string) => {
    if (!roomId) return
    const now = new Date().toISOString()
    const track = await resolveTrack(trackId)

    if (track && track.url) {
      syncPlayback(track.url, now, 'playing')
    }

    // Broadcast tới các thành viên
    const channel = channelRef.current
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'PLAYBACK_SYNC',
        payload: {
          track_id: trackId,
          epoch_started_at: now,
          playback_state: 'playing',
          elapsed_seconds: 0,
        } as RoomPlaybackSyncPayload,
      })
    }

    // Cập nhật DB
    const supabase = getSupabase()
    await supabase
      .from('study_rooms')
      .update({
        current_track_id: trackId,
        epoch_started_at: now,
        playback_state: 'playing',
        updated_at: now,
      })
      .eq('id', roomId)
  }, [roomId, resolveTrack, syncPlayback])

  // Hàm gửi Silent Cheer
  const sendSilentCheer = useCallback((cheerType: CheerType) => {
    const cheerPayload: SilentCheerPayload = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender_name: displayName || 'Anonymous',
      cheer_type: cheerType,
      timestamp: Date.now(),
    }

    // Thêm local
    addCheer(cheerPayload)

    // Broadcast
    const channel = channelRef.current
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'SILENT_CHEER',
        payload: cheerPayload,
      })
    }
  }, [displayName, addCheer])

  return {
    currentTrack,
    changeRoomTrack,
    sendSilentCheer,
  }
}
