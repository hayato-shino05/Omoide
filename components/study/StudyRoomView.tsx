'use client'

import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { useStudyRoomStore } from '@/lib/stores/studyRoomStore'
import { useUIStore } from '@/lib/stores/uiStore'
import { usePomodoro } from '@/lib/hooks/usePomodoro'
import { useAmbientSoundStore } from '@/lib/stores/ambientSoundStore'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { DeskPresenceList } from './DeskPresenceList'
import { SilentCheerOverlay } from './SilentCheerOverlay'
import { ZenFocusModal } from './ZenFocusModal'
import { PomodoroSettingsModal } from './PomodoroSettingsModal'
import SongPickerModal from '@/components/community/SongPickerModal'
import { leaveStudyRoom, updateMemberStatus } from '@/lib/study/client'

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

export function StudyRoomView({ roomId, onLeave }: StudyRoomViewProps) {
  const {
    currentRoom,
    currentTrack,
    isSoloMode,
    roomVolume,
    isHost,
    roomSessionStartedAt,
    userIdentifier,
    changeRoomTrackAction,
    sendSilentCheerAction,
    updatePresenceStatusAction,
    setIsSoloMode,
    setRoomVolume,
    setAmbientMixerOpen,
    resetRoom,
  } = useStudyRoomStore()

  const { closeModal } = useUIStore()
  const { volumes, isPlaying: isAmbientPlaying } = useAmbientSoundStore()
  const { t } = useLanguage()

  const changeRoomTrack = changeRoomTrackAction || (async () => {})
  const sendSilentCheer = sendSilentCheerAction || (() => {})
  const updatePresenceStatus = updatePresenceStatusAction || (async () => {})

  const [isZenOpen, setIsZenOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isSongPickerOpen, setIsSongPickerOpen] = useState(false)
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
  const handleCycleComplete = async (mode: string, streakMinutes: number) => {
    const status = mode === 'focus' ? 'focusing' : mode === 'long_break' ? 'long_break' : 'short_break'
    await updateMemberStatus(roomId, userIdentifier, status, streakMinutes)
    await updatePresenceStatus(status, streakMinutes)
  }

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

  const activeAmbientCount = Object.values(volumes).filter((v) => v > 0).length

  const handleLeave = async () => {
    if (confirm(t('studyLeaveConfirm'))) {
      await leaveStudyRoom(roomId, userIdentifier)
      resetRoom()
      onLeave()
    }
  }

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    url.searchParams.set('studyRoom', roomId)
    navigator.clipboard.writeText(url.toString()).then(() => {
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    })
  }

  const handleSongConfirm = (reference: string) => {
    const cleanId = reference.includes(':') ? reference.split(':')[1] : reference
    changeRoomTrack(cleanId)
    setIsSongPickerOpen(false)
  }

  return (
    <div className="relative w-full max-w-5xl mx-auto flex flex-col gap-4 p-2 sm:p-4 text-[#854D27]">
      {/* フローティングリアクションレイヤー */}
      <SilentCheerOverlay />

      {/* 1. Discord Stage ヘッダーバー */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-white border-2 border-[#D4B08C] shadow-xs">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* ライブステージバッジ */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs shadow-2xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
            </span>
            <Radio size={14} className="text-emerald-700" />
            <span className="hidden sm:inline">LIVE STAGE</span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-[#854D27] truncate max-w-[180px] sm:max-w-md font-heading">
                {currentRoom?.name || t('studyRoomTitle')}
              </h1>
              {currentRoom?.is_private && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] bg-[#FAF0E6] text-[#854D27] border border-[#D4B08C] font-semibold flex-shrink-0 font-body">
                  <Lock size={10} />
                  {t('studyPrivateRoom')}
                </span>
              )}
            </div>

            {/* リアルタイム接続時間 */}
            <div className="flex items-center gap-2 text-xs text-[#854D27]/80 mt-0.5 font-body">
              <div className="flex items-center gap-1 font-mono font-bold text-[#D95D39] tabular-nums">
                <Clock size={12} />
                <span>{formatDuration(elapsedSeconds)}</span>
              </div>
              <span className="text-[#854D27]/40">•</span>
              <span className="truncate max-w-[200px] sm:max-w-xs text-[#854D27]/70">
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
            className="flex items-center gap-1.5 px-3.5 sm:px-4 h-11 min-h-[44px] rounded-xl text-xs font-bold bg-[#D95D39] hover:bg-[#C24E2B] active:scale-95 text-white border-2 border-[#854D27] shadow-[2px_2px_0_#854D27] transition-all cursor-pointer font-body"
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
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[#FFF9F3] hover:bg-[#FAF0E6] active:scale-95 text-[#854D27] border border-[#D4B08C] transition-all shadow-2xs cursor-pointer"
          >
            {isCopied ? <Check size={17} className="text-emerald-600" /> : <Share2 size={17} />}
          </button>

          {/* 最小化ボタン（BGMを維持したまま他の画面へ） */}
          <button
            type="button"
            onClick={() => closeModal()}
            title={t('studyMinimizeRoom')}
            aria-label={t('studyMinimizeRoom')}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[#FFF9F3] hover:bg-[#FAF0E6] active:scale-95 text-[#854D27] border border-[#D4B08C] transition-all shadow-2xs cursor-pointer"
          >
            <Minus size={18} />
          </button>

          {/* 切断・退出ボタン */}
          <button
            type="button"
            onClick={handleLeave}
            title={t('studyLeaveRoom')}
            aria-label={t('studyLeaveRoom')}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 hover:text-rose-800 border border-rose-300 transition-all shadow-2xs cursor-pointer"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>

      {/* 2. Discord Stage Sân khấu DJ & Âm nhạc trung tâm */}
      <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#FFF9F3] via-[#FAF3EB] to-[#F5EBE1] border-2 border-[#D4B08C] shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Sân khấu DJ Hero (Vinyl & Audio Waveform) */}
          <div className="lg:col-span-7 flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
            {/* 回転レコード盤 */}
            <div className="relative flex-shrink-0">
              <div
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#201A15] p-1.5 border-3 border-[#854D27] shadow-md flex items-center justify-center ${
                  currentTrack && !isSoloMode ? 'animate-spin' : ''
                }`}
                style={{ animationDuration: '8s' }}
              >
                {/* レコード溝のデザイン */}
                <div className="w-full h-full rounded-full border border-stone-700/60 flex items-center justify-center p-2">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#D4B08C] bg-[#FAF0E6] flex items-center justify-center">
                    {currentTrack?.albumImage ? (
                      <img
                        src={currentTrack.albumImage}
                        alt={currentTrack.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Disc3 size={24} className="text-[#D95D39]" />
                    )}
                  </div>
                </div>
              </div>

              {/* DJアイコン */}
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-amber-400 border border-amber-600 text-amber-950 shadow-xs">
                <Music size={13} />
              </div>
            </div>

            {/* 楽曲情報 & DJコントロール */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] bg-[#FAF0E6] text-[#D95D39] border border-[#D4B08C] font-bold font-body">
                  {t('studyStageDj')}
                </span>
                {isSoloMode && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 border border-amber-300 font-bold font-body">
                    {t('studySoloMuteRoom')}
                  </span>
                )}
              </div>

              <h2 className="text-base sm:text-lg font-bold text-[#854D27] truncate font-heading">
                {currentTrack?.name || t('studyWaitingDj')}
              </h2>
              <p className="text-xs text-[#854D27]/70 truncate font-body">
                {currentTrack?.artistName || t('studyRoomBgm')}
              </p>

              {/* 音声イコライザー波形アニメーション */}
              {currentTrack && !isSoloMode && (
                <div className="flex items-center justify-center sm:justify-start gap-1 mt-2.5 h-4">
                  {[40, 75, 55, 90, 60, 85, 45, 70].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-[#D95D39] rounded-full animate-pulse"
                      style={{
                        height: `${h}%`,
                        animationDelay: `${i * 120}ms`,
                        animationDuration: '900ms',
                      }}
                    />
                  ))}
                </div>
              )}

              {/* DJ楽曲変更ボタン（Host専用） */}
              {isHost && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setIsSongPickerOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#D95D39] hover:bg-[#C24E2B] text-white border border-[#854D27] shadow-xs active:scale-95 transition-all cursor-pointer font-body min-h-[36px]"
                  >
                    <Music size={14} />
                    <span>{t('studyChangeSong')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 音声コントロール（ソロ消音 & 環境音） */}
          <div className="lg:col-span-5 flex flex-col gap-2.5 p-3.5 rounded-xl bg-white/90 border border-[#D4B08C] shadow-2xs">
            {/* ソロミュート & 音量スライダー */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsSoloMode(!isSoloMode)}
                aria-label={isSoloMode ? t('unmute') : t('studySoloMuteRoom')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 font-body min-h-[40px] ${
                  isSoloMode
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-[#FFF9F3] hover:bg-[#FAF0E6] text-[#854D27] border-[#D4B08C]'
                }`}
              >
                {isSoloMode ? <VolumeX size={15} /> : <Volume2 size={15} />}
                <span>{isSoloMode ? t('unmute') : t('studySoloMuteRoom')}</span>
              </button>

              <div className="flex items-center gap-2 flex-1 max-w-[150px]">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  disabled={isSoloMode}
                  value={isSoloMode ? 0 : roomVolume}
                  onChange={(e) => setRoomVolume(parseFloat(e.target.value))}
                  aria-label={t('studyRoomBgm')}
                  className="w-full h-1.5 bg-[#D4B08C]/40 rounded-lg appearance-none cursor-pointer accent-[#D95D39] disabled:opacity-30"
                />
                <span className="text-[11px] font-mono text-[#854D27]/80 font-bold tabular-nums w-8 text-right">
                  {isSoloMode ? '0%' : `${Math.round(roomVolume * 100)}%`}
                </span>
              </div>
            </div>

            {/* 自然環境音ミキサーボタン */}
            <div className="flex items-center justify-between pt-2 border-t border-[#D4B08C]/30">
              <button
                type="button"
                onClick={() => setAmbientMixerOpen(true)}
                aria-label={t('studyAmbientSounds')}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer font-body min-h-[40px] ${
                  activeAmbientCount > 0 && isAmbientPlaying
                    ? 'bg-emerald-50 text-[#2E7D6F] border-[#2E7D6F]'
                    : 'bg-[#FFF9F3] text-[#854D27] hover:bg-[#FAF0E6] border-[#D4B08C]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sliders size={15} />
                  <span>{t('studyAmbientSounds')}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#D4B08C]/20 font-mono font-bold">
                  {activeAmbientCount} 音源
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. ポモドーロステージウィジェット */}
        <div className="mt-5 pt-4 border-t border-[#D4B08C]/40 flex flex-wrap items-center justify-between gap-3 bg-white/70 p-3 rounded-xl border border-[#D4B08C]/50">
          {/* モード切り替えタブ */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => switchPomodoroMode('focus')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer font-body min-h-[36px] ${
                mode === 'focus'
                  ? 'bg-[#D95D39] text-white shadow-xs'
                  : 'text-[#854D27] hover:bg-[#FAF0E6]'
              }`}
            >
              {durations.focus}m {t('studyPomodoroFocus')}
            </button>
            <button
              type="button"
              onClick={() => switchPomodoroMode('short_break')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer font-body min-h-[36px] ${
                mode === 'short_break'
                  ? 'bg-[#2E7D6F] text-white shadow-xs'
                  : 'text-[#854D27] hover:bg-[#FAF0E6]'
              }`}
            >
              {durations.short_break}m {t('studyPomodoroShortBreak')}
            </button>
            <button
              type="button"
              onClick={() => switchPomodoroMode('long_break')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer font-body min-h-[36px] ${
                mode === 'long_break'
                  ? 'bg-[#4A6572] text-white shadow-xs'
                  : 'text-[#854D27] hover:bg-[#FAF0E6]'
              }`}
            >
              {durations.long_break}m {t('studyPomodoroLongBreak')}
            </button>
          </div>

          {/* タイマーカウントダウン & 操作 */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#854D27] tabular-nums leading-none">
                {formattedTime}
              </div>
              <div className="text-[10px] font-mono font-bold text-[#854D27]/70 mt-0.5">
                {t('studyPomodoroCycle', { cycle: completedCycles + 1 })} • {streakMinutes}m
              </div>
            </div>

            <button
              type="button"
              onClick={isPomodoroRunning ? pausePomodoro : startPomodoro}
              aria-label={isPomodoroRunning ? t('studyPomodoroPause') : t('studyPomodoroStart')}
              className="flex items-center justify-center w-9 h-9 min-w-[36px] min-h-[36px] rounded-lg bg-[#D95D39] hover:bg-[#C24E2B] text-white active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              {isPomodoroRunning ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={resetPomodoro}
              aria-label={t('studyPomodoroReset')}
              className="flex items-center justify-center w-9 h-9 min-w-[36px] min-h-[36px] rounded-lg bg-white hover:bg-[#FAF0E6] text-[#854D27] border border-[#D4B08C] active:scale-95 transition-all shadow-2xs cursor-pointer"
            >
              <RotateCcw size={15} />
            </button>

            <button
              type="button"
              onClick={() => setIsPomodoroSettingsOpen(true)}
              aria-label={t('studyPomodoroSettings')}
              title={t('studyPomodoroSettings')}
              className="flex items-center justify-center w-9 h-9 min-w-[36px] min-h-[36px] rounded-lg bg-white hover:bg-[#FAF0E6] text-[#854D27] border border-[#D4B08C] active:scale-95 transition-all shadow-2xs cursor-pointer"
            >
              <SlidersHorizontal size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Discord Stage 机・メンバーグリッド */}
      <DeskPresenceList onSendCheer={sendSilentCheer} />

      {/* 5. 全画面 禅集中モード */}
      <ZenFocusModal
        isOpen={isZenOpen}
        onClose={() => setIsZenOpen(false)}
        onCycleComplete={handleCycleComplete}
      />

      {/* 6. ポモドーロカスタム時間設定モーダル */}
      <PomodoroSettingsModal
        isOpen={isPomodoroSettingsOpen}
        onClose={() => setIsPomodoroSettingsOpen(false)}
        currentDurations={durations}
        onSave={updateDurations}
        onResetDefaults={resetToDefaults}
      />

      {/* 7. DJ 楽曲カタログ選択モーダル */}
      {isHost && (
        <SongPickerModal
          isOpen={isSongPickerOpen}
          onClose={() => setIsSongPickerOpen(false)}
          onConfirm={handleSongConfirm}
          initialValue={currentTrack?.id}
        />
      )}
    </div>
  )
}
