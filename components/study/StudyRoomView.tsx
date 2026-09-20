'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import {
  Radio,
  LogOut,
  Share2,
  Check,
  Maximize2,
  Lock,
  Minus,
  Disc3,
  Volume2,
  VolumeX,
  Sliders,
  Music,
  Clock,
  Play,
  Pause,
  RotateCcw,
  SlidersHorizontal,
  Shuffle,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  ListMusic,
} from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useStudyRoomStore } from '@/lib/stores/studyRoomStore'
import { useUIStore } from '@/lib/stores/uiStore'
import { usePomodoro } from '@/lib/hooks/usePomodoro'
import { useAmbientSoundStore } from '@/lib/stores/ambientSoundStore'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useToast } from '@/components/ui/Toast'
import { JAPAN_PRESET_TRACKS } from '@/lib/music/presets'
import { DeskPresenceList } from './DeskPresenceList'
import { SilentCheerOverlay } from './SilentCheerOverlay'
import { leaveStudyRoom, updateMemberStatus } from '@/lib/study/client'

const ZenFocusModal = dynamic(() => import('./ZenFocusModal').then((mod) => mod.ZenFocusModal), { ssr: false })
const PomodoroSettingsModal = dynamic(() => import('./PomodoroSettingsModal').then((mod) => mod.PomodoroSettingsModal), { ssr: false })
const SongRequestListModal = dynamic(() => import('./SongRequestListModal').then((mod) => mod.SongRequestListModal), { ssr: false })
const ConfirmModal = dynamic(() => import('@/components/ui/ConfirmModal').then((mod) => mod.ConfirmModal), { ssr: false })
const SongPickerModal = dynamic(() => import('@/components/community/SongPickerModal'), { ssr: false })

interface StudyRoomViewProps {
  roomId: string
  onLeave: () => void
}

// 秒数を HH:MM:SS または MM:SS 形式に変換
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  const pad = (n: number) => n.toString().padStart(2, '0')

  if (h > 0) {
    return `${pad(h)}:${pad(m)}:${pad(s)}`
  }
  return `${pad(m)}:${pad(s)}`
}

