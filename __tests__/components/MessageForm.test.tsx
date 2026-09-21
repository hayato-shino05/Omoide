import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MessageForm } from '@/components/community/MessageForm'
import { MusicPlayerProvider } from '@/lib/hooks/useMusicPlayer'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'
import type { ReactNode } from 'react'

// Mock Supabase
vi.mock('@/lib/supabase/client', () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => ({
        order: () => ({
          limit: () => Promise.resolve({ data: [] }),
        }),
      }),
    }),
    storage: {
      from: () => ({
        getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/test.jpg' } }),
      }),
    },
  }),
}))

const wrapper = ({ children }: { children: ReactNode }) => (
  <LanguageProvider>
    <MusicPlayerProvider>{children}</MusicPlayerProvider>
  </LanguageProvider>
)

describe('MessageForm - 投稿モーダル再設計（モードA vs モードB）', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/community/birthday-threads')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              data: [
                {
                  id: 'thread-123',
                  sender: 'System',
                  birthday_person: 'Sakura',
                  message: 'Sakura Birthday Thread',
                  celebration_date: '2026-09-15',
                  coverUrl: null,
                  created_at: new Date().toISOString(),
                },
              ],
            }),
          })
        }
        if (url.includes('/api/music/curated')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ data: [] }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true }),
        })
      })
    )
  })

  it('初期表示で新規投稿モード（モードA）が選択されていること', () => {
    render(<MessageForm />, { wrapper })

    const newTab = screen.getByRole('tab', { name: /新規投稿|Create New Post/i })
    const replyTab = screen.getByRole('tab', { name: /既存の投稿にコメント|Comment on Post/i })

    expect(newTab).toHaveAttribute('aria-selected', 'true')
    expect(replyTab).toHaveAttribute('aria-selected', 'false')
  })

  it('タブクリックで既存投稿への返信モード（モードB）に切り替えられ、投稿選択モーダルを開けること', async () => {
    render(<MessageForm />, { wrapper })

    const replyTab = screen.getByRole('tab', { name: /既存の投稿にコメント|Comment on Post/i })
    fireEvent.click(replyTab)

    expect(replyTab).toHaveAttribute('aria-selected', 'true')

    // 返信先の選択CTAボタンが表示され、クリックでPostPickerModalが開いてSakuraが表示されること
    const selectPostButton = await screen.findByRole('button', { name: /返信先の投稿を選択する|Select a post to reply to/i })
    expect(selectPostButton).toBeInTheDocument()

    fireEvent.click(selectPostButton)

    await waitFor(() => {
      expect(screen.getByText('Sakura')).toBeInTheDocument()
    })
  })

  it('initialThreadId が渡された場合は自動的に返信モード（モードB）で開始されること', async () => {
    render(<MessageForm initialThreadId="thread-123" />, { wrapper })

    const replyTab = screen.getByRole('tab', { name: /既存の投稿にコメント|Comment on Post/i })
    expect(replyTab).toHaveAttribute('aria-selected', 'true')
  })

  it('モードA（新規投稿）送信時に /api/community へ POST されること', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const onSuccess = vi.fn()
    const { container } = render(<MessageForm onSuccess={onSuccess} />, { wrapper })

    // 送信者名とメッセージを入力
    const nameInput = container.querySelector('#message-form-sender') as HTMLInputElement
    const messageInput = container.querySelector('#message-form-content') as HTMLTextAreaElement

    expect(nameInput).not.toBeNull()
    expect(messageInput).not.toBeNull()

    fireEvent.change(nameInput, { target: { value: 'Hanako' } })
    fireEvent.change(messageInput, { target: { value: 'お誕生日おめでとうございます！' } })

    const submitButton = screen.getByRole('button', { name: /お祝いを送る|Send your wish/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/community',
        expect.objectContaining({
          method: 'POST',
        })
      )
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('モードB（返信）送信時に /api/community/reply へ JSON POST されること', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/community/birthday-threads')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: [
              {
                id: '456',
                sender: 'Taro',
                birthday_person: 'Taro',
                message: 'Taro Birthday',
                celebration_date: '2026-09-15',
                coverUrl: null,
                created_at: new Date().toISOString(),
              },
            ],
          }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ data: { id: 'reply-1' } }),
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const onSuccess = vi.fn()
    const { container } = render(<MessageForm initialThreadId="456" onSuccess={onSuccess} />, { wrapper })

    const nameInput = container.querySelector('#message-form-sender') as HTMLInputElement
    const messageInput = container.querySelector('#message-form-content') as HTMLTextAreaElement

    expect(nameInput).not.toBeNull()
    expect(messageInput).not.toBeNull()

    fireEvent.change(nameInput, { target: { value: 'Hanako' } })
    fireEvent.change(messageInput, { target: { value: 'お祝い申し上げます！' } })

    const submitButton = screen.getByRole('button', { name: /返信|Reply/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/community/reply',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId: '456',
            sender: 'Hanako',
            content: 'お祝い申し上げます！',
            musicTrackId: null,
          }),
        })
      )
      expect(onSuccess).toHaveBeenCalled()
    })
  })
})
