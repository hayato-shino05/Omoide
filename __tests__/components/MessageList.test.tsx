import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MessageList } from '@/components/community/MessageList'

const messages = [
  {
    id: 1,
    sender: '花子',
    message: 'おめでとう！',
    music_track_id: 'jamendo:1503376',
    created_at: '2026-09-05T12:00:00.000Z',
  },
]

vi.mock('@/lib/hooks/useMessages', () => ({
  useMessages: () => ({ messages, isLoading: false, error: null }),
}))

vi.mock('@/lib/i18n/LanguageContext', () => ({
  useLanguage: () => ({ locale: 'ja-JP', t: (key: string) => key }),
}))

vi.mock('framer-motion', () => {
  const passthrough = ({ children, ...props }: Record<string, unknown> & { as?: React.ElementType }) => {
    const Tag = (props.as ?? 'div') as React.ElementType
    return <Tag {...props}>{children}</Tag>
  }
  return {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    motion: new Proxy({}, { get: (_target, _prop: string) => passthrough }),
    useReducedMotion: () => false,
  }
})

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
    data: { streamUrl: 'https://resolver.example/stream', name: 'Birthday Song', artistName: 'Artist' },
  }), { status: 200 })))
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
})

describe('MessageList music playback', () => {
  it('resolves a provider-aware reference only after the user requests playback', async () => {
    render(<MessageList />)

    expect(fetch).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'play' }))

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/music/resolve?ref=jamendo%3A1503376'))
    expect(await screen.findByText('Birthday Song')).toBeInTheDocument()
    expect(document.querySelector('audio')).toHaveAttribute('src', 'https://resolver.example/stream')
  })

  it('exposes a retry button and aria-live alert after a failed resolve', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: '楽曲を再生できません' }), { status: 502 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<MessageList />)
    fireEvent.click(screen.getByRole('button', { name: 'play' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('songSearchFailed')

    const retry = screen.getByRole('button', { name: 'retry' })
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      data: { streamUrl: 'https://resolver.example/stream', name: 'Birthday Song', artistName: 'Artist' },
    }), { status: 200 }))
    fireEvent.click(retry)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('Birthday Song')).toBeInTheDocument()
  })
})
