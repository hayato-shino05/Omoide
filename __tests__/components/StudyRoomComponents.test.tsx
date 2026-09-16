import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PomodoroRing } from '@/components/study/PomodoroRing'
import { DeskPresenceList } from '@/components/study/DeskPresenceList'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'
import { useStudyRoomStore } from '@/lib/stores/studyRoomStore'

describe('PomodoroRing Component Tests', () => {
  it('should render formatted time and switch modes properly', () => {
    const handleStart = vi.fn()
    const handlePause = vi.fn()
    const handleReset = vi.fn()
    const handleSwitchMode = vi.fn()

    render(
      <LanguageProvider initialLocale="ja">
        <PomodoroRing
          mode="focus"
          formattedTime="25:00"
          progressPercent={100}
          isRunning={false}
          completedCycles={0}
          streakMinutes={0}
          onStart={handleStart}
          onPause={handlePause}
          onReset={handleReset}
          onSwitchMode={handleSwitchMode}
        />
      </LanguageProvider>
    )

    expect(screen.getByText('25:00')).toBeDefined()
    expect(screen.getByText('集中時間')).toBeDefined()

    // Click Start button
    const startBtn = screen.getByRole('button', { name: /タイマー開始|Start Pomodoro/i })
    fireEvent.click(startBtn)
    expect(handleStart).toHaveBeenCalled()

    // Click mode switch
    const breakBtn = screen.getByRole('button', { name: /5分 ひと息|5m Break/i })
    fireEvent.click(breakBtn)
    expect(handleSwitchMode).toHaveBeenCalledWith('short_break')
  })
})

describe('DeskPresenceList Component Tests', () => {
  it('should render members and trigger cheer buttons', () => {
    const handleSendCheer = vi.fn()

    useStudyRoomStore.setState({
      members: [
        {
          id: 'mem_1',
          room_id: 'room_1',
          user_identifier: 'user_1',
          display_name: 'Alice',
          avatar_url: null,
          focus_status: 'focusing',
          current_streak_minutes: 45,
          joined_at: new Date().toISOString(),
          last_heartbeat_at: new Date().toISOString(),
        },
      ],
      userIdentifier: 'user_1',
    })

    render(
      <LanguageProvider initialLocale="ja">
        <DeskPresenceList onSendCheer={handleSendCheer} />
      </LanguageProvider>
    )

    expect(screen.getByText('Alice')).toBeDefined()
    expect(screen.getByText('45m streak')).toBeDefined()
    expect(screen.getByText('あなた')).toBeDefined()

    // Click cheer coffee
    const coffeeBtn = screen.getByRole('button', { name: /お茶をどうぞ|Warm Tea/i })
    fireEvent.click(coffeeBtn)
    expect(handleSendCheer).toHaveBeenCalledWith('coffee')
  })
})
