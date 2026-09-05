import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SelectedMusicTrackRow } from '@/components/community/SelectedMusicTrackRow'

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
      <SongPickerModal isOpen={true} onClose={onClose} onConfirm={onConfirm} initialValue="" />
    )

    const listbox = await screen.findByRole('listbox')
    expect(listbox).toHaveAttribute('tabindex', '0')
    const options = screen.getAllByRole('option')
    expect(options.length).toBeGreaterThan(0)

    fireEvent.keyDown(listbox, { key: 'ArrowDown' })
    fireEvent.keyDown(listbox, { key: 'Enter' })
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'confirm' })
      ).not.toBeDisabled()
    })
    fireEvent.click(screen.getByRole('button', { name: 'confirm' }))
    expect(onConfirm).toHaveBeenCalledWith('jamendo:1503376')
  })
})
