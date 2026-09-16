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
  const onCycleCompleteRef = useRef(onCycleComplete)
  onCycleCompleteRef.current = onCycleComplete

  // Zen chime audio notification
  const playChime = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(528, audioCtx.currentTime) // Tần số 528Hz (Solfeggio frequency - Transformation & Miracles)
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

  // Timer countdown loop
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Hết giờ chu kỳ
            playChime()
            clearInterval(timerRef.current!)

            let nextMode: PomodoroMode = 'short_break'
            let nextCompleted = completedCycles
            let nextStreak = streakMinutes

            if (mode === 'focus') {
              nextCompleted = completedCycles + 1
              nextStreak = streakMinutes + 25
              setCompletedCycles(nextCompleted)
              setStreakMinutes(nextStreak)

              // Cứ mỗi 4 chu kỳ focus sẽ chuyển sang long break
              nextMode = nextCompleted % 4 === 0 ? 'long_break' : 'short_break'
            } else {
              nextMode = 'focus'
            }

            setMode(nextMode)
            setIsRunning(false)
            onCycleCompleteRef.current?.(mode, nextStreak)
            return DURATIONS[nextMode]
          }
          return prev - 1
        })
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRunning, mode, completedCycles, streakMinutes, playChime])

  const start = useCallback(() => setIsRunning(true), [])
  const pause = useCallback(() => setIsRunning(false), [])
  const reset = useCallback(() => {
    setIsRunning(false)
    setTimeLeft(DURATIONS[mode])
  }, [mode])

  const switchMode = useCallback((newMode: PomodoroMode) => {
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
