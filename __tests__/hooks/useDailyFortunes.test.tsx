import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useDailyFortunes } from '@/lib/hooks/useDailyFortunes'
import { OMIKUJI_FORTUNES, type OmikujiFortune } from '@/data/omikujiData'

describe('useDailyFortunes', () => {
  let queryClient: QueryClient

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    const TestWrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    TestWrapper.displayName = 'TestWrapper'
    return TestWrapper
  }

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    queryClient?.clear()
  })

  it('初期ロード時に即座に OMIKUJI_FORTUNES を返却すること（非ブロッキング）', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => new Promise(() => {})) // 保留中の Promise
    )

    const { result } = renderHook(() => useDailyFortunes(), {
      wrapper: createWrapper(),
    })

    expect(result.current.fortunes).toEqual(OMIKUJI_FORTUNES)
    expect(result.current.isFallback).toBe(true)
  })

  it('APIから正常に運勢データを取得できた場合に更新されること', async () => {
    const mockDbFortunes: OmikujiFortune[] = [
      {
        id: 99,
        rank: 'daikichi',
        rankNameJa: '極上大吉',
        rankNameEn: 'Ultimate Blessing',
        poemJa: '天高く 昇る龍の如く',
        poemEn: 'Like a dragon soaring high',
        generalJa: '無上の幸福',
        generalEn: 'Supreme joy',
        bondJa: '固い契り',
        bondEn: 'Strong bond',
        healthJa: '活力横溢',
        healthEn: 'Full of vitality',
        wishJa: '即座に成就',
        wishEn: 'Instant fulfillment',
        blessingJa: '幸運の光',
        blessingEn: 'Radiant luck',
        luckyColorJa: '金色',
        luckyColorEn: 'Gold',
        luckyItemJa: '宝珠',
        luckyItemEn: 'Jewel',
        luckyNumber: 88,
      },
    ]

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockDbFortunes,
      })
    )

    const { result } = renderHook(() => useDailyFortunes(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.fortunes).toHaveLength(1)
      expect(result.current.fortunes[0].rankNameJa).toBe('極上大吉')
      expect(result.current.isFallback).toBe(false)
    })
  })

  it('APIエラー時（500エラーやネットワーク切断）に自動で OMIKUJI_FORTUNES へフォールバックすること', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network offline'))
    )

    const { result } = renderHook(() => useDailyFortunes(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.fortunes).toEqual(OMIKUJI_FORTUNES)
      expect(result.current.isFallback).toBe(true)
    })
  })
})
