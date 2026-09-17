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
  variant?: 'light' | 'zen'
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
  variant = 'light',
}: PomodoroRingProps) {
  const { t } = useLanguage()
  const isZen = variant === 'zen'

  const radius = isZen ? 140 : 130
  const strokeWidth = isZen ? 7 : 8
  const normalizedRadius = radius - strokeWidth * 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference

  // キーボードショートカット: Space（再生/一時停止）、'r'（リセット）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 入力欄でのタイピング時は無効化
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
      icon: BookOpen,
      presetLabel: t('studyPomodoro25m'),
    },
    short_break: {
      label: t('studyPomodoroShortBreak'),
      color: '#2E7D6F', // 水浅葱 (Mizuasagi 落ち着いた深緑)
      icon: Coffee,
      presetLabel: t('studyPomodoro5m'),
    },
    long_break: {
      label: t('studyPomodoroLongBreak'),
      color: '#4A6572', // 常磐藍 (Tokiwa 落ち着いた藍青)
      icon: Sparkles,
      presetLabel: t('studyPomodoro15m'),
    },
  }[mode]

  const CurrentIcon = modeConfig.icon

  return (
    <div className="flex flex-col items-center justify-center p-4 select-none max-w-sm mx-auto">
      {/* モード切り替えタブ */}
      <div
        className={`flex items-center gap-1.5 mb-7 p-1.5 rounded-full transition-colors ${
          isZen
            ? 'bg-stone-950/70 backdrop-blur-md border border-[#D4B08C]/35 shadow-lg'
            : 'bg-white border-2 border-[#D4B08C] shadow-[2px_2px_0_#D4B08C]'
        }`}
      >
        <button
          type="button"
          onClick={() => onSwitchMode('focus')}
          className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer ${
            mode === 'focus'
              ? isZen
                ? 'bg-[#D95D39] text-white shadow-md'
                : 'bg-[#D95D39] text-white border-2 border-[#854D27] shadow-[2px_2px_0_#854D27]'
              : isZen
                ? 'text-white/80 hover:bg-white/10 hover:text-white'
                : 'text-[#854D27] hover:bg-[#FAF3EB]'
          }`}
        >
          {t('studyPomodoro25m')}
        </button>
        <button
          type="button"
          onClick={() => onSwitchMode('short_break')}
          className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer ${
            mode === 'short_break'
              ? isZen
                ? 'bg-[#2E7D6F] text-white shadow-md'
                : 'bg-[#2E7D6F] text-white border-2 border-[#1E5249] shadow-[2px_2px_0_#1E5249]'
              : isZen
                ? 'text-white/80 hover:bg-white/10 hover:text-white'
                : 'text-[#854D27] hover:bg-[#FAF3EB]'
          }`}
        >
          {t('studyPomodoro5m')}
        </button>
        <button
          type="button"
          onClick={() => onSwitchMode('long_break')}
          className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer ${
            mode === 'long_break'
              ? isZen
                ? 'bg-[#4A6572] text-white shadow-md'
                : 'bg-[#4A6572] text-white border-2 border-[#2B3C44] shadow-[2px_2px_0_#2B3C44]'
              : isZen
                ? 'text-white/80 hover:bg-white/10 hover:text-white'
                : 'text-[#854D27] hover:bg-[#FAF3EB]'
          }`}
        >
          {t('studyPomodoro15m')}
        </button>
      </div>

      {/* SVG Ring */}
      <div className="relative flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
          {/* 背景トラック円 */}
          <circle
            stroke={isZen ? 'rgba(212, 176, 140, 0.22)' : '#EAD8C7'}
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* 進行プログレス円 */}
          <circle
            stroke={modeConfig.color}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.5s ease',
            }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>

        {/* 内側コンテンツ */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <div
            className={`flex items-center gap-1.5 text-xs font-bold mb-1 ${
              isZen ? 'text-[#FAF6F0] drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]' : 'text-[#854D27]'
            }`}
          >
            <CurrentIcon size={15} style={{ color: modeConfig.color }} />
            <span>{modeConfig.label}</span>
          </div>

          <div
            className={`text-5xl sm:text-6xl font-bold tracking-tight font-mono tabular-nums transition-transform duration-300 ${
              isRunning ? 'scale-105' : 'scale-100'
            } ${
              isZen ? 'text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]' : 'text-[#854D27]'
            }`}
          >
            {formattedTime}
          </div>

          <div
            className={`mt-2 text-[11px] font-mono font-bold ${
              isZen
                ? 'text-[#FAF6F0]/85 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]'
                : 'text-[#854D27]/75'
            }`}
          >
            {t('studyPomodoroCycle', { cycle: completedCycles + 1 })} • {streakMinutes}m {t('studyStreak')}
          </div>
        </div>
      </div>

      {/* 操作ボタン */}
      <div className="flex items-center gap-4 mt-7">
        <button
          type="button"
          onClick={isRunning ? onPause : onStart}
          aria-label={isRunning ? t('studyPomodoroPause') : t('studyPomodoroStart')}
          className={`flex items-center justify-center w-14 h-14 rounded-full active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer ${
            isZen
              ? 'bg-[#D95D39] hover:bg-[#C24E2B] text-white border-2 border-white/30 shadow-[0_4px_20px_rgba(217,93,57,0.45)]'
              : 'bg-[#D95D39] hover:bg-[#C24E2B] text-white border-2 border-[#854D27] shadow-[4px_4px_0_#854D27] active:shadow-none'
          }`}
        >
          {isRunning ? <Pause size={22} /> : <Play size={22} className="ml-1 text-white" />}
        </button>

        <button
          type="button"
          onClick={onReset}
          aria-label={t('studyPomodoroReset')}
          className={`flex items-center justify-center w-11 h-11 rounded-full active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer ${
            isZen
              ? 'bg-stone-950/60 hover:bg-stone-900/80 text-white border border-[#D4B08C]/30 shadow-md'
              : 'bg-white hover:bg-[#FAF3EB] text-[#854D27] border-2 border-[#D4B08C] shadow-[2px_2px_0_#D4B08C] active:shadow-none'
          }`}
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  )
}
