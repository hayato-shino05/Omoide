'use client'

import { useEffect } from 'react'
import { Play, Pause, RotateCcw, Coffee, Sparkles, BookOpen } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { PomodoroMode } from '@/types/study'

interface PomodoroRingProps {
  mode: PomodoroMode
  formattedTime: string
  progressPercent: number
  isRunning: boolean
  completedCycles: number
  streakMinutes: number
  onStart: () => void
  onPause: () => void
  onReset: () => void
  onSwitchMode: (mode: PomodoroMode) => void
}

export function PomodoroRing({
  mode,
  formattedTime,
  progressPercent,
  isRunning,
  completedCycles,
  streakMinutes,
  onStart,
  onPause,
  onReset,
  onSwitchMode,
}: PomodoroRingProps) {
  const { t } = useLanguage()

  const radius = 130
  const strokeWidth = 7
  const normalizedRadius = radius - strokeWidth * 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference

  // Keyboard shortcut: Space (Start/Pause), 'r' (Reset)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua nếu đang gõ trong input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return
      if (e.code === 'Space') {
        e.preventDefault()
        if (isRunning) onPause()
        else onStart()
      } else if (e.key === 'r' || e.key === 'R') {
        onReset()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRunning, onStart, onPause, onReset])

  const modeConfig = {
    focus: {
      label: t('studyPomodoroFocus'),
      color: '#D95D39', // 弁柄色 (Bengara 赤朱色)
      glowColor: 'rgba(217, 93, 57, 0.4)',
      icon: BookOpen,
      presetLabel: t('studyPomodoro25m'),
    },
    short_break: {
      label: t('studyPomodoroShortBreak'),
      color: '#38BDF8', // 水浅葱・空色 (Mizuasagi)
      glowColor: 'rgba(56, 189, 248, 0.4)',
      icon: Coffee,
      presetLabel: t('studyPomodoro5m'),
    },
    long_break: {
      label: t('studyPomodoroLongBreak'),
      color: '#34D399', // 常磐色・若竹色 (Tokiwa)
      glowColor: 'rgba(52, 211, 153, 0.4)',
      icon: Sparkles,
      presetLabel: t('studyPomodoro15m'),
    },
  }[mode]

  const CurrentIcon = modeConfig.icon

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 select-none max-w-sm mx-auto">
      {/* Tab chuyển mode tối giản Wabi-sabi */}
      <div className="flex items-center gap-1.5 mb-7 p-1.5 rounded-full bg-stone-900/60 backdrop-blur-xl border border-white/10 shadow-lg">
        <button
          type="button"
          onClick={() => onSwitchMode('focus')}
          className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
            mode === 'focus'
              ? 'bg-[#D95D39]/25 text-amber-200 border border-[#D95D39]/50 shadow-[0_0_12px_rgba(217,93,57,0.3)]'
              : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
          }`}
        >
          {t('studyPomodoro25m')}
        </button>
        <button
          type="button"
          onClick={() => onSwitchMode('short_break')}
          className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
            mode === 'short_break'
              ? 'bg-sky-500/25 text-sky-200 border border-sky-500/50 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
              : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
          }`}
        >
          {t('studyPomodoro5m')}
        </button>
        <button
          type="button"
          onClick={() => onSwitchMode('long_break')}
          className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
            mode === 'long_break'
              ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-500/50 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
              : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
          }`}
        >
          {t('studyPomodoro15m')}
        </button>
      </div>

      {/* SVG Ring với Breathing Glow */}
      <div className="relative flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg] drop-shadow-2xl">
          {/* Background track circle */}
          <circle
            stroke="rgba(255, 255, 255, 0.08)"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress stroke */}
          <circle
            stroke={modeConfig.color}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.5s ease',
              filter: `drop-shadow(0 0 16px ${modeConfig.glowColor})`,
            }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>

        {/* Nội dung tâm vòng tròn */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1.5 text-xs text-stone-300 font-medium mb-1">
            <CurrentIcon size={14} style={{ color: modeConfig.color }} />
            <span>{modeConfig.label}</span>
          </div>

          <div
            className={`text-5xl sm:text-6xl font-light tracking-tight text-white font-mono tabular-nums transition-transform duration-300 ${
              isRunning ? 'scale-105' : 'scale-100'
            }`}
            style={{ textShadow: '0 2px 14px rgba(0,0,0,0.6)' }}
          >
            {formattedTime}
          </div>

          <div className="mt-2 text-[11px] text-stone-400 font-mono">
            {t('studyPomodoroCycle', { cycle: completedCycles + 1 })} • {streakMinutes}m {t('studyStreak')}
          </div>
        </div>
      </div>

      {/* Nút điều khiển */}
      <div className="flex items-center gap-4 mt-7">
        <button
          type="button"
          onClick={isRunning ? onPause : onStart}
          aria-label={isRunning ? t('studyPomodoroPause') : t('studyPomodoroStart')}
          className={`flex items-center justify-center w-14 h-14 rounded-full border active:scale-95 transition-all shadow-[0_8px_25px_rgba(0,0,0,0.4)] ${
            isRunning
              ? 'bg-[#D95D39]/20 text-[#D95D39] border-[#D95D39]/50 hover:bg-[#D95D39]/30'
              : 'bg-white/10 hover:bg-white/20 text-white border-white/25 hover:border-white/40'
          }`}
        >
          {isRunning ? <Pause size={22} /> : <Play size={22} className="ml-1 text-white" />}
        </button>

        <button
          type="button"
          onClick={onReset}
          aria-label={t('studyPomodoroReset')}
          className="flex items-center justify-center w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 text-stone-400 hover:text-stone-100 border border-white/10 backdrop-blur-sm transition-all shadow-sm"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  )
}

