import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MusicPlayer } from '@/components/ui/MusicPlayer'
import { MusicPlayerProvider } from '@/lib/hooks/useMusicPlayer'
import * as useMusicPlayerModule from '@/lib/hooks/useMusicPlayer'
import * as toastModule from '@/components/ui/Toast'

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
    vi.restoreAllMocks()
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

    expect(screen.getAllByText(customTrack.name)[0]).toBeInTheDocument()
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

  it('renders spinning loader icon inside play button and disables button when loading', () => {
    vi.spyOn(useMusicPlayerModule, 'useMusicPlayer').mockReturnValue({
      isPlaying: false,
      currentTrack: customTrack,
      currentTrackIndex: 0,
      tracks: [customTrack],
      toggle: vi.fn(),
      selectTrack: vi.fn(),
      commitReference: vi.fn().mockResolvedValue(true),
      nextTrack: vi.fn(),
      prevTrack: vi.fn(),
      currentTime: 10,
      duration: 180,
      volume: 0.5,
      setVolume: vi.fn(),
      seekTo: vi.fn(),
      isLoading: true,
      playbackError: null,
      play: vi.fn(),
      pause: vi.fn(),
      addTrack: vi.fn(),
      removeTrack: vi.fn(),
      autoPlayOnBirthday: vi.fn(),
      previewReference: vi.fn().mockResolvedValue(undefined),
      retry: vi.fn(),
    })

    const { container } = render(<MusicPlayer />)

    const playButton = screen.getByRole('button', { name: 'play' })
    expect(playButton).toBeDisabled()
    expect(playButton).toHaveAttribute('aria-busy', 'true')
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    expect(screen.queryByText('loading')).not.toBeInTheDocument()
  })

  it('triggers toast error notification and does not render bottom error text on playback error', () => {
    const errorSpy = vi.fn()
    vi.spyOn(toastModule, 'useToast').mockReturnValue({
      toasts: [],
      addToast: vi.fn(),
      removeToast: vi.fn(),
      updateToast: vi.fn(),
      success: vi.fn(),
      error: errorSpy,
      warning: vi.fn(),
      info: vi.fn(),
      loading: vi.fn(),
      promise: vi.fn(),
    })

    vi.spyOn(useMusicPlayerModule, 'useMusicPlayer').mockReturnValue({
      isPlaying: false,
      currentTrack: customTrack,
      currentTrackIndex: 0,
      tracks: [customTrack],
      toggle: vi.fn(),
      selectTrack: vi.fn(),
      commitReference: vi.fn().mockResolvedValue(true),
      nextTrack: vi.fn(),
      prevTrack: vi.fn(),
      currentTime: 0,
      duration: 180,
      volume: 0.5,
      setVolume: vi.fn(),
      seekTo: vi.fn(),
      isLoading: false,
      playbackError: 'Audio decoding failed',
      play: vi.fn(),
      pause: vi.fn(),
      addTrack: vi.fn(),
      removeTrack: vi.fn(),
      autoPlayOnBirthday: vi.fn(),
      previewReference: vi.fn().mockResolvedValue(undefined),
      retry: vi.fn(),
    })

    render(<MusicPlayer />)

    expect(errorSpy).toHaveBeenCalledWith('Audio decoding failed', {
      title: 'soundPlaybackError',
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByText(/soundPlaybackError/i)).not.toBeInTheDocument()
  })

  it('toggles lyrics drawer when clicking the pull tab handle', () => {
    render(
      <MusicPlayerProvider customTracks={[customTrack]}>
        <MusicPlayer />
      </MusicPlayerProvider>
    )

    const tabHandle = screen.getByRole('button', { name: 'lyricsTitle' })
    expect(tabHandle).toBeInTheDocument()
    expect(tabHandle).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(tabHandle)
    expect(screen.getAllByRole('button', { name: 'lyricsClose' })[0]).toBeInTheDocument()
  })
})
