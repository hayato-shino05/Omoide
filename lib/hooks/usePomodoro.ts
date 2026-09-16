'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { PomodoroMode } from '@/types/study'

const DURATIONS: Record<PomodoroMode, number> = {
  focus: 25 * 60, // 25 phút
  short_break: 5 * 60, // 5 phút
  long_break: 15 * 60, // 15 phút
}

export function usePomodoro(onCycleComplete?: (mode: PomodoroMode, streakMinutes: number) => void) {
  const [mode, setMode] = useState<PomodoroMode>('focus')
  const [timeLeft, setTimeLeft] = useState<number>(DURATIONS.focus)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [completedCycles, setCompletedCycles] = useState<number>(0)
  const [streakMinutes, setStreakMinutes] = useState<number>(0)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const targetEndTimeRef = useRef<number | null>(null)
  const onCycleCompleteRef = useRef(onCycleComplete)

  useEffect(() => {
    onCycleCompleteRef.current = onCycleComplete
  }, [onCycleComplete])

  // Zen chime audio notification
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
      osc.frequency.setValueAtTime(528, audioCtx.currentTime) // Tần số 528Hz (Solfeggio frequency)
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.5)

      osc.connect(gain)
      gain.connect(audioCtx.destination)

      osc.start()
      osc.stop(audioCtx.currentTime + 2.5)
    } catch (e) {
      console.warn('[Pomodoro] AudioContext chime failed:', e)
    }
  }, [])

  // Xử lý khi hoàn thành chu kỳ (tách riêng ngoài state updater)
  const handleCycleFinished = useCallback(() => {
    playChime()
    setIsRunning(false)
    targetEndTimeRef.current = null

    let nextMode: PomodoroMode = 'short_break'
    let nextCompleted = completedCycles
    let nextStreak = streakMinutes

    if (mode === 'focus') {
      nextCompleted = completedCycles + 1
      nextStreak = streakMinutes + 25
      setCompletedCycles(nextCompleted)
      setStreakMinutes(nextStreak)
      nextMode = nextCompleted % 4 === 0 ? 'long_break' : 'short_break'
    } else {
      nextMode = 'focus'
    }

    setMode(nextMode)
    setTimeLeft(DURATIONS[nextMode])
    onCycleCompleteRef.current?.(mode, nextStreak)
  }, [mode, completedCycles, streakMinutes, playChime])

  // Timer countdown loop dựa trên clock thời gian thực để chống drift khi ẩn tab
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
    setTimeLeft(DURATIONS[mode])
  }, [mode])

  const switchMode = useCallback((newMode: PomodoroMode) => {
    targetEndTimeRef.current = null
    setIsRunning(false)
    setMode(newMode)
    setTimeLeft(DURATIONS[newMode])
  }, [])

  const totalDuration = DURATIONS[mode]
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
    progressPercent,
    formattedTime,
    start,
    pause,
    reset,
    switchMode,
  }
}
