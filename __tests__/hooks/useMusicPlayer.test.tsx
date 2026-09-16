import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { MusicPlayerProvider, useMusicPlayer } from '@/lib/hooks/useMusicPlayer'
import { useMusicStore } from '@/lib/stores/musicStore'
import type { ReactNode } from 'react'

// Audio 要素のモック
class MockAudio {
  src = ''
  currentTime = 0
  duration = 180
  volume = 0.5
  paused = true
  play = vi.fn().mockResolvedValue(undefined)
  pause = vi.fn()
  load = vi.fn()
  addEventListener = vi.fn()
  removeEventListener = vi.fn()
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <MusicPlayerProvider>{children}</MusicPlayerProvider>
)

describe('useMusicPlayer - Supabase 楽曲の優先度および Jamendo 先行自動保存バグの修正', () => {
  beforeEach(() => {
    vi.stubGlobal('Audio', MockAudio)
    useMusicStore.setState({
      lastTrackId: null,
      lastTrackReference: null,
      savedTrack: null,
      savedTime: 0,
      volume: 0.5,
      isShuffle: false,
      repeatMode: 'all',
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('初期マウント時に Jamendo プリセット曲を localStorage に先行自動保存しないこと', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'supabase-1',
              name: 'Omoide Theme',
              audioUrl: 'https://example.com/supabase-1.mp3',
              duration: 200,
              artistName: 'Omoide Artists',
            },
          ],
        }),
      })
    )

    renderHook(() => useMusicPlayer(), { wrapper })

    // マウント直後の store 状態を確認
    const storeState = useMusicStore.getState()
    expect(storeState.savedTrack).toBeNull()
    expect(storeState.lastTrackId).toBeNull()
  })

  it('/api/music/curated から取得した Supabase 先頭曲を初期 currentTrack として採用すること', async () => {
    const supabaseTrack = {
      id: 'supabase-track-101',
      name: 'Supabase Special Song',
      audioUrl: 'https://example.com/supabase-special.mp3',
      duration: 240,
      artistName: 'Supabase Band',
    }

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [supabaseTrack],
        }),
      })
    )

    const { result } = renderHook(() => useMusicPlayer(), { wrapper })

    // Supabase 楽曲の読み込み完了を待機
    await waitFor(() => {
      expect(result.current.currentTrack?.id).toBe('supabase-track-101')
      expect(result.current.currentTrack?.name).toBe('Supabase Special Song')
    })

    // Jamendo プリセットではなく Supabase の楽曲が先頭になること
    expect(result.current.currentTrackIndex).toBe(0)
    expect(result.current.tracks[0].id).toBe('supabase-track-101')
  })

  it('初期アクセス時に Supabase から取得した楽曲群が正しく tracks に反映されること', async () => {
    const supabaseTracks = [
      {
        id: 'supabase-track-priority-1',
        name: 'Supabase Priority Song 1',
        audioUrl: 'https://example.com/supabase-priority-1.mp3',
        duration: 190,
        artistName: 'Omoide Lab',
      },
      {
        id: 'supabase-track-priority-2',
        name: 'Supabase Priority Song 2',
        audioUrl: 'https://example.com/supabase-priority-2.mp3',
        duration: 210,
        artistName: 'Omoide Lab',
      },
    ]

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: supabaseTracks,
        }),
      })
    )

    const { result } = renderHook(() => useMusicPlayer(), { wrapper })

    await waitFor(() => {
      expect(result.current.currentTrack?.id).toBe('supabase-track-priority-1')
      expect(result.current.tracks.length).toBe(2)
    })
  })

  it('ユーザーが明示的に selectTrack を実行した場合は store に保存されること', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'track-a',
              name: 'Track A',
              audioUrl: 'https://example.com/a.mp3',
              duration: 100,
            },
            {
              id: 'track-b',
              name: 'Track B',
              audioUrl: 'https://example.com/b.mp3',
              duration: 120,
            },
          ],
        }),
      })
    )

    const { result } = renderHook(() => useMusicPlayer(), { wrapper })

    await waitFor(() => {
      expect(result.current.tracks.length).toBe(2)
    })

    act(() => {
      result.current.selectTrack('track-b')
    })

    expect(result.current.currentTrack?.id).toBe('track-b')
    expect(useMusicStore.getState().lastTrackId).toBe('track-b')
  })
})
