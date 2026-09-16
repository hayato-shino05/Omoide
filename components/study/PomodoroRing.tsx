'use client'

import { Play, Pause, RotateCcw, Coffee, Sparkles, BookOpen } from 'lucide-react'
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
  const radius = 120
  const strokeWidth = 8
  const normalizedRadius = radius - strokeWidth * 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference

  const modeConfig = {
    focus: {
      label: 'Focus Time / 集中',
      color: '#F472B6', // Sắc hồng anh đào nhẹ
      glowColor: 'rgba(244, 114, 182, 0.3)',
      icon: BookOpen,
    },
    short_break: {
      label: 'Short Break / ひと息',
      color: '#38BDF8', // Sắc lam nhạt
      glowColor: 'rgba(56, 189, 248, 0.3)',
      icon: Coffee,
    },
    long_break: {
      label: 'Long Break / 休息',
      color: '#34D399', // Sắc xanh ngọc
      glowColor: 'rgba(52, 211, 153, 0.3)',
      icon: Sparkles,
    },
  }[mode]

  const CurrentIcon = modeConfig.icon

  return (
    <div className="flex flex-col items-center justify-center p-6 select-none">
      {/* Tab chuyển mode tối giản */}
      <div className="flex items-center gap-2 mb-6 p-1.5 rounded-full bg-stone-900/40 backdrop-blur-md border border-white/10">
        <button
          type="button"
          onClick={() => onSwitchMode('focus')}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
            mode === 'focus'
              ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          25m Focus
        </button>
        <button
          type="button"
          onClick={() => onSwitchMode('short_break')}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
            mode === 'short_break'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          5m Break
        </button>
        <button
          type="button"
          onClick={() => onSwitchMode('long_break')}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
            mode === 'long_break'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          15m Rest
        </button>
      </div>

      {/* SVG Ring */}
      <div className="relative flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
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
              transition: 'stroke-dashoffset 0.8s ease-in-out, stroke 0.5s ease',
              filter: `drop-shadow(0 0 12px ${modeConfig.glowColor})`,
            }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>

        {/* Nội dung tâm vòng tròn */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1.5 text-xs text-stone-300/80 mb-1">
            <CurrentIcon size={14} style={{ color: modeConfig.color }} />
            <span>{modeConfig.label}</span>
          </div>

          <div
            className="text-4xl sm:text-5xl font-light tracking-tight text-stone-100 font-mono"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
          >
            {formattedTime}
          </div>

          <div className="mt-2 text-[11px] text-stone-400/80">
            Cycle #{completedCycles + 1} • {streakMinutes}m Streak
          </div>
        </div>
      </div>

      {/* Nút điều khiển */}
      <div className="flex items-center gap-4 mt-6">
        <button
          type="button"
          onClick={isRunning ? onPause : onStart}
          aria-label={isRunning ? 'Pause Pomodoro' : 'Start Pomodoro'}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-stone-100 border border-white/20 backdrop-blur-md transition-all shadow-lg"
        >
          {isRunning ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={onReset}
          aria-label="Reset Pomodoro"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 text-stone-400 hover:text-stone-200 border border-white/10 backdrop-blur-sm transition-all"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  )
}
