'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Maximize2,
  Minimize2,
  X,
  Palette,
  Sliders,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'
import { PomodoroRing } from './PomodoroRing'
import { usePomodoro } from '@/lib/hooks/usePomodoro'
import { ThemeEffects } from '@/components/effects/ThemeEffects'
import { THEMES } from '@/config/themes'
import { useTheme } from '@/lib/hooks/useTheme'
import { useStudyRoomStore } from '@/lib/stores/studyRoomStore'
import { useAmbientSoundStore } from '@/lib/stores/ambientSoundStore'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { AmbientMixerModal } from './AmbientMixerModal'
import type { ThemeName } from '@/types'

interface ZenFocusModalProps {
  isOpen: boolean
  onClose: () => void
  onCycleComplete?: (mode: string, streakMinutes: number) => void
}

export function ZenFocusModal({ isOpen, onClose, onCycleComplete }: ZenFocusModalProps) {
  const { theme: globalTheme, themeConfig: globalThemeConfig } = useTheme()
  const { currentTrack, isSoloMode, setIsSoloMode } = useStudyRoomStore()
  const { volumes } = useAmbientSoundStore()
  const { t } = useLanguage()

  const [zenTheme, setZenTheme] = useState<ThemeName | 'auto'>('auto')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMixerOpen, setIsMixerOpen] = useState(false)
  const [showThemePicker, setShowThemePicker] = useState(false)
  const [focusGoal, setFocusGoal] = useState('')
  const [isGoalCompleted, setIsGoalCompleted] = useState(false)

  const activeThemeName = zenTheme === 'auto' ? globalTheme : zenTheme
  const activeThemeConfig = THEMES[activeThemeName] || globalThemeConfig

  const pomodoro = usePomodoro((mode, streak) => {
    onCycleComplete?.(mode, streak)
  })

  // フルスクリーン切り替え
  const toggleFullscreen = () => {
    if (typeof document === 'undefined') return
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  // 禅モード終了時の確認ハンドラー
  const handleGuardedClose = useCallback(() => {
    if (!pomodoro.isRunning || confirm(t('studyExitZenConfirm'))) {
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {})
      }
      onClose()
    }
  }, [pomodoro.isRunning, onClose, t])

  // Escキーでの終了
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleGuardedClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleGuardedClose])

  if (!isOpen) return null

  const activeAmbientCount = Object.values(volumes).filter((v) => v > 0).length

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('studyZenModeTitle')}
      className="fixed inset-0 z-50 flex flex-col justify-between p-4 sm:p-8 bg-[#FAF6F0]/98 text-[#854D27] backdrop-blur-3xl select-none transition-colors duration-1000 overflow-hidden"
    >
      {/* 50% 速度の季節背景エフェクト（侘び寂びの静けさ） */}
      <div className="absolute inset-0 pointer-events-none opacity-35 filter blur-[0.3px]">
        <ThemeEffects effects={activeThemeConfig?.effects || []} active={true} />
      </div>

      {/* ヘッダー操作部 */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white border-2 border-[#D4B08C] shadow-[2px_2px_0_#D4B08C]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D95D39]" />
          <h1 className="text-xs sm:text-sm tracking-wider uppercase text-[#854D27] font-bold">
            {t('studyZenModeTitle')}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* テーマ切り替えメニュー */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowThemePicker(!showThemePicker)}
              aria-label={t('studyAmbientTheme')}
              className="p-2.5 rounded-xl bg-white hover:bg-[#FAF3EB] active:scale-95 text-[#854D27] border-2 border-[#D4B08C] shadow-[2px_2px_0_#D4B08C] transition-all"
            >
              <Palette size={16} />
            </button>

            {showThemePicker && (
              <div className="absolute right-0 mt-2 w-52 p-2 rounded-2xl bg-[#FFF9F3] border-2 border-[#D4B08C] shadow-[4px_4px_0_#D4B08C] z-20">
                <div className="text-[11px] text-[#854D27]/70 px-2.5 py-1.5 font-bold border-b border-[#D4B08C]/40 mb-1">
                  {t('studyAmbientTheme')}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setZenTheme('auto')
                    setShowThemePicker(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    zenTheme === 'auto'
                      ? 'bg-[#D95D39] text-white'
                      : 'text-[#854D27] hover:bg-[#FAF3EB]'
                  }`}
                >
                  {t('studyCurrentSeasonalTheme', { theme: globalTheme })}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZenTheme('tsukimi')
                    setShowThemePicker(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    zenTheme === 'tsukimi'
                      ? 'bg-[#D95D39] text-white'
                      : 'text-[#854D27] hover:bg-[#FAF3EB]'
                  }`}
                >
                  {t('studyThemeTsukimi')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZenTheme('hanami')
                    setShowThemePicker(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    zenTheme === 'hanami'
                      ? 'bg-[#D95D39] text-white'
                      : 'text-[#854D27] hover:bg-[#FAF3EB]'
                  }`}
                >
                  {t('studyThemeHanami')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZenTheme('winter')
                    setShowThemePicker(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    zenTheme === 'winter'
                      ? 'bg-[#D95D39] text-white'
                      : 'text-[#854D27] hover:bg-[#FAF3EB]'
                  }`}
                >
                  {t('studyThemeWinter')}
                </button>
              </div>
            )}
          </div>

          {/* フルスクリーン切り替え */}
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? t('studyExitFullscreen') : t('studyEnterFullscreen')}
            className="p-2.5 rounded-xl bg-white hover:bg-[#FAF3EB] active:scale-95 text-[#854D27] border-2 border-[#D4B08C] shadow-[2px_2px_0_#D4B08C] transition-all"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* 禅モード終了ボタン */}
          <button
            type="button"
            onClick={handleGuardedClose}
            aria-label={t('studyCloseZen')}
            className="p-2.5 rounded-xl bg-white hover:bg-rose-50 active:scale-95 text-[#854D27] hover:text-rose-700 border-2 border-[#D4B08C] hover:border-rose-400 shadow-[2px_2px_0_#D4B08C] transition-all"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* メイン中央: ポモドーロタイマーリング & 目標入力 */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-auto max-w-md mx-auto w-full">
        <PomodoroRing
          mode={pomodoro.mode}
          formattedTime={pomodoro.formattedTime}
          progressPercent={pomodoro.progressPercent}
          isRunning={pomodoro.isRunning}
          completedCycles={pomodoro.completedCycles}
          streakMinutes={pomodoro.streakMinutes}
          onStart={pomodoro.start}
          onPause={pomodoro.pause}
          onReset={pomodoro.reset}
          onSwitchMode={pomodoro.switchMode}
        />

        {/* 集中目標入力欄 */}
        <div className="w-full mt-6 px-4">
          <div className="relative flex items-center gap-2.5 p-2.5 rounded-2xl bg-white border-2 border-[#D4B08C] shadow-[2px_2px_0_#D4B08C]">
            <button
              type="button"
              onClick={() => setIsGoalCompleted(!isGoalCompleted)}
              className="p-1 rounded-lg text-[#854D27]/60 hover:text-[#D95D39] transition-colors"
              title="Toggle goal completed"
            >
              <CheckCircle2
                size={20}
                className={isGoalCompleted ? 'text-emerald-600' : 'text-[#854D27]/40'}
              />
            </button>
            <input
              type="text"
              value={focusGoal}
              onChange={(e) => setFocusGoal(e.target.value)}
              placeholder={t('studyGoalPlaceholder')}
              className={`w-full bg-transparent text-xs text-[#854D27] font-medium placeholder-[#854D27]/40 focus:outline-none transition-all ${
                isGoalCompleted ? 'line-through text-[#854D27]/40' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* フッター操作部: 楽曲 & 環境音ミキサー */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-white/95 border-2 border-[#D4B08C] shadow-[4px_4px_0_#D4B08C]">
        {/* トラック情報 */}
        <div className="flex items-center gap-3 min-w-0">
          {currentTrack ? (
            <div className="flex items-center gap-2 text-xs text-[#854D27] min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#D95D39] flex-shrink-0" />
              <span className="font-bold truncate max-w-[140px] sm:max-w-[240px]">
                {currentTrack.name}
              </span>
              <button
                type="button"
                onClick={() => setIsSoloMode(!isSoloMode)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors flex-shrink-0 border ${
                  isSoloMode
                    ? 'bg-[#D95D39] text-white border-[#D95D39]'
                    : 'bg-[#FAF3EB] text-[#854D27] border-[#D4B08C] hover:bg-[#F5EBE1]'
                }`}
              >
                {isSoloMode ? t('studySoloMuteRoom') : t('studyRoomBgm')}
              </button>
            </div>
          ) : (
            <div className="text-xs text-[#854D27]/70 font-medium flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#D95D39]" />
              <span>{t('studyDeepTranquility')}</span>
            </div>
          )}
        </div>

        {/* 環境音ミキサー起動ボタン */}
        <button
          type="button"
          onClick={() => setIsMixerOpen(true)}
          aria-label={t('studyAmbientSounds')}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#FFF9F3] hover:bg-[#FAF3EB] border-2 border-[#D4B08C] text-xs font-bold text-[#854D27] transition-all active:scale-95 shadow-[2px_2px_0_#D4B08C]"
        >
          <Sliders size={14} className={activeAmbientCount > 0 ? 'text-[#D95D39]' : ''} />
          <span>{t('studyAmbientSounds')}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#D95D39] text-white font-mono font-bold">
            {activeAmbientCount}
          </span>
        </button>
      </div>

      {/* 環境音ミキサーモーダル */}
      <AmbientMixerModal isOpen={isMixerOpen} onClose={() => setIsMixerOpen(false)} />
    </div>
  )
}
