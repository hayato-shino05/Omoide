'use client'

import { useEffect, useRef, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { useStudyRoomStore } from '@/lib/stores/studyRoomStore'
import { JAPAN_PRESET_TRACKS } from '@/lib/music/presets'
import { updateMemberStatus, leaveStudyRoom, updateStudyRoomPlayback } from '@/lib/study/client'
import type {
  PlaybackState,
  CheerType,
  SilentCheerPayload,
  StudyRoomMember,
  RoomRepeatMode,
} from '@/types/study'
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
    setRoomPlaybackState,
    setRealtimeActions,
  } = useStudyRoomStore()

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Audioインスタンスの生成
  useEffect(() => {
    if (typeof window === 'undefined') return
    const audio = new Audio()
    audio.preload = 'auto'
    audio.loop = false
    audioRef.current = audio

    return () => {
      audio.pause()
      audio.src = ''
      audioRef.current = null
    }
  }, [])

  // 音量およびソロモード設定の同期
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const effectiveVolume = isSoloMode ? 0 : roomVolume
    audio.volume = Math.max(0, Math.min(1, effectiveVolume))
  }, [isSoloMode, roomVolume])

  // 部屋から退出した際（roomId === null）の完全停止・オーディオリセット
  useEffect(() => {
    if (!roomId) {
      const audio = audioRef.current
      if (audio) {
        audio.pause()
        audio.src = ''
      }
      setCurrentTrack(null)
    }
  }, [roomId, setCurrentTrack])

  // trackIdから楽曲情報を解決するヘルパー関数
  const resolveTrack = useCallback(async (trackId: string | null) => {
    if (!trackId) {
      setCurrentTrack(null)
      return null
    }

    const cleanId = trackId.includes(':') ? trackId.split(':')[1] : trackId

    // 1. プリセット音源から検索
    const preset = JAPAN_PRESET_TRACKS.find(
      (t) =>
        t.id === cleanId ||
        t.id === trackId ||
        t.reference === trackId ||
        (t.trackId === cleanId && t.provider === 'jamendo')
    )
    if (preset) {
      const track = {
        id: preset.id || trackId,
        reference: preset.reference || trackId,
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

    // 2. 外部配信サービス（Jamendo, SoundCloud 等）または URL の場合: /api/music/resolve を呼び出し
    if (
      trackId.startsWith('jamendo:') ||
      trackId.startsWith('soundcloud:') ||
      trackId.startsWith('http://') ||
      trackId.startsWith('https://')
    ) {
      try {
        const res = await fetch(`/api/music/resolve?ref=${encodeURIComponent(trackId)}`)
        if (res.ok) {
          const payload = await res.json()
          const data = payload?.data
          const streamUrl = data?.streamUrl || data?.audioUrl || data?.url
          if (data && streamUrl) {
            const track = {
              id: trackId,
              reference: trackId,
              name: data.name || data.title || 'Room BGM',
              url: streamUrl,
              duration: data.duration,
              artistName: data.artistName || data.artist,
              albumImage: data.albumImage || data.cover_url,
              lyricsLrc: data.lyricsLrc || data.lyrics_lrc,
            }
            setCurrentTrack(track)
            return track
          }
        }
      } catch (e) {
        console.error('[RoomBgmSync] Failed to resolve external track via API:', e)
      }

      // 直接アクセス可能な HTTP(S) URL の場合のフォールバック
      if (trackId.startsWith('http://') || trackId.startsWith('https://')) {
        const track = {
          id: trackId,
          reference: trackId,
          name: 'Room BGM',
          url: trackId,
          duration: 0,
        }
        setCurrentTrack(track)
        return track
      }
    }

    // 3. Omoide楽曲（omoide:ID または 単一ID）: Supabase music_tracks テーブルから取得
    try {
      const supabase = getSupabase()
      const queryId = trackId.startsWith('omoide:') ? trackId.replace('omoide:', '') : cleanId
      const { data } = await supabase
        .from('music_tracks')
        .select('*')
        .eq('id', queryId)
        .maybeSingle()

      if (data) {
        const track = {
          id: data.id,
          reference: `omoide:${data.id}`,
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

  // タイムスタンプ基準での再生位置同期
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

    // ループ計算
    const trackDuration = audio.duration || 0
    let targetTime = elapsedSeconds
    if (trackDuration > 0) {
      targetTime = elapsedSeconds % trackDuration
    }

    // 2秒以上のズレがある場合のみシーク
    if (Math.abs(audio.currentTime - targetTime) > 2) {
      audio.currentTime = targetTime
    }

    if (audio.paused) {
      audio.play().catch(() => {
        // オートプレイ制限のハンドリング
      })
    }
  }, [])

  // 再生状態およびキューの変更を部屋全体にブロードキャスト（ホスト専用）
  const broadcastPlayback = useCallback(
    async (
      trackId: string | null,
      options?: {
        queue?: string[]
        currentTrackIndex?: number
        isShuffle?: boolean
        repeatMode?: RoomRepeatMode
        playbackState?: PlaybackState
      }
    ) => {
      if (!roomId) return
      const storeState = useStudyRoomStore.getState()
      const { isHost, currentRoom, userIdentifier } = storeState
      // ホスト権限ガード: ホスト以外による部屋全体の再生状態変更を抑止
      if (!isHost && currentRoom?.host_id !== userIdentifier) return

      const now = new Date().toISOString()
      const state = options?.playbackState || 'playing'

      const activeQueue = options?.queue ?? storeState.roomQueue
      const activeIndex = options?.currentTrackIndex ?? storeState.roomTrackIndex
      const activeShuffle = options?.isShuffle ?? storeState.isRoomShuffle
      const activeRepeat = options?.repeatMode ?? storeState.roomRepeatMode

      // ローカルストア状態を先行更新
      setRoomPlaybackState({
        queue: activeQueue,
        currentTrackIndex: activeIndex,
        isShuffle: activeShuffle,
        repeatMode: activeRepeat,
      })

      if (trackId) {
        const track = await resolveTrack(trackId)
        if (track && track.url) {
          syncPlayback(track.url, now, state)
        }
      }

      // DB永続化（サーバーサイドAPI経由でホスト権限とトークンを検証して更新）
      if (trackId) {
        const hostId = currentRoom?.host_id || userIdentifier
        const result = await updateStudyRoomPlayback(
          roomId,
          {
            current_track_id: trackId,
            epoch_started_at: now,
            playback_state: state,
          },
          hostId
        )
        if (!result.success) {
          return
        }
      }
    },
    [roomId, resolveTrack, syncPlayback, setRoomPlaybackState]
  )

  // キュー・シャッフル・リピート設定に基づく次の曲への自動遷移（ホスト専用）
  const nextRoomTrack = useCallback(async () => {
    const { roomQueue, roomTrackIndex, isRoomShuffle, roomRepeatMode, isHost, currentRoom, userIdentifier } =
      useStudyRoomStore.getState()
    if (!isHost && currentRoom?.host_id !== userIdentifier) return
    if (roomQueue.length === 0) return

    let nextIndex = (roomTrackIndex + 1) % roomQueue.length

    if (isRoomShuffle && roomQueue.length > 1) {
      const offset = 1 + Math.floor(Math.random() * (roomQueue.length - 1))
      nextIndex = (roomTrackIndex + offset) % roomQueue.length
    } else if (roomRepeatMode === 'off' && roomTrackIndex >= roomQueue.length - 1) {
      // リピートOFFかつ末尾到達時は再生停止
      await broadcastPlayback(roomQueue[roomTrackIndex], {
        currentTrackIndex: roomTrackIndex,
        playbackState: 'paused',
      })
      return
    }

    const nextTrackId = roomQueue[nextIndex]
    await broadcastPlayback(nextTrackId, {
      currentTrackIndex: nextIndex,
      playbackState: 'playing',
    })
  }, [broadcastPlayback])

  // 前の曲へスキップ（ホスト専用）
  const prevRoomTrack = useCallback(async () => {
    const { isHost, currentRoom, userIdentifier } = useStudyRoomStore.getState()
    if (!isHost && currentRoom?.host_id !== userIdentifier) return

    const audio = audioRef.current
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0
      return
    }

    const { roomQueue, roomTrackIndex, isRoomShuffle } = useStudyRoomStore.getState()
    if (roomQueue.length === 0) return

    let prevIndex = (roomTrackIndex - 1 + roomQueue.length) % roomQueue.length
    if (isRoomShuffle && roomQueue.length > 1) {
      const offset = 1 + Math.floor(Math.random() * (roomQueue.length - 1))
      prevIndex = (roomTrackIndex + offset) % roomQueue.length
    }

    const prevTrackId = roomQueue[prevIndex]
    await broadcastPlayback(prevTrackId, {
      currentTrackIndex: prevIndex,
      playbackState: 'playing',
    })
  }, [broadcastPlayback])

  // シャッフル切り替え（ホスト専用）
  const toggleRoomShuffle = useCallback(async () => {
    const { isRoomShuffle, currentTrack, roomQueue, roomTrackIndex, roomRepeatMode, isHost, currentRoom, userIdentifier } =
      useStudyRoomStore.getState()
    if (!isHost && currentRoom?.host_id !== userIdentifier) return
    const newShuffle = !isRoomShuffle

    await broadcastPlayback(currentTrack?.id || roomQueue[roomTrackIndex] || null, {
      isShuffle: newShuffle,
      queue: roomQueue,
      currentTrackIndex: roomTrackIndex,
      repeatMode: roomRepeatMode,
    })
  }, [broadcastPlayback])

  // リピートモード切り替え ('off' -> 'all' -> 'one' -> 'off')（ホスト専用）
  const cycleRoomRepeatMode = useCallback(async () => {
    const { roomRepeatMode, currentTrack, roomQueue, roomTrackIndex, isRoomShuffle, isHost, currentRoom, userIdentifier } =
      useStudyRoomStore.getState()
    if (!isHost && currentRoom?.host_id !== userIdentifier) return
    const nextRepeat: RoomRepeatMode =
      roomRepeatMode === 'off' ? 'all' : roomRepeatMode === 'all' ? 'one' : 'off'

    await broadcastPlayback(currentTrack?.id || roomQueue[roomTrackIndex] || null, {
      repeatMode: nextRepeat,
      queue: roomQueue,
      currentTrackIndex: roomTrackIndex,
      isShuffle: isRoomShuffle,
    })
  }, [broadcastPlayback])

  // 部屋全体の再生キュー一括更新（ホスト専用）
  const setRoomQueue = useCallback(
    async (newQueue: string[], startIndex = 0) => {
      const { isHost, currentRoom, userIdentifier } = useStudyRoomStore.getState()
      if (!isHost && currentRoom?.host_id !== userIdentifier) return
      if (newQueue.length === 0) return
      const targetIndex = Math.max(0, Math.min(newQueue.length - 1, startIndex))
      const targetTrackId = newQueue[targetIndex]

      await broadcastPlayback(targetTrackId, {
        queue: newQueue,
        currentTrackIndex: targetIndex,
        playbackState: 'playing',
      })
    },
    [broadcastPlayback]
  )

  // 楽曲変更処理（ホスト専用）
  const changeRoomTrack = useCallback(
    async (trackId: string) => {
      const { roomQueue, isHost, currentRoom, userIdentifier } = useStudyRoomStore.getState()
      if (!isHost && currentRoom?.host_id !== userIdentifier) return

      let updatedQueue = [...roomQueue]
      let targetIndex = updatedQueue.indexOf(trackId)

      if (targetIndex === -1) {
        updatedQueue = [trackId, ...updatedQueue]
        targetIndex = 0
      }

      await broadcastPlayback(trackId, {
        queue: updatedQueue,
        currentTrackIndex: targetIndex,
        playbackState: 'playing',
      })
    },
    [broadcastPlayback]
  )

  // 再生・一時停止の明示的な切り替え（ホスト専用）
  const updatePlaybackState = useCallback(
    async (playbackState: PlaybackState) => {
      const { currentTrack, roomQueue, roomTrackIndex, isHost, currentRoom, userIdentifier } =
        useStudyRoomStore.getState()
      if (!isHost && currentRoom?.host_id !== userIdentifier) return
      const targetTrackId = currentTrack?.id || roomQueue[roomTrackIndex] || null
      await broadcastPlayback(targetTrackId, { playbackState })
    },
    [broadcastPlayback]
  )

  // 楽曲再生終了時の自動遷移イベントリスナー
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleEnded = () => {
      const { roomRepeatMode, currentTrack, currentRoom, userIdentifier, isHost } = useStudyRoomStore.getState()
      if (roomRepeatMode === 'one' && currentTrack) {
        audio.currentTime = 0
        audio.play().catch(() => {})
      } else {
        // ホストのみが次の曲への自動遷移をトリガー（複数リスナーによる同時ランダム選曲の競合を防止）
        const isUserHost = isHost || Boolean(currentRoom && userIdentifier && currentRoom.host_id === userIdentifier)
        if (isUserHost) {
          nextRoomTrack()
        }
      }
    }

    audio.addEventListener('ended', handleEnded)
    return () => {
      audio.removeEventListener('ended', handleEnded)
    }
  }, [nextRoomTrack])

  // Supabase Realtime Channel 購読処理
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

    // 1. PostgreSQL テーブル更新リアルタイム同期（偽装不可能なサーバー認証DB変更のみを受信）
    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'study_rooms', filter: `id=eq.${roomId}` },
      async (payload) => {
        const updated = payload.new as {
          current_track_id?: string | null
          epoch_started_at?: string
          playback_state?: PlaybackState
        }
        if (updated && updated.current_track_id) {
          const track = await resolveTrack(updated.current_track_id)
          if (track && track.url) {
            syncPlayback(
              track.url,
              updated.epoch_started_at || new Date().toISOString(),
              updated.playback_state || 'playing'
            )
          }
        }
      }
    )

    // 2. SILENT_CHEER ブロードキャスト受信
    channel.on('broadcast', { event: 'SILENT_CHEER' }, ({ payload }) => {
      addCheer(payload as SilentCheerPayload)
    })

    // 3. Presence 状態同期
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

    // チャンネル購読開始およびプレゼンストラッキング
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_identifier: userIdentifier,
          display_name: displayName,
          focus_status: 'focusing',
          current_streak_minutes: 0,
          joined_at: new Date().toISOString(),
        })

        // 初回入室時の再生情報取得
        try {
          const { data: roomData } = await supabase
            .from('study_rooms')
            .select('current_track_id, epoch_started_at, playback_state')
            .eq('id', roomId)
            .maybeSingle()

          if (roomData && roomData.current_track_id) {
            const track = await resolveTrack(roomData.current_track_id)
            if (track && track.url) {
              syncPlayback(track.url, roomData.epoch_started_at, roomData.playback_state as PlaybackState)
            }
          }
        } catch (e) {
          console.error('[RoomBgmSync] Error loading initial playback:', e)
        }
      }
    })

    // 定期的なハートビート送信（30秒間隔でDB状態を最新化）
    const heartbeatInterval = window.setInterval(() => {
      if (roomId && userIdentifier) {
        updateMemberStatus(roomId, userIdentifier, 'focusing', 0).catch(() => {})
      }
    }, 30000)

    // タブ終了・リロード時の自動退出処理
    const handleBeforeUnload = () => {
      if (roomId && userIdentifier) {
        leaveStudyRoom(roomId, userIdentifier).catch(() => {})
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.clearInterval(heartbeatInterval)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (channel) {
        channel.untrack().catch(() => {})
        channel.unsubscribe().catch(() => {})
      }
      channelRef.current = null
      const audio = audioRef.current
      if (audio) {
        audio.pause()
        audio.src = ''
      }
    }
  }, [
    roomId,
    userIdentifier,
    displayName,
    resolveTrack,
    syncPlayback,
    addCheer,
    setMembers,
    addMember,
    removeMember,
    setRoomPlaybackState,
  ])

  // ポモドーロに基づくプレゼンス状態の更新
  const updatePresenceStatus = useCallback(
    async (focusStatus: 'focusing' | 'short_break' | 'long_break' | 'idle', streakMinutes: number) => {
      const channel = channelRef.current
      if (channel) {
        await channel.track({
          user_identifier: userIdentifier,
          display_name: displayName,
          focus_status: focusStatus,
          current_streak_minutes: streakMinutes,
          joined_at: new Date().toISOString(),
        })
      }
    },
    [userIdentifier, displayName]
  )

  // 静かな応援の送信
  const sendSilentCheer = useCallback(
    (cheerType: CheerType) => {
      const cheerPayload: SilentCheerPayload = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        sender_name: displayName || 'Anonymous',
        cheer_type: cheerType,
        timestamp: Date.now(),
      }

      addCheer(cheerPayload)

      const channel = channelRef.current
      if (channel) {
        channel.send({
          type: 'broadcast',
          event: 'SILENT_CHEER',
          payload: cheerPayload,
        })
      }
    },
    [displayName, addCheer]
  )

  // 各種アクションのストア登録
  useEffect(() => {
    setRealtimeActions({
      changeRoomTrack,
      sendSilentCheer,
      updatePresenceStatus,
      toggleRoomShuffle,
      cycleRoomRepeatMode,
      nextRoomTrack,
      prevRoomTrack,
      setRoomQueue,
      updatePlaybackState,
    })

    return () => {
      setRealtimeActions(null)
    }
  }, [
    changeRoomTrack,
    sendSilentCheer,
    updatePresenceStatus,
    toggleRoomShuffle,
    cycleRoomRepeatMode,
    nextRoomTrack,
    prevRoomTrack,
    setRoomQueue,
    updatePlaybackState,
    setRealtimeActions,
  ])

  return {
    currentTrack,
    changeRoomTrack,
    sendSilentCheer,
    updatePresenceStatus,
    toggleRoomShuffle,
    cycleRoomRepeatMode,
    nextRoomTrack,
    prevRoomTrack,
    setRoomQueue,
    updatePlaybackState,
  }
}
