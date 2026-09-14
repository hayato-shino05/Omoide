import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { type ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MessageForm } from '@/components/community/MessageForm'
import { MusicPlayerProvider } from '@/lib/hooks/useMusicPlayer'

const renderWithMusicProvider = (ui: ReactElement) =>
  render(<MusicPlayerProvider>{ui}</MusicPlayerProvider>)

const mockBirthdayThreads = [
  {
    id: 101,
    sender: 'System',
    message: '「さくら」さんのお誕生日おめでとう！',
    birthday_person: 'さくら',
    celebration_date: '2026-09-15',
    timezone: 'Asia/Tokyo',
    created_at: '2026-09-15T00:00:00Z',
    coverUrl: 'https://example.com/sakura.jpg',
  },
  {
    id: 102,
    sender: 'System',
    message: '「大和」さんのお誕生日おめでとう！',
    birthday_person: '大和',
    celebration_date: '2026-09-15',
    timezone: 'Asia/Tokyo',
    created_at: '2026-09-15T00:00:00Z',
    coverUrl: null,
  },
]

vi.mock('@/lib/i18n/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === 'birthdayWishTemplate') return `${params?.name}さん、お誕生日おめでとうございます！`
      if (key === 'selectedRecipient') return `お祝い先: ${params?.name}`
      return key
    },
  }),
}))

vi.mock('@/components/ui/Icon', () => ({
  Icon: () => null,
}))

describe('MessageForm Celebrant Selector & Music Coordination', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url === '/api/community/birthday-threads') {
          return Promise.resolve(
            new Response(JSON.stringify({ data: mockBirthdayThreads }), { status: 200 })
          )
        }
        return Promise.resolve(new Response(JSON.stringify({ data: {} }), { status: 201 }))
      })
    )
    localStorage.clear()
  })

  it('fetches and displays birthday celebrant cards and toEveryone card', async () => {
    renderWithMusicProvider(<MessageForm />)

    expect(screen.getByText('toEveryone')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('さくら')).toBeInTheDocument()
      expect(screen.getByText('大和')).toBeInTheDocument()
    })
  })

  it('auto-fills warm greeting template when a celebrant card is clicked with empty message', async () => {
    renderWithMusicProvider(<MessageForm />)

    await waitFor(() => {
      expect(screen.getByText('さくら')).toBeInTheDocument()
    })

    const sakuraCard = screen.getByText('さくら').closest('button')
    expect(sakuraCard).not.toBeNull()
    fireEvent.click(sakuraCard!)

    const textarea = screen.getByRole('textbox', { name: 'messagePlaceholder' })
    expect(textarea).toHaveValue('さくらさん、お誕生日おめでとうございます！')

    // Switch to another celebrant
    const yamatoCard = screen.getByText('大和').closest('button')
    fireEvent.click(yamatoCard!)
    expect(textarea).toHaveValue('大和さん、お誕生日おめでとうございます！')

    // Switch to everyone clears auto-filled template
    const everyoneCard = screen.getByText('toEveryone').closest('button')
    fireEvent.click(everyoneCard!)
    expect(textarea).toHaveValue('')
  })

  it('protects custom user message from being overwritten when changing celebrant card', async () => {
    renderWithMusicProvider(<MessageForm />)

    await waitFor(() => {
      expect(screen.getByText('さくら')).toBeInTheDocument()
    })

    const textarea = screen.getByRole('textbox', { name: 'messagePlaceholder' })
    fireEvent.change(textarea, { target: { value: '素敵な一年になりますように！' } })

    const sakuraCard = screen.getByText('さくら').closest('button')
    fireEvent.click(sakuraCard!)

    expect(textarea).toHaveValue('素敵な一年になりますように！')
  })

  it('submits to /api/community/reply when a birthday thread is selected', async () => {
    renderWithMusicProvider(<MessageForm initialThreadId={101} />)

    await waitFor(() => {
      expect(screen.getByText('さくら')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByRole('textbox', { name: 'yourName' }), { target: { value: '太郎' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'messagePlaceholder' }), {
      target: { value: 'さくらさん、お誕生日おめでとうございます！' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'sendWish' }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/community/reply',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId: '101',
            sender: '太郎',
            content: 'さくらさん、お誕生日おめでとうございます！',
            musicTrackId: null,
          }),
        })
      )
    })
  })

  it('submits to /api/community when toEveryone is selected', async () => {
    renderWithMusicProvider(<MessageForm />)

    await waitFor(() => {
      expect(screen.getByText('toEveryone')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByRole('textbox', { name: 'yourName' }), { target: { value: '太郎' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'messagePlaceholder' }), {
      target: { value: 'みなさんこんにちは' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'sendWish' }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/community',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })
    const call = vi.mocked(fetch).mock.calls.find((c) => c[0] === '/api/community')
    const formData = call?.[1]?.body as FormData
    expect(formData.get('kind')).toBe('message')
    expect(formData.get('sender')).toBe('太郎')
    expect(formData.get('content')).toBe('みなさんこんにちは')
  })
})
