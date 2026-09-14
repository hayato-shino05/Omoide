import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SelectedMusicTrackRow } from '@/components/community/SelectedMusicTrackRow'
import { MusicPlayerProvider } from '@/lib/hooks/useMusicPlayer'

vi.mock('@/lib/i18n/LanguageContext', () => ({
  useLanguage: () => ({ locale: 'ja-JP', t: (key: string) => key }),
}))

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })))
})

describe('SelectedMusicTrackRow', () => {
  it('renders a "Chọn bài nhạc" button when no track is selected', () => {
    const onOpenPicker = vi.fn()
    render(<SelectedMusicTrackRow value="" onChange={() => undefined} onOpenPicker={onOpenPicker} />)

    const button = screen.getByRole('button', { name: 'chooseSong' })
    expect(button).toBeInTheDocument()
    fireEvent.click(button)
    expect(onOpenPicker).toHaveBeenCalledTimes(1)
  })

  it('shows retry for a non-OK resolve response and preserves SoundCloud metadata', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'unavailable' }), { status: 503 })))
    render(<SelectedMusicTrackRow value="soundcloud:42" onChange={() => undefined} onOpenPicker={() => undefined} />)

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByText('songSearchFailed')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'songSearchButton' }))
    expect(fetch).toHaveBeenCalledWith('/api/music/resolve?ref=soundcloud%3A42')
  })

  it('renders selected preset track with Change and Clear buttons', () => {
    const onChange = vi.fn()
    const onOpenPicker = vi.fn()
    render(
      <SelectedMusicTrackRow
        value="jamendo:1503376"
        onChange={onChange}
        onOpenPicker={onOpenPicker}
      />
    )

    expect(screen.getByText('Music For The Distant Distances')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'changeSong' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'songClear' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'changeSong' }))
    expect(onOpenPicker).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'songClear' }))
    expect(onChange).toHaveBeenCalledWith('')
  })
})

describe('SongPickerModal listbox keyboard (via SelectedMusicTrackRow → modal)', () => {
  it('renders SongPickerModal and supports ArrowDown + Enter to pick an option', async () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    const SelectedMusicTrackRowAndModal = (await import('@/components/community/SelectedMusicTrackRow'))
    void SelectedMusicTrackRowAndModal

    const SongPickerModal = (await import('@/components/community/SongPickerModal')).default
    render(
      <MusicPlayerProvider>
        <SongPickerModal isOpen={true} onClose={onClose} onConfirm={onConfirm} initialValue="" />
      </MusicPlayerProvider>
    )

    const songList = await screen.findByRole('list', { name: 'selectSong' })
    expect(songList).toBeInTheDocument()
    const songButtons = screen.getAllByRole('button', { name: /selectSong:/ })
    expect(songButtons.length).toBeGreaterThan(0)

    songButtons[0].focus()
    fireEvent.keyDown(songButtons[0], { key: 'Enter' })
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'confirm' })
      ).not.toBeDisabled()
    })
    fireEvent.click(screen.getByRole('button', { name: 'confirm' }))
    expect(onConfirm).toHaveBeenCalledWith('jamendo:1503376')
  })

  it('does not pause background music when opening or closing without playing a preview', async () => {
    const pauseSpy = vi.fn()
    const useMusicPlayerSpy = vi.spyOn(await import('@/lib/hooks/useMusicPlayer'), 'useMusicPlayer').mockReturnValue({
      isPlaying: true,
      currentTrack: { id: 'track-1', name: 'Now Playing', url: 'https://example.com/audio.mp3' },
      currentTrackIndex: 0,
      tracks: [{ id: 'track-1', name: 'Now Playing', url: 'https://example.com/audio.mp3' }],
      toggle: vi.fn(),
      selectTrack: vi.fn(),
      commitReference: vi.fn().mockResolvedValue(true),
      nextTrack: vi.fn(),
      prevTrack: vi.fn(),
      currentTime: 30,
      duration: 180,
      volume: 0.5,
      setVolume: vi.fn(),
      seekTo: vi.fn(),
      isLoading: false,
      playbackError: null,
      isShuffle: false,
      repeatMode: 'all',
      play: vi.fn(),
      pause: pauseSpy,
      toggleShuffle: vi.fn(),
      setShuffle: vi.fn(),
      toggleRepeat: vi.fn(),
      setRepeatMode: vi.fn(),
      addTrack: vi.fn(),
      removeTrack: vi.fn(),
      autoPlayOnBirthday: vi.fn(),
      previewReference: vi.fn().mockResolvedValue(undefined),
      retry: vi.fn(),
    })

    const SongPickerModal = (await import('@/components/community/SongPickerModal')).default
    const { rerender } = render(
      <SongPickerModal isOpen={true} onClose={() => {}} onConfirm={() => {}} initialValue="" />
    )

    expect(pauseSpy).not.toHaveBeenCalled()

    rerender(
      <SongPickerModal isOpen={false} onClose={() => {}} onConfirm={() => {}} initialValue="" />
    )

    expect(pauseSpy).not.toHaveBeenCalled()
    useMusicPlayerSpy.mockRestore()
  })
})
