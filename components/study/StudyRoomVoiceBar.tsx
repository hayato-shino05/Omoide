'use client'

import { useState, useEffect } from 'react'
import {
  Radio,
  Volume2,
  VolumeX,
  Sliders,
  Maximize2,
  LogOut,
  Disc3,
  Clock,
} from 'lucide-react'
import { useStudyRoomStore } from '@/lib/stores/studyRoomStore'
import { useUIStore } from '@/lib/stores/uiStore'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { leaveStudyRoom } from '@/lib/study/client'

// 秒数を HH:MM:SS または MM:SS 形式にフォーマット
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

export function StudyRoomVoiceBar() {
  const {
    currentRoom,
    currentTrack,
    isSoloMode,
    roomSessionStartedAt,
    userIdentifier,
    setIsSoloMode,
    setAmbientMixerOpen,
    resetRoom,
  } = useStudyRoomStore()

  const { activeModal, openModal } = useUIStore()
  const { t } = useLanguage()

  const [currentTime, setCurrentTime] = useState(() => Date.now())

  // リアルタイム接続時間カウンター（1秒周期で更新）
  useEffect(() => {
    if (!roomSessionStartedAt) return

    const timer = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    return () => clearInterval(timer)
  }, [roomSessionStartedAt])

  if (!currentRoom) return null

  const elapsedSeconds = roomSessionStartedAt
    ? Math.max(0, Math.floor((currentTime - roomSessionStartedAt) / 1000))
    : 0

  const isRoomModalOpen = activeModal === 'studyRoom'

  const handleDisconnect = async () => {
    if (confirm(t('studyLeaveConfirm'))) {
      await leaveStudyRoom(currentRoom.id, userIdentifier)
      resetRoom()
    }
  }

  const handleOpenRoom = () => {
    openModal('studyRoom')
  }

  return (
    <div
      role="region"
      aria-label={t('studyVoiceConnected')}
      className="fixed bottom-0 left-0 right-0 z-40 px-3 py-2 sm:py-2.5 bg-[#FFF9F3]/95 dark:bg-[#201A15]/95 backdrop-blur-md border-t-2 border-[#D4B08C] text-[#854D27] shadow-[0_-4px_12px_rgba(0,0,0,0.08)] transition-all duration-200"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* 左側：接続ステータス & 経過時間 */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* パルスインジケーター */}
          <div className="relative flex items-center justify-center flex-shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#854D27] truncate font-heading">
              <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <Radio size={13} className="animate-pulse" />
                <span className="hidden sm:inline">{t('studyVoiceConnected')}</span>
              </span>
              <span className="text-[#854D27]/40 hidden sm:inline">•</span>
              <span className="truncate max-w-[120px] sm:max-w-[200px] text-[#854D27]">
                {currentRoom.name}
              </span>
            </div>

            {/* 接続時間カウンター */}
            <div className="flex items-center gap-1 text-[11px] font-mono text-[#854D27]/80 font-bold tabular-nums">
              <Clock size={11} className="text-[#D95D39]" />
              <span>{formatDuration(elapsedSeconds)}</span>
            </div>
          </div>
        </div>

        {/* 中央：再生中の楽曲（中画面以上で表示） */}
        {currentTrack && (
          <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/80 border border-[#D4B08C]/60 max-w-xs truncate shadow-2xs">
            <Disc3
              size={16}
              className={`text-[#D95D39] flex-shrink-0 ${
                isSoloMode ? 'opacity-40' : 'animate-spin'
              }`}
              style={{ animationDuration: '6s' }}
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#854D27] truncate font-body">
                {currentTrack.name}
              </p>
              <p className="text-[10px] text-[#854D27]/70 truncate font-body">
                {currentTrack.artistName || 'Omoide Track'}
              </p>
            </div>
          </div>
        )}

        {/* 右側：操作ボタン群（Discordスタイル） */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* ソロミュート切り替えボタン */}
          <button
            type="button"
            onClick={() => setIsSoloMode(!isSoloMode)}
            title={isSoloMode ? t('unmute') : t('studySoloMuteRoom')}
            aria-label={isSoloMode ? t('unmute') : t('studySoloMuteRoom')}
            className={`w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border transition-all cursor-pointer shadow-2xs active:scale-95 ${
              isSoloMode
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-white hover:bg-[#FAF3EB] text-[#854D27] border-[#D4B08C]'
            }`}
          >
            {isSoloMode ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>

          {/* 環境音ミキサーボタン */}
          <button
            type="button"
            onClick={() => setAmbientMixerOpen(true)}
            title={t('studyAmbientSounds')}
            aria-label={t('studyAmbientSounds')}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white hover:bg-[#FAF3EB] border border-[#D4B08C] text-[#854D27] transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <Sliders size={17} />
          </button>

          {/* 部屋を開く / 最小化切り替えボタン */}
          {!isRoomModalOpen && (
            <button
              type="button"
              onClick={handleOpenRoom}
              title={t('studyOpenFullRoom')}
              aria-label={t('studyOpenFullRoom')}
              className="flex items-center gap-1.5 px-3 sm:px-4 h-11 min-h-[44px] rounded-xl bg-[#D95D39] hover:bg-[#C24E2B] text-white border-2 border-[#854D27] shadow-[2px_2px_0_#854D27] text-xs font-bold transition-all cursor-pointer active:scale-95 font-body"
            >
              <Maximize2 size={15} />
              <span className="hidden sm:inline">{t('studyOpenFullRoom')}</span>
            </button>
          )}

          {/* 切断・退出ボタン（赤色 Discordスタイル） */}
          <button
            type="button"
            onClick={handleDisconnect}
            title={t('studyDisconnectRoom')}
            aria-label={t('studyDisconnectRoom')}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-rose-600 hover:bg-rose-700 text-white border-2 border-rose-800 shadow-[2px_2px_0_#9F1239] transition-all cursor-pointer active:scale-95"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </div>
  )
}