export const StudyRoomView = React.memo(function StudyRoomView({ roomId, onLeave }: StudyRoomViewProps) {
  const {
    currentRoom,
    isHost: storeIsHost,
    currentTrack,
    isSoloMode,
    roomVolume,
    roomSessionStartedAt,
    userIdentifier,
    roomQueue,
    roomTrackIndex,
    isRoomShuffle,
    roomRepeatMode,
    songRequests,
    changeRoomTrackAction,
    sendSilentCheerAction,
    updatePresenceStatusAction,
    toggleRoomShuffleAction,
    cycleRoomRepeatModeAction,
    nextRoomTrackAction,
    prevRoomTrackAction,
    updatePlaybackStateAction,
    requestSongAction,
    setIsSoloMode,
    setRoomVolume,
    setAmbientMixerOpen,
    setSongRequestModalOpen,
    resetRoom,
  } = useStudyRoomStore(
    useShallow((state) => ({
      currentRoom: state.currentRoom,
      isHost: state.isHost,
      currentTrack: state.currentTrack,
      isSoloMode: state.isSoloMode,
      roomVolume: state.roomVolume,
      roomSessionStartedAt: state.roomSessionStartedAt,
      userIdentifier: state.userIdentifier,
      roomQueue: state.roomQueue,
      roomTrackIndex: state.roomTrackIndex,
      isRoomShuffle: state.isRoomShuffle,
      roomRepeatMode: state.roomRepeatMode,
      songRequests: state.songRequests,
      changeRoomTrackAction: state.changeRoomTrackAction,
      sendSilentCheerAction: state.sendSilentCheerAction,
      updatePresenceStatusAction: state.updatePresenceStatusAction,
      toggleRoomShuffleAction: state.toggleRoomShuffleAction,
      cycleRoomRepeatModeAction: state.cycleRoomRepeatModeAction,
      nextRoomTrackAction: state.nextRoomTrackAction,
      prevRoomTrackAction: state.prevRoomTrackAction,
      updatePlaybackStateAction: state.updatePlaybackStateAction,
      requestSongAction: state.requestSongAction,
      setIsSoloMode: state.setIsSoloMode,
      setRoomVolume: state.setRoomVolume,
      setAmbientMixerOpen: state.setAmbientMixerOpen,
      setSongRequestModalOpen: state.setSongRequestModalOpen,
      resetRoom: state.resetRoom,
    }))
  )

  const closeModal = useUIStore((state) => state.closeModal)
  const { volumes, isPlaying: isAmbientPlaying } = useAmbientSoundStore(
    useShallow((state) => ({
      volumes: state.volumes,
      isPlaying: state.isPlaying,
    }))
  )
  const { t } = useLanguage()
  const toast = useToast()

  // ホスト権限判定（部屋の作成者・ホストのみBGMの全体制御が可能）
  const isHost = Boolean(storeIsHost || (currentRoom?.host_id && currentRoom.host_id === userIdentifier))

  // ホスト離脱によるホスト権限移行（Host Migration）の検知とトースト通知
  const prevHostIdRef = useRef<string | null>(currentRoom?.host_id || null)
  useEffect(() => {
    if (currentRoom?.host_id) {
      if (prevHostIdRef.current && prevHostIdRef.current !== currentRoom.host_id) {
        if (currentRoom.host_id === userIdentifier) {
          toast.info(t('studyHostMigrated'))
        }
      }
      prevHostIdRef.current = currentRoom.host_id
    }
  }, [currentRoom?.host_id, userIdentifier, toast, t])

  const changeRoomTrack = changeRoomTrackAction || (async () => {})
  const sendSilentCheer = sendSilentCheerAction || (() => {})
  const updatePresenceStatus = updatePresenceStatusAction || (async () => {})
  const toggleShuffle = toggleRoomShuffleAction || (async () => {})
  const cycleRepeat = cycleRoomRepeatModeAction || (async () => {})
  const nextTrack = nextRoomTrackAction || (async () => {})
  const prevTrack = prevRoomTrackAction || (async () => {})
  const updatePlaybackState = updatePlaybackStateAction || (async () => {})

  // ホスト限定アクションの実行ラッパー（非ホスト時はトーストで案内）
  const handleHostAction = useCallback((action: () => void | Promise<void>) => {
    if (!isHost) {
      toast.info(t('studyHostOnlyNotice'))
      return
    }
    action()
  }, [isHost, toast, t])

  const isRoomPlaying =
    currentRoom?.playback_state !== 'paused' && currentRoom?.playback_state !== 'stopped'

  const togglePlayPause = useCallback(() => {
    handleHostAction(async () => {
      const nextState = isRoomPlaying ? 'paused' : 'playing'
      await updatePlaybackState(nextState)
    })
  }, [handleHostAction, isRoomPlaying, updatePlaybackState])

  const [isZenOpen, setIsZenOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false)
  const [isSongPickerOpen, setIsSongPickerOpen] = useState(false)
  const [songPickerMode, setSongPickerMode] = useState<'change' | 'request'>('change')
  const [isPomodoroSettingsOpen, setIsPomodoroSettingsOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  // リアルタイム接続時間カウンター（1秒周期で更新）
  useEffect(() => {
    if (!roomSessionStartedAt) return

    const timer = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    return () => clearInterval(timer)
  }, [roomSessionStartedAt])

  const elapsedSeconds = roomSessionStartedAt
    ? Math.max(0, Math.floor((currentTime - roomSessionStartedAt) / 1000))
    : 0

  // ポモドーロタイマーの連携
  const handleCycleComplete = useCallback(async (mode: string, streakMinutes: number) => {
    const status = mode === 'focus' ? 'focusing' : mode === 'long_break' ? 'long_break' : 'short_break'
    await updateMemberStatus(roomId, userIdentifier, status, streakMinutes)
    await updatePresenceStatus(status, streakMinutes)
  }, [roomId, userIdentifier, updatePresenceStatus])

  const {
    mode,
    isRunning: isPomodoroRunning,
    completedCycles,
    streakMinutes,
    durations,
    formattedTime,
    start: startPomodoro,
    pause: pausePomodoro,
    reset: resetPomodoro,
    switchMode: switchPomodoroMode,
    updateDurations,
    resetToDefaults,
  } = usePomodoro(handleCycleComplete)

  const activeAmbientCount = useMemo(
    () => Object.values(volumes).filter((v) => v > 0).length,
    [volumes]
  )

  const handleLeave = useCallback(() => {
    setIsLeaveConfirmOpen(true)
  }, [])

  const executeLeave = useCallback(async () => {
    await leaveStudyRoom(roomId, userIdentifier)
    resetRoom()
    useAmbientSoundStore.getState().setIsPlaying(false)
    setIsLeaveConfirmOpen(false)
    onLeave()
  }, [roomId, userIdentifier, resetRoom, onLeave])

  const handleCopyLink = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('studyRoom', roomId)
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard
          .writeText(url.toString())
          .then(() => {
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 2000)
          })
          .catch((e) => {
            console.warn('[StudyRoomView] Clipboard copy failed:', e)
          })
      }
    } catch (e) {
      console.warn('[StudyRoomView] Failed to build or copy share URL:', e)
    }
  }, [roomId])

  const handleSongConfirm = useCallback(async (reference: string) => {
    if (songPickerMode === 'change') {
      if (!isHost) {
        toast.info(t('studyHostOnlyNotice'))
        return
      }
      changeRoomTrack(reference)
      setIsSongPickerOpen(false)
    } else {
      // メンバーによる楽曲リクエスト送信
      const cleanId = reference.includes(':') ? reference.split(':')[1] : reference
      const preset = JAPAN_PRESET_TRACKS.find(
        (t) =>
          t.id === cleanId ||
          t.id === reference ||
          t.reference === reference ||
          (t.trackId === cleanId && t.provider === 'jamendo')
      )
      const trackPayload = {
        id: reference,
        name: preset?.name || 'Requested Track',
        artistName: preset?.artistName || 'Unknown Artist',
        albumImage: preset?.albumImage,
      }
      if (requestSongAction) {
        const success = await requestSongAction(trackPayload)
        if (success) {
          toast.success(t('studyRequestSent'))
        } else {
          toast.error(t('studyRequestFailed'))
        }
      }
      setIsSongPickerOpen(false)
    }
  }, [songPickerMode, isHost, changeRoomTrack, requestSongAction, t, toast])

  return (
    <div className="relative w-full max-w-5xl mx-auto flex flex-col gap-4 p-2 sm:p-4 text-[#3D2314]">
      {/* フローティングリアクションレイヤー */}
      <SilentCheerOverlay />

      {/* 1. Discord Stage ヘッダーバー */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-[#FFFDF9] border-2 border-[#D4B08C] shadow-[0_4px_20px_-4px_rgba(133,77,39,0.06)]">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* ライブステージバッジ */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF0E6] border border-[#D4B08C] text-[#3D2314] font-bold text-xs shadow-2xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2E7D6F] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#2E7D6F]" />
            </span>
            <Radio size={14} className="text-[#2E7D6F]" />
            <span className="hidden sm:inline font-heading tracking-wider">LIVE STAGE</span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-[#3D2314] truncate max-w-[180px] sm:max-w-md font-heading">
                {currentRoom?.name || t('studyRoomTitle')}
              </h1>
              {currentRoom?.is_private && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] bg-[#FAF0E6] text-[#3D2314] border border-[#D4B08C] font-semibold flex-shrink-0 font-body">
                  <Lock size={10} />
                  {t('studyPrivateRoom')}
                </span>
              )}
            </div>

            {/* リアルタイム接続時間 & 部屋説明 */}
            <div className="flex items-center gap-2 text-xs text-[#5C3A21] mt-0.5 font-body font-medium">
              <div className="flex items-center gap-1 font-mono font-bold text-[#D95D39] tabular-nums">
                <Clock size={12} />
                <span>{formatDuration(elapsedSeconds)}</span>
              </div>
              <span className="text-[#D4B08C] hidden sm:inline">•</span>
              <span className="truncate max-w-[200px] sm:max-w-xs text-[#5C3A21] hidden sm:inline">
                {currentRoom?.description || t('studyRoomDesc')}
              </span>
            </div>
          </div>
        </div>

        {/* ヘッダー操作ボタン群 */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* 禅集中モード（全画面） */}
          <button
            type="button"
            onClick={() => setIsZenOpen(true)}
            aria-label={t('studyZenMode')}
            title={t('studyZenMode')}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 h-11 min-h-[44px] rounded-xl text-xs font-bold bg-[#D95D39] hover:bg-[#C24E2B] active:scale-[0.96] text-white border-2 border-[#854D27] shadow-[2px_2px_0_#854D27] transition-all cursor-pointer font-body focus-visible:ring-2 focus-visible:ring-[#854D27]/40"
          >
            <Maximize2 size={15} />
            <span className="hidden sm:inline">{t('studyZenMode')}</span>
          </button>

          {/* 招待リンクコピー */}
          <button
            type="button"
            onClick={handleCopyLink}
            title={t('studyCopyInviteLink')}
            aria-label={t('studyCopyInviteLink')}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[#FAF0E6] hover:bg-[#F3E5D8] active:scale-[0.96] text-[#3D2314] border border-[#D4B08C] transition-all shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#854D27]/40"
          >
            {isCopied ? <Check size={17} className="text-[#2E7D6F]" /> : <Share2 size={17} />}
          </button>

          {/* 最小化ボタン（BGMを維持したまま他の画面へ） */}
          <button
            type="button"
            onClick={() => closeModal()}
            title={t('studyMinimizeRoom')}
            aria-label={t('studyMinimizeRoom')}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[#FAF0E6] hover:bg-[#F3E5D8] active:scale-[0.96] text-[#3D2314] border border-[#D4B08C] transition-all shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#854D27]/40"
          >
            <Minus size={18} />
          </button>

          {/* 切断・退出ボタン */}
          <button
            type="button"
            onClick={handleLeave}
            title={t('studyLeaveRoom')}
            aria-label={t('studyLeaveRoom')}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-[0.96] text-rose-800 border border-rose-300 transition-all shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>

      {/* 2. ステージ・ポモドーロ 2カラム構成 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        {/* カラム1: DJステージ・BGM制御 (lg:col-span-7) */}
        <div className="lg:col-span-7 flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-[#FFFDF9] border-2 border-[#D4B08C] shadow-[0_4px_20px_-4px_rgba(133,77,39,0.06)]">
          <div>
            {/* ステージDJヘッダー */}
            <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-[#D4B08C]/40">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs bg-[#FAF0E6] text-[#D95D39] border border-[#D4B08C] font-bold font-heading flex items-center gap-1.5 shadow-2xs">
                  <Music size={13} />
                  <span>{t('studyStageDj')}</span>
                </span>
                {isSoloMode && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-bold font-body">
                    {t('studySoloMuteRoom')}
                  </span>
                )}
                {roomQueue.length > 0 && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-[#FAF0E6] text-[#5C3A21] border border-[#D4B08C]/60 font-mono font-bold font-body">
                    {roomTrackIndex + 1}/{roomQueue.length}
                  </span>
                )}
              </div>

              {/* 選曲・リクエスト操作ボタン群 */}
              <div className="flex items-center gap-2">
                {/* ホスト用: リクエスト審査ボタン */}
                {isHost ? (
                  <button
                    type="button"
                    onClick={() => setSongRequestModalOpen(true)}
                    aria-label={t('studySongRequests', { count: songRequests.length })}
                    className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all font-body min-h-[38px] bg-white hover:bg-[#FAF0E6] text-[#5C3A21] border-[#D4B08C] shadow-2xs active:scale-[0.96] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#854D27]/40"
                  >
                    <ListMusic size={14} className="text-[#D95D39]" />
                    <span>{t('studySongRequests', { count: songRequests.length })}</span>
                    {songRequests.length > 0 && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D95D39] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D95D39]" />
                      </span>
                    )}
                  </button>
                ) : (
                  /* メンバー用: 楽曲リクエスト送信ボタン */
                  <button
                    type="button"
                    onClick={() => {
                      setSongPickerMode('request')
                      setIsSongPickerOpen(true)
                    }}
                    aria-label={t('studyRequestSong')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all font-body min-h-[38px] bg-[#2E7D6F] hover:bg-[#25665B] text-white border-[#1B4D44] shadow-2xs active:scale-[0.96] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2E7D6F]/40"
                  >
                    <Music size={13} />
                    <span>{t('studyRequestSong')}</span>
                  </button>
                )}

                {/* ホスト用: 選曲ボタン */}
                {isHost && (
                  <button
                    type="button"
                    onClick={() => {
                      setSongPickerMode('change')
                      setIsSongPickerOpen(true)
                    }}
                    aria-label={t('studyChangeSong')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all font-body min-h-[38px] bg-[#D95D39] hover:bg-[#C24E2B] text-white border-[#854D27] shadow-2xs active:scale-[0.96] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#854D27]/40"
                  >
                    <Music size={13} />
                    <span>{t('studyChangeSong')}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Turntable Vinyl Hero */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 my-2">
              {/* 回転レコード盤 */}
              <div className="relative flex-shrink-0">
                <div
                  className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#1C1510] p-2 border-3 border-[#3D2314] shadow-md flex items-center justify-center ${
                    currentTrack && !isSoloMode ? 'animate-spin' : ''
                  }`}
                  style={{ animationDuration: '8s' }}
                >
                  {/* レコード溝のデザイン */}
                  <div className="w-full h-full rounded-full border border-stone-700/60 flex items-center justify-center p-2.5">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#D4B08C] bg-[#FAF0E6] flex items-center justify-center">
                      {currentTrack?.albumImage ? (
                        <img
                          src={currentTrack.albumImage}
                          alt={currentTrack.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Disc3 size={28} className="text-[#D95D39]" />
                      )}
                    </div>
                  </div>
                </div>

                {/* DJアイコンバッジ */}
                <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-amber-400 border border-amber-600 text-amber-950 shadow-xs">
                  <Music size={14} />
                </div>
              </div>

              {/* 楽曲情報 & Equalizer */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <h2 className="text-base sm:text-lg font-bold text-[#3D2314] truncate font-heading">
                  {currentTrack?.name || t('studyWaitingDj')}
                </h2>
                <p className="text-xs font-body font-medium text-[#5C3A21] truncate mt-0.5">
                  {currentTrack?.artistName || t('studyRoomBgm')}
                </p>

                {/* 音声イコライザー波形アニメーション */}
                {currentTrack && !isSoloMode && (
                  <div className="flex items-center justify-center sm:justify-start gap-1 mt-3 h-4">
                    {[40, 75, 55, 90, 60, 85, 45, 70, 60, 95].map((h, i) => (
                      <span
                        key={i}
                        className="w-1 bg-[#D95D39] rounded-full motion-safe:animate-pulse"
                        style={{
                          height: `${h}%`,
                          animationDelay: `${i * 100}ms`,
                          animationDuration: '900ms',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 再生/一時停止・シャッフル・前後スキップ・リピート操作（ホスト権限制御） */}
            <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-[#D4B08C]/40">
              {/* シャッフル切り替えボタン */}
              <button
                type="button"
                onClick={() => handleHostAction(toggleShuffle)}
                disabled={!isHost}
                title={
                  !isHost
                    ? t('studyHostOnlyTooltip')
                    : isRoomShuffle
                    ? t('studyShuffleOn')
                    : t('studyShuffleOff')
                }
                aria-label={t('studyShuffle')}
                aria-pressed={isRoomShuffle}
                className={`flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border transition-all shadow-2xs focus-visible:ring-2 focus-visible:ring-[#854D27]/40 ${
                  isRoomShuffle
                    ? 'bg-[#D95D39] text-white border-[#854D27]'
                    : 'bg-white text-[#5C3A21] hover:bg-[#FAF0E6] border-[#D4B08C]'
                } ${
                  isHost
                    ? 'active:scale-[0.96] cursor-pointer'
                    : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <Shuffle size={16} />
              </button>

              {/* 前の曲スキップボタン */}
              <button
                type="button"
                onClick={() => handleHostAction(prevTrack)}
                disabled={!isHost}
                title={!isHost ? t('studyHostOnlyTooltip') : t('studyPreviousTrack')}
                aria-label={t('studyPreviousTrack')}
                className={`flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white hover:bg-[#FAF0E6] text-[#3D2314] border border-[#D4B08C] transition-all shadow-2xs focus-visible:ring-2 focus-visible:ring-[#854D27]/40 ${
                  isHost
                    ? 'active:scale-[0.96] cursor-pointer'
                    : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <SkipBack size={16} />
              </button>

              {/* 再生 / 一時停止ボタン */}
              <button
                type="button"
                onClick={togglePlayPause}
                disabled={!isHost}
                title={
                  !isHost
                    ? t('studyHostOnlyTooltip')
                    : isRoomPlaying
                    ? t('pause')
                    : t('play')
                }
                aria-label={isRoomPlaying ? t('pause') : t('play')}
                className={`flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-[#D95D39] hover:bg-[#C24E2B] text-white border border-[#854D27] transition-all shadow-2xs focus-visible:ring-2 focus-visible:ring-[#854D27]/40 ${
                  isHost
                    ? 'active:scale-[0.96] cursor-pointer'
                    : 'opacity-60 cursor-not-allowed'
                }`}
              >
                {isRoomPlaying ? <Pause size={17} /> : <Play size={17} className="ml-0.5" />}
              </button>

              {/* 次の曲スキップボタン */}
              <button
                type="button"
                onClick={() => handleHostAction(nextTrack)}
                disabled={!isHost}
                title={!isHost ? t('studyHostOnlyTooltip') : t('studyNextTrack')}
                aria-label={t('studyNextTrack')}
                className={`flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white hover:bg-[#FAF0E6] text-[#3D2314] border border-[#D4B08C] transition-all shadow-2xs focus-visible:ring-2 focus-visible:ring-[#854D27]/40 ${
                  isHost
                    ? 'active:scale-[0.96] cursor-pointer'
                    : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <SkipForward size={16} />
              </button>

              {/* リピートモード切り替えボタン */}
              <button
                type="button"
                onClick={() => handleHostAction(cycleRepeat)}
                disabled={!isHost}
                title={
                  !isHost
                    ? t('studyHostOnlyTooltip')
                    : roomRepeatMode === 'one'
                    ? t('studyRepeatOne')
                    : roomRepeatMode === 'all'
                    ? t('studyRepeatAll')
                    : t('studyRepeatOff')
                }
                aria-label={t('repeat')}
                aria-pressed={roomRepeatMode !== 'off'}
                className={`flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border transition-all shadow-2xs focus-visible:ring-2 focus-visible:ring-[#854D27]/40 ${
                  roomRepeatMode !== 'off'
                    ? 'bg-[#2E7D6F] text-white border-[#1B4D44]'
                    : 'bg-white text-[#5C3A21] hover:bg-[#FAF0E6] border-[#D4B08C]'
                } ${
                  isHost
                    ? 'active:scale-[0.96] cursor-pointer'
                    : 'opacity-60 cursor-not-allowed'
                }`}
              >
                {roomRepeatMode === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
              </button>
            </div>
          </div>

          {/* Audio Controls (Solo Mute & Ambient Mixer) */}
          <div className="flex flex-col gap-2.5 mt-4 pt-3 bg-[#FAF3EB] p-3.5 rounded-xl border border-[#D4B08C]/50">
            {/* Solo Mute & Volume Slider */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsSoloMode(!isSoloMode)}
                aria-label={isSoloMode ? t('unmute') : t('studySoloMuteRoom')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-[0.96] font-body min-h-[44px] shadow-2xs focus-visible:ring-2 focus-visible:ring-[#854D27]/40 ${
                  isSoloMode
                    ? 'bg-amber-100 text-amber-950 border-amber-300'
                    : 'bg-white hover:bg-[#FAF0E6] text-[#3D2314] border-[#D4B08C]'
                }`}
              >
                {isSoloMode ? <VolumeX size={16} /> : <Volume2 size={16} />}
                <span>{isSoloMode ? t('unmute') : t('studySoloMuteRoom')}</span>
              </button>

              <div className="flex items-center gap-2 flex-1 max-w-[180px]">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  disabled={isSoloMode}
                  value={isSoloMode ? 0 : roomVolume}
                  onChange={(e) => setRoomVolume(parseFloat(e.target.value))}
                  aria-label={t('studyRoomBgm')}
                  className="w-full h-1.5 bg-[#D4B08C]/40 rounded-lg appearance-none cursor-pointer accent-[#D95D39] disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-[#854D27]/40"
                />
                <span className="text-xs font-mono text-[#3D2314] font-bold tabular-nums w-10 text-right">
                  {isSoloMode ? '0%' : `${Math.round(roomVolume * 100)}%`}
                </span>
              </div>
            </div>

            {/* Ambient Mixer Button */}
            <button
              type="button"
              onClick={() => setAmbientMixerOpen(true)}
              aria-label={t('studyAmbientSounds')}
              className={`flex items-center justify-between w-full px-3.5 py-2 rounded-xl text-xs font-bold border transition-all active:scale-[0.96] cursor-pointer font-body min-h-[44px] shadow-2xs focus-visible:ring-2 focus-visible:ring-[#854D27]/40 ${
                activeAmbientCount > 0 && isAmbientPlaying
                  ? 'bg-emerald-50 text-[#2E7D6F] border-[#2E7D6F]'
                  : 'bg-white text-[#3D2314] hover:bg-[#FAF0E6] border-[#D4B08C]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sliders size={16} />
                <span>{t('studyAmbientSounds')}</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-[#FAF0E6] text-[#3D2314] border border-[#D4B08C]/60 font-mono font-bold">
                {activeAmbientCount} 音源
              </span>
            </button>
          </div>
        </div>

        {/* カラム2: ポモドーロタイマー祠 (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-[#FFFDF9] border-2 border-[#D4B08C] shadow-[0_4px_20px_-4px_rgba(133,77,39,0.06)]">
          <div>
            {/* モード切り替えタブ */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#FAF3EB] border border-[#D4B08C]/50 mb-4">
              <button
                type="button"
                onClick={() => switchPomodoroMode('focus')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer font-body min-h-[38px] text-center focus-visible:ring-2 focus-visible:ring-[#854D27]/40 ${
                  mode === 'focus'
                    ? 'bg-[#D95D39] text-white shadow-xs'
                    : 'text-[#5C3A21] hover:bg-white/80'
                }`}
              >
                {durations.focus}m {t('studyPomodoroFocus')}
              </button>
              <button
                type="button"
                onClick={() => switchPomodoroMode('short_break')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer font-body min-h-[38px] text-center focus-visible:ring-2 focus-visible:ring-[#854D27]/40 ${
                  mode === 'short_break'
                    ? 'bg-[#2E7D6F] text-white shadow-xs'
                    : 'text-[#5C3A21] hover:bg-white/80'
                }`}
              >
                {durations.short_break}m {t('studyPomodoroShortBreak')}
              </button>
              <button
                type="button"
                onClick={() => switchPomodoroMode('long_break')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer font-body min-h-[38px] text-center focus-visible:ring-2 focus-visible:ring-[#854D27]/40 ${
                  mode === 'long_break'
                    ? 'bg-[#4A6572] text-white shadow-xs'
                    : 'text-[#5C3A21] hover:bg-white/80'
                }`}
              >
                {durations.long_break}m {t('studyPomodoroLongBreak')}
              </button>
            </div>

            {/* Central Time Display */}
            <div className="flex flex-col items-center justify-center my-3 py-2 text-center">
              <div
                className={`text-5xl sm:text-6xl font-bold font-mono tracking-tight text-[#3D2314] tabular-nums transition-transform duration-300 ${
                  isPomodoroRunning ? 'scale-105' : 'scale-100'
                }`}
              >
                {formattedTime}
              </div>
              <div className="text-xs font-mono font-bold text-[#5C3A21] mt-2">
                {t('studyPomodoroCycle', { cycle: completedCycles + 1 })} • {streakMinutes}m {t('studyStreak')}
              </div>
            </div>
          </div>

          {/* Action Bar (Play/Pause, Reset, Settings) */}
          <div className="flex items-center gap-2.5 pt-3 border-t border-[#D4B08C]/30">
            <button
              type="button"
              onClick={isPomodoroRunning ? pausePomodoro : startPomodoro}
              aria-label={isPomodoroRunning ? t('studyPomodoroPause') : t('studyPomodoroStart')}
              className="flex-1 flex items-center justify-center gap-2 h-11 min-h-[44px] rounded-xl bg-[#D95D39] hover:bg-[#C24E2B] text-white font-bold text-xs shadow-xs active:scale-[0.96] transition-all cursor-pointer font-body focus-visible:ring-2 focus-visible:ring-[#854D27]/40"
            >
              {isPomodoroRunning ? <Pause size={17} /> : <Play size={17} className="ml-0.5" />}
              <span>{isPomodoroRunning ? t('studyPomodoroPause') : t('studyPomodoroStart')}</span>
            </button>

            <button
              type="button"
              onClick={resetPomodoro}
              aria-label={t('studyPomodoroReset')}
              title={t('studyPomodoroReset')}
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white hover:bg-[#FAF0E6] text-[#3D2314] border border-[#D4B08C] active:scale-[0.96] transition-all shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#854D27]/40"
            >
              <RotateCcw size={17} />
            </button>

            <button
              type="button"
              onClick={() => setIsPomodoroSettingsOpen(true)}
              aria-label={t('studyPomodoroSettings')}
              title={t('studyPomodoroSettings')}
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white hover:bg-[#FAF0E6] text-[#3D2314] border border-[#D4B08C] active:scale-[0.96] transition-all shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#854D27]/40"
            >
              <SlidersHorizontal size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. 参加者机一覧グリッド */}
      <DeskPresenceList onSendCheer={sendSilentCheer} />

      {/* 4. 全画面 禅集中モード */}
      <ZenFocusModal
        isOpen={isZenOpen}
        onClose={() => setIsZenOpen(false)}
        onCycleComplete={handleCycleComplete}
      />

      {/* 5. ポモドーロカスタム時間設定モーダル */}
      <PomodoroSettingsModal
        isOpen={isPomodoroSettingsOpen}
        onClose={() => setIsPomodoroSettingsOpen(false)}
        currentDurations={durations}
        onSave={updateDurations}
        onResetDefaults={resetToDefaults}
      />

      {/* 6. 楽曲リクエスト審査モーダル */}
      <SongRequestListModal />

      {/* 7. 楽曲カタログ選択モーダル（全参加者利用可能） */}
      <SongPickerModal
        isOpen={isSongPickerOpen}
        onClose={() => setIsSongPickerOpen(false)}
        onConfirm={handleSongConfirm}
        initialValue={currentTrack?.id}
      />

      {/* 8. 退出確認モーダル（ブラウザ標準ダイアログ排除） */}
      <ConfirmModal
        isOpen={isLeaveConfirmOpen}
        title={t('studyLeaveRoom')}
        description={t('studyLeaveConfirm')}
        confirmText={t('studyDisconnectRoom')}
        cancelText={t('cancel')}
        icon="logout"
        variant="danger"
        onConfirm={executeLeave}
        onCancel={() => setIsLeaveConfirmOpen(false)}
      />
    </div>
  )
})
