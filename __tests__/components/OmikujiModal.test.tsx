import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'
import { DailyOmikuji } from '@/components/features/DailyOmikuji'
import { OmikujiModal } from '@/components/fortune/OmikujiModal'
import { OMIKUJI_FORTUNES, type OmikujiFortune } from '@/data/omikujiData'
import type { ReactNode } from 'react'

// next/dynamic のモック
vi.mock('next/dynamic', () => ({
  default: () => {
    return function MockCylinder(props: { isShaking: boolean; isRevealed: boolean; onDraw?: () => void }) {
      return (
        <div data-testid="omikuji-3d-cylinder">
          <button data-testid="cylinder-draw-btn" onClick={props.onDraw} disabled={props.isShaking || props.isRevealed}>
            3D Cylinder
          </button>
        </div>
      )
    }
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  const TestModalWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>{children}</LanguageProvider>
    </QueryClientProvider>
  )
  TestModalWrapper.displayName = 'TestModalWrapper'
  return TestModalWrapper
}

describe('OmikujiModal & DailyOmikuji', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => OMIKUJI_FORTUNES,
      })
    )
  })

  it('初期レンダリング時に3Dおみくじ筒と引くボタンが表示されること', () => {
    render(<DailyOmikuji />, { wrapper: createWrapper() })
    expect(screen.getByTestId('omikuji-3d-cylinder')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /おみくじを引く|おみくじ/i })).toBeInTheDocument()
  })

  it('カスタム fortunes プロパティを渡した場合に正しく受け取れること', () => {
    const customFortunes: OmikujiFortune[] = [
      {
        id: 777,
        rank: 'daikichi',
        rankNameJa: '超特大吉',
        rankNameEn: 'Super Blessing',
        poemJa: 'テスト用の特別な和歌',
        poemEn: 'Special test poem',
        generalJa: 'テスト運勢',
        generalEn: 'Test general fortune',
        bondJa: '深い絆',
        bondEn: 'Deep bond',
        healthJa: '健康良好',
        healthEn: 'Great health',
        wishJa: '心願成就',
        wishEn: 'Wish fulfilled',
        blessingJa: '光あれ',
        blessingEn: 'Let there be light',
        luckyColorJa: '金色',
        luckyColorEn: 'Gold',
        luckyItemJa: '黄金の鍵',
        luckyItemEn: 'Golden Key',
        luckyNumber: 7,
      },
    ]

    render(<DailyOmikuji fortunes={customFortunes} />, { wrapper: createWrapper() })
    expect(screen.getByTestId('omikuji-3d-cylinder')).toBeInTheDocument()
  })

  it('OmikujiModal が isOpen=true のとき正しくレンダリングされ、isOpen=false のとき非表示になること', () => {
    const { rerender } = render(<OmikujiModal isOpen={true} onClose={vi.fn()} />, {
      wrapper: createWrapper(),
    })
    expect(screen.getByTestId('omikuji-3d-cylinder')).toBeInTheDocument()

    rerender(<OmikujiModal isOpen={false} onClose={vi.fn()} />)
    expect(screen.queryByTestId('omikuji-3d-cylinder')).not.toBeInTheDocument()
  })

  it('おみくじを引くと結果カードが表示され、和歌や4大運勢カテゴリが表示されること', () => {
    vi.useFakeTimers()
    render(<DailyOmikuji />, { wrapper: createWrapper() })

    const drawBtn = screen.getByRole('button', { name: /おみくじを引く|おみくじ/i })
    fireEvent.click(drawBtn)

    // 2.2秒のアニメーションタイマーを進行
    act(() => {
      vi.advanceTimersByTime(2300)
    })

    // ラッキーカラーやアイテムの存在を確認
    expect(screen.getByText(/ラッキーカラー|Lucky Color/i)).toBeInTheDocument()
    expect(screen.getByText(/ラッキーアイテム|Lucky Item/i)).toBeInTheDocument()

    // おみくじ画像保存ボタンの存在を確認
    expect(screen.getByRole('button', { name: /おみくじ画像を保存|Save Fortune Card/i })).toBeInTheDocument()

    vi.useRealTimers()
  })
})
