'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Maximize2,
  Minimize2,
  X,
  Palette,
  Sliders,
  Sparkles,
  CheckCircle2,
  Check,
  Play,
  Pause,
  RotateCcw,
  Music,
  Timer,
} from 'lucide-react'
import { PomodoroRing } from './PomodoroRing'
import { usePomodoro } from '@/lib/hooks/usePomodoro'
import { VideoBackground } from '@/components/effects/VideoBackground'
import { ThemeEffects } from '@/components/effects/ThemeEffects'
import { THEMES } from '@/config/themes'
import { VISUAL_THEME_KEYS } from '@/config/visualThemes'
import { useTheme } from '@/lib/hooks/useTheme'
import { useStudyRoomStore } from '@/lib/stores/studyRoomStore'
import { useAmbientSoundStore } from '@/lib/stores/ambientSoundStore'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { AmbientMixerModal } from './AmbientMixerModal'
import { PomodoroSettingsModal } from './PomodoroSettingsModal'
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
  const { t, language } = useLanguage()

  const [zenTheme, setZenTheme] = useState<ThemeName | 'auto'>('auto')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMixerOpen, setIsMixerOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showThemePicker, setShowThemePicker] = useState(false)
  const [focusGoal, setFocusGoal] = useState('')
  const [isGoalCompleted, setIsGoalCompleted] = useState(false)
  const [isControlsVisible, setIsControlsVisible] = useState(true)
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)

  // モーダル再表示時にコントロールの表示状態を初期化
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setIsControlsVisible(true)
    }
  }

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isInteractingRef = useRef(false)

  const activeThemeName = zenTheme === 'auto' ? globalTheme : zenTheme
  const activeThemeConfig = THEMES[activeThemeName] || globalThemeConfig

  const pomodoro = usePomodoro((mode, streak) => {
    onCycleComplete?.(mode, streak)
  })

  // 3.5秒無操作時の自動非表示タイマー
  useEffect(() => {
    if (!isOpen) return

    // モーダルオープン時のインタラクション状態初期化
    isInteractingRef.current = false

    const clearTimer = () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
        idleTimerRef.current = null
      }
    }

    const startIdleTimer = () => {
      clearTimer()
      if (!isInteractingRef.current) {
        idleTimerRef.current = setTimeout(() => {
          setIsControlsVisible(false)
        }, 3500)
      }
    }

    const handleActivity = () => {
      setIsControlsVisible(true)
      startIdleTimer()
    }

    startIdleTimer()

    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('mousedown', handleActivity)
    window.addEventListener('touchstart', handleActivity)
    window.addEventListener('keydown', handleActivity)

    return () => {
      clearTimer()
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('mousedown', handleActivity)
      window.removeEventListener('touchstart', handleActivity)
      window.removeEventListener('keydown', handleActivity)
    }
  }, [isOpen])

  // 全画面表示の切り替えとイベント監視
  const toggleFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {})
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {})
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // セッション実行中の誤終了防止ガード
  const handleGuardedClose = useCallback(() => {
    if (!pomodoro.isRunning || confirm(t('studyExitZenConfirm'))) {
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {})
      }
      onClose()
    }
  }, [pomodoro.isRunning, onClose, t])

  // キーボードショートカット（F: 全画面 / Esc: 終了ガード）
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)

      if (e.key === 'Escape') {
        if (isSettingsOpen) {
          setIsSettingsOpen(false)
          return
        }
        if (isMixerOpen) {
          setIsMixerOpen(false)
          return
        }
        if (showThemePicker) {
          setShowThemePicker(false)
          return
        }
        handleGuardedClose()
      } else if ((e.key === 'f' || e.key === 'F') && !isInput) {
        e.preventDefault()
        toggleFullscreen()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSettingsOpen, isMixerOpen, showThemePicker, handleGuardedClose, toggleFullscreen])

  if (!isOpen) return null

  const controlsVisible = isControlsVisible || isMixerOpen || isSettingsOpen || showThemePicker
  const activeAmbientCount = Object.values(volumes).filter((v) => v > 0).length
  const themeDisplayName =
    language === 'ja'
      ? activeThemeConfig?.displayName?.ja || activeThemeName
      : activeThemeConfig?.displayName?.en || activeThemeName

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('studyZenModeTitle')}
      style={{ zIndex: 1200 }}
      className={`fixed inset-0 z-[1200] overflow-hidden bg-black text-[#FFF9F3] flex flex-col justify-between select-none ${
        controlsVisible ? 'cursor-default' : 'cursor-none'
      }`}
    >
      {/* 1. 全面ビデオ背景 */}
      <VideoBackground
        videoUrl={activeThemeConfig?.videoUrl}
        youtubeId={activeThemeConfig?.youtubeId}
        fallbackUrl={activeThemeConfig?.fallbackVideoUrl}
        videoDuration={activeThemeConfig?.videoDuration}
        opacity={0.88}
        syncToServerTime={false}
        active={isOpen}
      />

      {/* 2. テーマ固有の環境光・アンビエントカラーオーバーレイ（季節ごとの固有色を反映） */}
      <div
        className="absolute inset-0 pointer-events-none z-[1] transition-all duration-1000"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${activeThemeConfig?.colors.primary || '#D95D39'}25 0%, ${activeThemeConfig?.colors.secondary || '#D4B08C'}18 60%, transparent 100%)`,
          mixBlendMode: 'screen',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-black/70 pointer-events-none z-[1]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.40)_100%)] pointer-events-none z-[1]" />

      {/* 3. 季節の環境パーティクル効果 */}
      <div className="absolute inset-0 pointer-events-none z-[2] opacity-50 filter blur-[0.2px]">
        <ThemeEffects effects={activeThemeConfig?.effects || []} active={isOpen} />
      </div>

      {/* 4. トップヘッダーバー */}
      <div
        className={`relative z-10 flex items-center justify-between p-4 sm:p-6 transition-all duration-700 ${
          controlsVisible
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        {/* 禅モードバッジ & 現在のテーマ表示 */}
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-stone-950/75 backdrop-blur-md border border-[#D4B08C]/35 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-[#D95D39]" />
          <h1 className="text-xs font-bold tracking-widest uppercase text-[#FFF9F3] font-heading">
            {t('studyZenModeTitle')}
          </h1>
          <span className="text-xs text-[#D4B08C]/60">•</span>
          <span className="text-xs text-[#FAF6F0]/90 font-medium">{themeDisplayName}</span>
        </div>

        {/* 部屋のBGM & ソロ消音トグル */}
        <div className="flex items-center gap-2">
          {currentTrack && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-950/75 backdrop-blur-md border border-[#D4B08C]/35 text-xs text-[#FFF9F3] shadow-lg">
              <Music size={13} className="text-[#D95D39]" />
              <span className="font-medium truncate max-w-[160px]">{currentTrack.name}</span>
              <button
                type="button"
                onClick={() => setIsSoloMode(!isSoloMode)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors border cursor-pointer ${
                  isSoloMode
                    ? 'bg-[#D95D39] text-white border-[#D95D39]'
                    : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
                }`}
              >
                {isSoloMode ? t('studySoloMuteRoom') : t('studyRoomBgm')}
              </button>
            </div>
          )}

          {/* クイック終了ボタン（視認性と操作性を最大化） */}
          <button
            type="button"
            onClick={handleGuardedClose}
            aria-label={t('studyCloseZen')}
            title={`${t('studyCloseZen')} (Esc)`}
            className="h-11 min-h-[44px] px-3.5 sm:px-4 flex items-center gap-2 rounded-full bg-stone-950/90 backdrop-blur-md border border-[#D4B08C]/60 text-[#FFF9F3] hover:text-white hover:bg-rose-500/30 hover:border-rose-400/80 active:scale-95 transition-all shadow-xl cursor-pointer font-bold text-xs"
          >
            <X size={18} className="text-rose-400" />
            <span className="tracking-wider">{t('studyCloseZen')}</span>
            <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-[#D4B08C] font-mono border border-white/10">
              Esc
            </kbd>
          </button>
        </div>
      </div>

      {/* 5. 中央コンテンツ: ポモドーロ時計 & 目標入力 */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-auto w-full max-w-md mx-auto px-4">
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
          durations={pomodoro.durations}
          onOpenSettings={() => setIsSettingsOpen(true)}
          variant="zen"
        />

        {/* 集中目標入力ピル */}
        <div
          className={`w-full max-w-xs sm:max-w-sm mt-3 transition-all duration-700 ${
            controlsVisible
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-3 pointer-events-none'
          }`}
        >
          <div className="relative flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-stone-950/75 backdrop-blur-md border border-[#D4B08C]/35 text-[#FFF9F3] shadow-xl">
            <button
              type="button"
              onClick={() => setIsGoalCompleted(!isGoalCompleted)}
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-white/60 hover:text-[#D95D39] transition-colors cursor-pointer"
              title="Toggle goal completed"
              aria-label="Toggle goal completed"
              aria-pressed={isGoalCompleted}
            >
              <CheckCircle2
                size={19}
                className={isGoalCompleted ? 'text-emerald-400' : 'text-white/40'}
              />
            </button>
            <input
              type="text"
              value={focusGoal}
              onChange={(e) => setFocusGoal(e.target.value)}
              onFocus={() => {
                isInteractingRef.current = true
                if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
              }}
              onBlur={() => {
                isInteractingRef.current = false
                if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
                idleTimerRef.current = setTimeout(() => {
                  setIsControlsVisible(false)
                }, 3500)
              }}
              placeholder={t('studyGoalPlaceholder')}
              className={`w-full bg-transparent text-xs text-[#FAF6F0] font-medium placeholder-white/40 focus:outline-none transition-all ${
                isGoalCompleted ? 'line-through text-white/40' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* 6. フローティングボトムドック（常時表示される音楽プレイヤーと干渉しないよう下部に余白を確保） */}
      <div
        className={`relative z-20 flex items-center justify-center p-4 sm:p-6 mb-24 md:mb-28 transition-all duration-700 ${
          controlsVisible
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
        onMouseEnter={() => {
          isInteractingRef.current = true
          if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
        }}
        onMouseLeave={() => {
          isInteractingRef.current = false
          if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
          idleTimerRef.current = setTimeout(() => {
            setIsControlsVisible(false)
          }, 3500)
        }}
      >
        <div className="relative flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-stone-950/80 backdrop-blur-xl border border-[#D4B08C]/40 text-[#FFF9F3] shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
          {/* ポモドーロ 再生/一時停止 */}
          <button
            type="button"
            onClick={pomodoro.isRunning ? pomodoro.pause : pomodoro.start}
            aria-label={pomodoro.isRunning ? t('studyPomodoroPause') : t('studyPomodoroStart')}
            className="flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#D95D39] hover:bg-[#C24E2B] text-white shadow-md active:scale-95 transition-all cursor-pointer"
          >
            {pomodoro.isRunning ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>

          {/* ポモドーロ リセット */}
          <button
            type="button"
            onClick={pomodoro.reset}
            title={t('studyPomodoroReset')}
            aria-label={t('studyPomodoroReset')}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-white/15 text-white/80 hover:text-white active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw size={17} />
          </button>

          <div className="w-[1px] h-5 bg-white/20 mx-0.5" />

          {/* タイマー時間設定モーダル */}
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={isSettingsOpen}
            onClick={() => {
              setIsSettingsOpen(true)
              setShowThemePicker(false)
              setIsMixerOpen(false)
            }}
            title={t('studyPomodoroSettings')}
            aria-label={t('studyPomodoroSettings')}
            className={`w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-all cursor-pointer active:scale-95 ${
              isSettingsOpen
                ? 'bg-white/25 text-white'
                : 'hover:bg-white/15 text-white/80 hover:text-white'
            }`}
          >
            <Timer size={17} />
          </button>

          {/* 環境テーマ選択ポップオーバー */}
          <div className="relative">
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={showThemePicker}
              aria-controls="zen-theme-picker-dialog"
              onClick={() => {
                setShowThemePicker(!showThemePicker)
                setIsControlsVisible(true)
                setIsSettingsOpen(false)
              }}
              title={t('studyAmbientTheme')}
              aria-label={t('studyAmbientTheme')}
              className={`w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-all cursor-pointer active:scale-95 ${
                showThemePicker
                  ? 'bg-white/25 text-white'
                  : 'hover:bg-white/15 text-white/80 hover:text-white'
              }`}
            >
              <Palette size={17} />
            </button>

            {showThemePicker && (
              <div
                id="zen-theme-picker-dialog"
                role="dialog"
                aria-modal="false"
                aria-label={t('studyAmbientTheme')}
                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-64 max-h-72 overflow-y-auto p-2 rounded-2xl bg-stone-950/95 backdrop-blur-2xl border border-[#D4B08C]/40 shadow-2xl z-30 space-y-1"
                onMouseEnter={() => {
                  isInteractingRef.current = true
                  if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
                }}
              >
                <div className="text-[11px] text-[#D4B08C] px-3 py-1.5 font-bold border-b border-white/10 flex items-center justify-between">
                  <span>{t('studyAmbientTheme')}</span>
                  <Sparkles size={12} className="text-[#D95D39]" />
                </div>

                {/* 自動 / グローバルテーマ */}
                <button
                  type="button"
                  onClick={() => {
                    setZenTheme('auto')
                    setShowThemePicker(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer min-h-[40px] ${
                    zenTheme === 'auto'
                      ? 'bg-[#D95D39] text-white shadow-xs'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{t('studyCurrentSeasonalTheme', { theme: globalTheme })}</span>
                  {zenTheme === 'auto' && <Check size={14} />}
                </button>

                {/* 季節のビデオテーマ一覧 */}
                {VISUAL_THEME_KEYS.map((key) => {
                  const cfg = THEMES[key]
                  if (!cfg) return null
                  const isSelected = zenTheme === key
                  const name = language === 'ja' ? cfg.displayName.ja : cfg.displayName.en
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setZenTheme(key as ThemeName)
                        setShowThemePicker(false)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer min-h-[40px] ${
                        isSelected
                          ? 'bg-[#D95D39] text-white shadow-xs'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-white/30"
                          style={{ backgroundColor: cfg.colors.primary }}
                        />
                        <span>{name}</span>
                      </div>
                      {isSelected && <Check size={14} />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* 自然環境音ミキサートグル */}
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={isMixerOpen}
            onClick={() => {
              setIsMixerOpen(true)
              setShowThemePicker(false)
              setIsSettingsOpen(false)
            }}
            title={t('studyAmbientSounds')}
            aria-label={t('studyAmbientSounds')}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-white/15 text-white/80 hover:text-white active:scale-95 transition-all relative cursor-pointer"
          >
            <Sliders size={17} className={activeAmbientCount > 0 ? 'text-[#D95D39]' : ''} />
            {activeAmbientCount > 0 && (
              <span className="absolute 1.5 -top-0.5 right-1 w-4 h-4 rounded-full bg-[#D95D39] text-white text-[10px] font-mono font-bold flex items-center justify-center">
                {activeAmbientCount}
              </span>
            )}
          </button>

          <div className="w-[1px] h-5 bg-white/20 mx-0.5" />

          {/* 全画面表示切り替え */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? t('studyExitFullscreen') : t('studyEnterFullscreen')}
            aria-label={isFullscreen ? t('studyExitFullscreen') : t('studyEnterFullscreen')}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-white/15 text-white/80 hover:text-white active:scale-95 transition-all cursor-pointer"
          >
            {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </button>

          {/* 禅モード終了 */}
          <button
            type="button"
            onClick={handleGuardedClose}
            title={t('studyCloseZen')}
            aria-label={t('studyCloseZen')}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-rose-500/20 text-white/80 hover:text-rose-300 active:scale-95 transition-all cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>
      </div>

      {/* 7. 自然環境音ミキサーモーダル */}
      <AmbientMixerModal isOpen={isMixerOpen} onClose={() => setIsMixerOpen(false)} />

      {/* 8. ポモドーロカスタム時間設定モーダル */}
      <PomodoroSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentDurations={pomodoro.durations}
        onSave={pomodoro.updateDurations}
        onResetDefaults={pomodoro.resetToDefaults}
      />
    </div>
  )
}
