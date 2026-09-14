import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MusicPlayer } from '@/components/ui/MusicPlayer'
import { MusicPlayerProvider } from '@/lib/hooks/useMusicPlayer'

vi.mock('@/lib/i18n/LanguageContext', () => ({
  useLanguage: () => ({ locale: 'ja-JP', t: (key: string) => key }),
}))

const customTrack = {
  id: 'test-track-1',
  name: 'Super Long Title That Should Be Truncated In Extreme Stress Test Conditions Over Many Lines',
  artistName: 'Super Long Artist Name That Should Also Be Gracefully Truncated With Ellipsis',
  url: 'https://example.com/audio.mp3',
  duration: 180,
  category: 'jazz',
}

describe('MusicPlayer component', () => {
  beforeEach(() => {
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
    window.HTMLMediaElement.prototype.pause = vi.fn()
    window.HTMLMediaElement.prototype.load = vi.fn()
  })

  it('renders now playing information, controls, and triggers play/pause', () => {
    render(
      <MusicPlayerProvider customTracks={[customTrack]}>
        <MusicPlayer />
      </MusicPlayerProvider>
    )

    expect(screen.getByText(customTrack.name)).toBeInTheDocument()
    expect(screen.getByText(customTrack.artistName)).toBeInTheDocument()

    const playButton = screen.getByRole('button', { name: 'play' })
    expect(playButton).toBeInTheDocument()
    fireEvent.click(playButton)
  })

  it('handles keyboard navigation on seek bar (ArrowLeft, ArrowRight, Shift+Arrow, Home, End, Space)', () => {
    render(
      <MusicPlayerProvider customTracks={[customTrack]}>
        <MusicPlayer />
      </MusicPlayerProvider>
    )

    const seekBar = screen.getByRole('slider', { name: 'seekPosition' })
    expect(seekBar).toBeInTheDocument()

    // Space key toggles play/pause
    fireEvent.keyDown(seekBar, { key: ' ' })
    // ArrowRight seeks 5s forward
    fireEvent.keyDown(seekBar, { key: 'ArrowRight' })
    // Shift+ArrowLeft seeks 1s backward
    fireEvent.keyDown(seekBar, { key: 'ArrowLeft', shiftKey: true })
    // Home key seeks to 0
    fireEvent.keyDown(seekBar, { key: 'Home' })
    // End key seeks to end
    fireEvent.keyDown(seekBar, { key: 'End' })
  })

  it('handles volume mute/unmute and opening music picker modal', () => {
    render(
      <MusicPlayerProvider customTracks={[customTrack]}>
        <MusicPlayer />
      </MusicPlayerProvider>
    )

    const muteButton = screen.getByRole('button', { name: 'mute' })
    expect(muteButton).toBeInTheDocument()
    fireEvent.click(muteButton)

    const selectMusicButton = screen.getByRole('button', { name: 'selectMusic' })
    expect(selectMusicButton).toBeInTheDocument()
    fireEvent.click(selectMusicButton)
  })
})
