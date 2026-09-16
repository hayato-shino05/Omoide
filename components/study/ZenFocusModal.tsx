'use client'

import { useState, useEffect } from 'react'
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

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (typeof document === 'undefined') return
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  // Keyboard shortcut Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (!pomodoro.isRunning || confirm(t('studyExitZenConfirm'))) {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, pomodoro.isRunning, t])

  if (!isOpen) return null

  const activeAmbientCount = Object.values(volumes).filter((v) => v > 0).length

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('studyZenModeTitle')}
      className="fixed inset-0 z-50 flex flex-col justify-between p-4 sm:p-8 bg-[#121113]/95 text-stone-100 backdrop-blur-3xl select-none transition-colors duration-1000 overflow-hidden"
    >
      {/* 50% Slowed Tranquil Theme Effects */}
      <div className="absolute inset-0 pointer-events-none opacity-40 filter blur-[0.5px]">
        <ThemeEffects effects={activeThemeConfig?.effects || []} active={true} />
      </div>

      {/* Header Controls */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D95D39] shadow-[0_0_10px_#D95D39] animate-pulse" />
          <h1 className="text-xs sm:text-sm tracking-wider uppercase text-stone-300 font-medium">
            {t('studyZenModeTitle')}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Switcher Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowThemePicker(!showThemePicker)}
              aria-label={t('studyAmbientTheme')}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-stone-300 hover:text-white border border-white/10 backdrop-blur-md transition-all shadow-sm"
            >
              <Palette size={16} />
            </button>

            {showThemePicker && (
              <div className="absolute right-0 mt-2 w-52 p-2 rounded-2xl bg-stone-900/95 border border-white/15 shadow-2xl backdrop-blur-2xl z-20">
                <div className="text-[11px] text-stone-400 px-2.5 py-1.5 font-medium border-b border-white/5 mb-1">
                  {t('studyAmbientTheme')}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setZenTheme('auto')
                    setShowThemePicker(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    zenTheme === 'auto'
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                      : 'text-stone-300 hover:bg-white/5'
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
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    zenTheme === 'tsukimi'
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                      : 'text-stone-300 hover:bg-white/5'
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
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    zenTheme === 'hanami'
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                      : 'text-stone-300 hover:bg-white/5'
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
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    zenTheme === 'winter'
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                      : 'text-stone-300 hover:bg-white/5'
                  }`}
                >
                  {t('studyThemeWinter')}
                </button>
              </div>
            )}
          </div>

          {/* Fullscreen button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? t('studyExitFullscreen') : t('studyEnterFullscreen')}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-stone-300 hover:text-white border border-white/10 backdrop-blur-md transition-all shadow-sm"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label={t('studyCloseZen')}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 active:scale-95 text-stone-300 hover:text-rose-200 border border-white/10 hover:border-rose-500/30 backdrop-blur-md transition-all shadow-sm"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Center Area: Pomodoro Ring & Goal */}
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

        {/* Mini Focus Goal Input */}
        <div className="w-full mt-6 px-4">
          <div className="relative flex items-center gap-2 p-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-inner">
            <button
              type="button"
              onClick={() => setIsGoalCompleted(!isGoalCompleted)}
              className="p-1 rounded-lg text-stone-400 hover:text-emerald-400 transition-colors"
              title="Toggle goal completed"
            >
              <CheckCircle2
                size={18}
                className={isGoalCompleted ? 'text-emerald-400' : 'text-stone-500'}
              />
            </button>
            <input
              type="text"
              value={focusGoal}
              onChange={(e) => setFocusGoal(e.target.value)}
              placeholder={t('studyGoalPlaceholder')}
              className={`w-full bg-transparent text-xs text-stone-100 placeholder-stone-500 focus:outline-none transition-all ${
                isGoalCompleted ? 'line-through text-stone-500' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* Footer Ambient & BGM Controls */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-stone-900/60 border border-white/10 backdrop-blur-xl shadow-lg">
        {/* Track info or Ambient info */}
        <div className="flex items-center gap-3 min-w-0">
          {currentTrack ? (
            <div className="flex items-center gap-2 text-xs text-stone-300 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#D95D39] flex-shrink-0" />
              <span className="font-medium truncate max-w-[140px] sm:max-w-[240px]">
                {currentTrack.name}
              </span>
              <button
                type="button"
                onClick={() => setIsSoloMode(!isSoloMode)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors flex-shrink-0 ${
                  isSoloMode
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-white/10 text-stone-300 hover:text-white'
                }`}
              >
                {isSoloMode ? t('studySoloMuteRoom') : t('studyRoomBgm')}
              </button>
            </div>
          ) : (
            <div className="text-xs text-stone-400 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-400" />
              <span>{t('studyDeepTranquility')}</span>
            </div>
          )}
        </div>

        {/* Ambient Sound Trigger */}
        <button
          type="button"
          onClick={() => setIsMixerOpen(true)}
          aria-label={t('studyAmbientSounds')}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-stone-300 hover:text-white transition-all active:scale-95 shadow-sm"
        >
          <Sliders size={14} className={activeAmbientCount > 0 ? 'text-emerald-400' : ''} />
          <span>{t('studyAmbientSounds')}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 font-mono font-bold">
            {activeAmbientCount}
          </span>
        </button>
      </div>

      {/* Ambient Mixer Modal */}
      <AmbientMixerModal isOpen={isMixerOpen} onClose={() => setIsMixerOpen(false)} />
    </div>
  )
}

