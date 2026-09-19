import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PomodoroRing } from '@/components/study/PomodoroRing'
import { PomodoroSettingsModal } from '@/components/study/PomodoroSettingsModal'
import { DeskPresenceList } from '@/components/study/DeskPresenceList'
import { StudyRoomView } from '@/components/study/StudyRoomView'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'
import { MusicPlayerProvider } from '@/lib/hooks/useMusicPlayer'
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
    expect(screen.getByText('45分 集中中')).toBeDefined()
    expect(screen.getByText('あなた')).toBeDefined()

    // Click cheer coffee
    const coffeeBtn = screen.getByRole('button', { name: /お茶をどうぞ|Warm Tea/i })
    fireEvent.click(coffeeBtn)
    expect(handleSendCheer).toHaveBeenCalledWith('coffee')
  })
})

describe('StudyRoomView Music Controls & Sync Tests', () => {
  it('should render shuffle, repeat, next, and previous buttons and dispatch realtime actions', () => {
    const handleToggleShuffle = vi.fn()
    const handleCycleRepeat = vi.fn()
    const handleNext = vi.fn()
    const handlePrev = vi.fn()

    useStudyRoomStore.setState({
      userIdentifier: 'user_host',
      isHost: true,
      currentRoom: {
        id: 'room_1',
        name: 'Kyoto Study Hall',
        host_id: 'user_host',
        current_track_id: 'omoide:1',
        epoch_started_at: new Date().toISOString(),
        playback_state: 'playing',
        is_private: false,
        max_members: 12,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      currentTrack: {
        id: 'omoide:1',
        name: 'Sakura Dreams',
        artistName: 'Omoide Ensemble',
        url: 'https://example.com/audio.mp3',
        duration: 180,
      },
      roomQueue: ['omoide:1', 'omoide:2', 'omoide:3'],
      roomTrackIndex: 0,
      isRoomShuffle: true,
      roomRepeatMode: 'all',
      toggleRoomShuffleAction: handleToggleShuffle,
      cycleRoomRepeatModeAction: handleCycleRepeat,
      nextRoomTrackAction: handleNext,
      prevRoomTrackAction: handlePrev,
    })

    render(
      <LanguageProvider initialLocale="ja">
        <MusicPlayerProvider>
          <StudyRoomView roomId="room_1" onLeave={vi.fn()} />
        </MusicPlayerProvider>
      </LanguageProvider>
    )

    expect(screen.getByText('Kyoto Study Hall')).toBeDefined()
    expect(screen.getByText('Sakura Dreams')).toBeDefined()
    expect(screen.getByText('1/3')).toBeDefined()

    // Shuffle button
    const shuffleBtn = screen.getByRole('button', { name: /シャッフル|Shuffle/i })
    expect(shuffleBtn.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(shuffleBtn)
    expect(handleToggleShuffle).toHaveBeenCalled()

    // Repeat button
    const repeatBtn = screen.getByRole('button', { name: /リピート|Repeat/i })
    expect(repeatBtn.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(repeatBtn)
    expect(handleCycleRepeat).toHaveBeenCalled()

    // Next track button
    const nextBtn = screen.getByRole('button', { name: /次の曲|Next Track/i })
    fireEvent.click(nextBtn)
    expect(handleNext).toHaveBeenCalled()

    // Previous track button
    const prevBtn = screen.getByRole('button', { name: /前の曲|Previous Track/i })
    fireEvent.click(prevBtn)
    expect(handlePrev).toHaveBeenCalled()
  })
})
