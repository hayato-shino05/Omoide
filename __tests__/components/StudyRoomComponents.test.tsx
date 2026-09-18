import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PomodoroRing } from '@/components/study/PomodoroRing'
import { PomodoroSettingsModal } from '@/components/study/PomodoroSettingsModal'
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
          durations={{ focus: 25, short_break: 5, long_break: 15 }}
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

  it('should render custom duration labels on tabs', () => {
    render(
      <LanguageProvider initialLocale="ja">
        <PomodoroRing
          mode="focus"
          formattedTime="50:00"
          progressPercent={100}
          isRunning={false}
          completedCycles={0}
          streakMinutes={0}
          onStart={vi.fn()}
          onPause={vi.fn()}
          onReset={vi.fn()}
          onSwitchMode={vi.fn()}
          durations={{ focus: 50, short_break: 10, long_break: 20 }}
        />
      </LanguageProvider>
    )

    expect(screen.getByText('50:00')).toBeDefined()
    expect(screen.getByRole('button', { name: /50分 集中/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /10分 ひと息/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /20分 休息/i })).toBeDefined()
  })
})

describe('PomodoroSettingsModal Component Tests', () => {
  it('should render presets and trigger onSave with updated durations', () => {
    const handleSave = vi.fn()
    const handleResetDefaults = vi.fn()
    const handleClose = vi.fn()

    render(
      <LanguageProvider initialLocale="ja">
        <PomodoroSettingsModal
          isOpen={true}
          onClose={handleClose}
          currentDurations={{ focus: 25, short_break: 5, long_break: 15 }}
          onSave={handleSave}
          onResetDefaults={handleResetDefaults}
        />
      </LanguageProvider>
    )

    expect(screen.getByText('タイマー設定')).toBeDefined()

    // Click Deep Work preset (50/10/20m)
    const deepPresetBtn = screen.getByRole('button', { name: /ディープワーク|Deep Work/i })
    fireEvent.click(deepPresetBtn)

    // Click Save button
    const saveBtn = screen.getByRole('button', { name: /設定を適用|Apply Settings/i })
    fireEvent.click(saveBtn)

    expect(handleSave).toHaveBeenCalledWith({
      focus: 50,
      short_break: 10,
      long_break: 20,
    })
    expect(handleClose).toHaveBeenCalled()
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
