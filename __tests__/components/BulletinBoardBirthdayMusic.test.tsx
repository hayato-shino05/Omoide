import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BulletinBoard from '@/components/community/BulletinBoard'
import { useUIStore } from '@/lib/stores/uiStore'

const mockBirthdayThreads = [
  {
    id: 201,
    sender: 'System',
    message: '「葵」さんのお誕生日おめでとう！',
    birthday_person: '葵',
    celebration_date: '2026-09-15',
    timezone: 'Asia/Tokyo',
    created_at: '2026-09-15T00:00:00Z',
    coverUrl: null,
  },
]

vi.mock('@/lib/hooks/usePosts', () => ({
  usePosts: () => ({
    posts: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
    likePost: vi.fn(),
  }),
}))

vi.mock('@/lib/i18n/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/components/ui/Icon', () => ({
  Icon: () => null,
}))

describe('BulletinBoard Birthday Thread Music Coordination', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url === '/api/community/birthday-threads') {
          return Promise.resolve(
            new Response(JSON.stringify({ data: mockBirthdayThreads }), { status: 200 })
          )
        }
        return Promise.resolve(new Response(JSON.stringify({ data: {} }), { status: 200 }))
      })
    )
    useUIStore.setState({ activeModal: null, messageModalPayload: null })
  })

  it('renders birthday thread card with celebrateWithMusic button and opens message modal with pre-selected thread', async () => {
    render(<BulletinBoard />)

    await waitFor(() => {
      expect(screen.getAllByText('葵').length).toBeGreaterThan(0)
    })

    const celebrateButton = screen.getByRole('button', { name: 'celebrateWithMusic' })
    expect(celebrateButton).toBeInTheDocument()

    fireEvent.click(celebrateButton)

    expect(useUIStore.getState().activeModal).toBe('message')
    expect(useUIStore.getState().messageModalPayload).toEqual({
      birthdayPerson: '葵',
      threadId: 201,
    })
  })
})
