'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  type PomodoroMode,
  type PomodoroDurations,
  DEFAULT_POMODORO_DURATIONS,
  POMODORO_PRESETS,
} from '@/types/study'

const STORAGE_KEY = 'omoide_pomodoro_durations'

function getInitialDurations(): PomodoroDurations {
  if (typeof window === 'undefined') return DEFAULT_POMODORO_DURATIONS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_POMODORO_DURATIONS
    const parsed = JSON.parse(raw) as Partial<PomodoroDurations>
    return {
      focus:
        Number.isFinite(parsed.focus) && parsed.focus! >= 1 && parsed.focus! <= 180
          ? parsed.focus!
          : DEFAULT_POMODORO_DURATIONS.focus,
      short_break:
        Number.isFinite(parsed.short_break) && parsed.short_break! >= 1 && parsed.short_break! <= 60
          ? parsed.short_break!
          : DEFAULT_POMODORO_DURATIONS.short_break,
      long_break:
        Number.isFinite(parsed.long_break) && parsed.long_break! >= 1 && parsed.long_break! <= 90
          ? parsed.long_break!
          : DEFAULT_POMODORO_DURATIONS.long_break,
    }
  } catch {
    return DEFAULT_POMODORO_DURATIONS
  }
}

export function usePomodoro(onCycleComplete?: (mode: PomodoroMode, streakMinutes: number) => void) {
  const [durations, setDurations] = useState<PomodoroDurations>(getInitialDurations)
  const [mode, setMode] = useState<PomodoroMode>('focus')
  const [timeLeft, setTimeLeft] = useState<number>(() => getInitialDurations().focus * 60)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [completedCycles, setCompletedCycles] = useState<number>(0)
  const [streakMinutes, setStreakMinutes] = useState<number>(0)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const targetEndTimeRef = useRef<number | null>(null)
  const onCycleCompleteRef = useRef(onCycleComplete)
  const durationsRef = useRef(durations)

  useEffect(() => {
    durationsRef.current = durations
  }, [durations])

  useEffect(() => {
    onCycleCompleteRef.current = onCycleComplete
  }, [onCycleComplete])

  // 完了通知の風鈴音再生（528Hz ソルフェジオ周波数）
  const playChime = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioCtxClass) return
      const audioCtx = new AudioCtxClass()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(528, audioCtx.currentTime)
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.5)

      osc.connect(gain)
      gain.connect(audioCtx.destination)

      osc.onended = () => {
        audioCtx.close().catch(() => {})
      }

      osc.start()
      osc.stop(audioCtx.currentTime + 2.5)
    } catch (e) {
      console.warn('[Pomodoro] AudioContext chime failed:', e)
    }
  }, [])

  // サイクル完了処理とストリーク加算
  const handleCycleFinished = useCallback(() => {
    playChime()
    setIsRunning(false)
    targetEndTimeRef.current = null

    const currentDurations = durationsRef.current
    let nextMode: PomodoroMode = 'short_break'
    let nextCompleted = completedCycles
    let nextStreak = streakMinutes

    if (mode === 'focus') {
      nextCompleted = completedCycles + 1
      nextStreak = streakMinutes + currentDurations.focus
      setCompletedCycles(nextCompleted)
      setStreakMinutes(nextStreak)
      nextMode = nextCompleted % 4 === 0 ? 'long_break' : 'short_break'
    } else {
      nextMode = 'focus'
    }

    setMode(nextMode)
    setTimeLeft(currentDurations[nextMode] * 60)
    onCycleCompleteRef.current?.(mode, nextStreak)
  }, [mode, completedCycles, streakMinutes, playChime])

  // 実時間（Wall-clock）に基づくタイマーループ（バックグラウンド時のドリフト防止）
  useEffect(() => {
    if (isRunning) {
      if (!targetEndTimeRef.current) {
        targetEndTimeRef.current = Date.now() + timeLeft * 1000
      }

      timerRef.current = setInterval(() => {
        if (!targetEndTimeRef.current) return
        const remaining = Math.max(0, Math.ceil((targetEndTimeRef.current - Date.now()) / 1000))
        setTimeLeft(remaining)

        if (remaining <= 0) {
          if (timerRef.current) clearInterval(timerRef.current)
          handleCycleFinished()
        }
      }, 500)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      targetEndTimeRef.current = null
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRunning, timeLeft, handleCycleFinished])

  const start = useCallback(() => {
    targetEndTimeRef.current = Date.now() + timeLeft * 1000
    setIsRunning(true)
  }, [timeLeft])

  const pause = useCallback(() => {
    if (targetEndTimeRef.current) {
      const remaining = Math.max(0, Math.ceil((targetEndTimeRef.current - Date.now()) / 1000))
      setTimeLeft(remaining)
    }
    targetEndTimeRef.current = null
    setIsRunning(false)
  }, [])

  const reset = useCallback(() => {
    targetEndTimeRef.current = null
    setIsRunning(false)
    setTimeLeft(durations[mode] * 60)
  }, [mode, durations])

  const switchMode = useCallback(
    (newMode: PomodoroMode) => {
      targetEndTimeRef.current = null
      setIsRunning(false)
      setMode(newMode)
      setTimeLeft(durations[newMode] * 60)
    },
    [durations]
  )

  // カスタム時間設定の更新と永続化
  const updateDurations = useCallback(
    (newDurations: PomodoroDurations) => {
      const sanitized: PomodoroDurations = {
        focus: Math.max(1, Math.min(180, Math.round(newDurations.focus))),
        short_break: Math.max(1, Math.min(60, Math.round(newDurations.short_break))),
        long_break: Math.max(1, Math.min(90, Math.round(newDurations.long_break))),
      }
      setDurations(sanitized)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized))
      } catch (e) {
        console.warn('[Pomodoro] Failed to persist durations to localStorage:', e)
      }

      if (!isRunning) {
        setTimeLeft(sanitized[mode] * 60)
      }
    },
    [isRunning, mode]
  )

  const applyPreset = useCallback(
    (presetId: string) => {
      const preset = POMODORO_PRESETS.find((p) => p.id === presetId)
      if (preset) {
        updateDurations({
          focus: preset.focus,
          short_break: preset.short_break,
          long_break: preset.long_break,
        })
      }
    },
    [updateDurations]
  )

  const resetToDefaults = useCallback(() => {
    updateDurations(DEFAULT_POMODORO_DURATIONS)
  }, [updateDurations])

  const totalDuration = durations[mode] * 60
  const progressPercent = Math.max(0, Math.min(100, ((totalDuration - timeLeft) / totalDuration) * 100))

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return {
    mode,
    timeLeft,
    isRunning,
    completedCycles,
    streakMinutes,
    durations,
    progressPercent,
    formattedTime,
    start,
    pause,
    reset,
    switchMode,
    updateDurations,
    applyPreset,
    resetToDefaults,
  }
}
