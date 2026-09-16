'use client'

import { useState, useEffect } from 'react'
import {
  Maximize2,
  Minimize2,
  X,
  Palette,
  Sliders,
  Sparkles,
} from 'lucide-react'
import { PomodoroRing } from './PomodoroRing'
import { usePomodoro } from '@/lib/hooks/usePomodoro'
import { ThemeEffects } from '@/components/effects/ThemeEffects'
import { THEMES } from '@/config/themes'
import { useTheme } from '@/lib/hooks/useTheme'
import { useStudyRoomStore } from '@/lib/stores/studyRoomStore'
import { useAmbientSoundStore } from '@/lib/stores/ambientSoundStore'
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

  const [zenTheme, setZenTheme] = useState<ThemeName | 'auto'>('auto')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMixerOpen, setIsMixerOpen] = useState(false)
  const [showThemePicker, setShowThemePicker] = useState(false)

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
        if (!pomodoro.isRunning || confirm('Exit Zen Focus Mode? / 集中モードを終了しますか？')) {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, pomodoro.isRunning])

  if (!isOpen) return null

  const activeAmbientCount = Object.values(volumes).filter((v) => v > 0).length

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Zen Focus Mode"
      className="fixed inset-0 z-50 flex flex-col justify-between p-4 sm:p-8 bg-stone-950/95 text-stone-100 backdrop-blur-2xl select-none transition-colors duration-1000 overflow-hidden"
    >
      {/* 50% Slowed Tranquil Theme Effects */}
      <div className="absolute inset-0 pointer-events-none opacity-60 filter blur-[0.5px]">
        <ThemeEffects effects={activeThemeConfig?.effects || []} active={true} />
      </div>

      {/* Header Controls */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-400 animate-pulse" />
          <span className="text-xs tracking-wider uppercase text-stone-300 font-medium">
            Zen Focus Mode / 禅・集中空間
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Switcher Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowThemePicker(!showThemePicker)}
              aria-label="Change Ambient Theme"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-stone-300 border border-white/10 backdrop-blur-md transition-all"
            >
              <Palette size={16} />
            </button>

            {showThemePicker && (
              <div className="absolute right-0 mt-2 w-48 p-2 rounded-2xl bg-stone-900/95 border border-white/10 shadow-2xl backdrop-blur-xl z-20">
                <div className="text-[11px] text-stone-200 px-2 py-1 font-medium">Ambient Theme</div>
                <button
                  type="button"
                  onClick={() => {
                    setZenTheme('auto')
                    setShowThemePicker(false)
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    zenTheme === 'auto' ? 'bg-pink-500/20 text-pink-200' : 'text-stone-200 hover:bg-white/5'
                  }`}
                >
                  Current Seasonal ({globalTheme})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZenTheme('tsukimi')
                    setShowThemePicker(false)
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    zenTheme === 'tsukimi' ? 'bg-pink-500/20 text-pink-200' : 'text-stone-200 hover:bg-white/5'
                  }`}
                >
                  Tsukimi Moon / 月見
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZenTheme('hanami')
                    setShowThemePicker(false)
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    zenTheme === 'hanami' ? 'bg-pink-500/20 text-pink-200' : 'text-stone-200 hover:bg-white/5'
                  }`}
                >
                  Cherry Blossoms / 花見
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZenTheme('winter')
                    setShowThemePicker(false)
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    zenTheme === 'winter' ? 'bg-pink-500/20 text-pink-200' : 'text-stone-200 hover:bg-white/5'
                  }`}
                >
                  Falling Snow / 雪景
                </button>
              </div>
            )}
          </div>

          {/* Fullscreen button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-stone-300 border border-white/10 backdrop-blur-md transition-all"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Zen Mode"
            className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 active:scale-95 text-stone-300 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 backdrop-blur-md transition-all"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Center Area: Pomodoro Ring */}
      <div className="relative z-10 flex-1 flex items-center justify-center my-auto">
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
      </div>

      {/* Footer Ambient & BGM Controls */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-stone-900/40 border border-white/5 backdrop-blur-md">
        {/* Track info or Ambient info */}
        <div className="flex items-center gap-3">
          {currentTrack ? (
            <div className="flex items-center gap-2 text-xs text-stone-300">
              <span className="w-2 h-2 rounded-full bg-pink-400" />
              <span className="font-medium truncate max-w-[150px] sm:max-w-[250px]">
                {currentTrack.name}
              </span>
              <button
                type="button"
                onClick={() => setIsSoloMode(!isSoloMode)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  isSoloMode ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-stone-400 hover:text-stone-200'
                }`}
              >
                {isSoloMode ? 'Muted Room' : 'Room BGM'}
              </button>
            </div>
          ) : (
            <div className="text-xs text-stone-400 flex items-center gap-1.5">
              <Sparkles size={14} className="text-pink-400" />
              <span>Deep Tranquility / 静寂</span>
            </div>
          )}
        </div>

        {/* Ambient Sound Trigger */}
        <button
          type="button"
          onClick={() => setIsMixerOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-stone-300 transition-all"
        >
          <Sliders size={14} className="text-emerald-400" />
          <span>Ambient Mixer ({activeAmbientCount})</span>
        </button>
      </div>

      {/* Ambient Mixer Modal */}
      <AmbientMixerModal isOpen={isMixerOpen} onClose={() => setIsMixerOpen(false)} />
    </div>
  )
}
