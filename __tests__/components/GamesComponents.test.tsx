import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'
import { BirthdayQuiz } from '@/components/games/BirthdayQuiz'
import { MemoryGame } from '@/components/games/MemoryGame'
import { MemoryCard } from '@/components/games/MemoryCard'
import { PuzzleGame } from '@/components/games/PuzzleGame'
import { BirthdayCalendar } from '@/components/games/BirthdayCalendar'
import type { ReactNode } from 'react'

// useBirthdays のモック
vi.mock('@/lib/hooks/useBirthdays', () => ({
  useBirthdays: () => ({
    data: [
      { id: '1', name: '太郎', month: 1, day: 15, message: 'おめでとう！' },
      { id: '2', name: '花子', month: 1, day: 20, message: 'ハッピーバースデー' },
      { id: '3', name: '次郎', month: 3, day: 5, message: '素晴らしい一年を' },
      { id: '4', name: '美咲', month: 7, day: 12, message: '健康と幸福を' },
      { id: '5', name: '健太', month: 12, day: 25, message: 'メリー誕生日' },
    ],
  }),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  const TestWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>{children}</LanguageProvider>
    </QueryClientProvider>
  )
  TestWrapper.displayName = 'TestWrapper'
  return TestWrapper
}

describe('Games Components Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('BirthdayQuiz', () => {
    it('初期状態で説明とスタートボタンが表示されること', () => {
      render(<BirthdayQuiz onClose={() => {}} />, { wrapper: createWrapper() })
      expect(screen.getByRole('button', { name: /スタート|Start/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /誕生日クイズ|Quiz/i })).toBeInTheDocument()
    })

    it('スタートボタンを押すとクイズが開始され質問と選択肢が表示されること', () => {
      render(<BirthdayQuiz onClose={() => {}} />, { wrapper: createWrapper() })
      const startBtn = screen.getByRole('button', { name: /スタート|Start/i })
      fireEvent.click(startBtn)

      // プログレスバーが表示される
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      // 選択肢が表示される
      const radioOptions = screen.getAllByRole('radio')
      expect(radioOptions.length).toBeGreaterThanOrEqual(2)

      // 回答をクリックできる
      fireEvent.click(radioOptions[0])
      expect(screen.getByRole('button', { name: /次の問題|結果を見る/i })).toBeInTheDocument()
    })
  })

  describe('MemoryCard & MemoryGame', () => {
    it('MemoryCardがアクセシブルなボタンとしてレンダリングされること', () => {
      const onClick = vi.fn()
      render(
        <MemoryCard
          emoji="🎂"
          isFlipped={false}
          isMatched={false}
          index={0}
          onClick={onClick}
        />
      )
      const cardBtn = screen.getByRole('button', { name: /カード 1: 裏面/i })
      expect(cardBtn).toBeInTheDocument()
      fireEvent.click(cardBtn)
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('MemoryCardが開かれた際に絵柄のaria-labelが反映されること', () => {
      render(
        <MemoryCard
          emoji="🎂"
          isFlipped={true}
          isMatched={true}
          index={0}
          onClick={() => {}}
        />
      )
      const cardBtn = screen.getByRole('button', { name: /カード 1: 🎂（一致）/i })
      expect(cardBtn).toBeInTheDocument()
      expect(cardBtn).toBeDisabled()
    })

    it('MemoryGameがテーマ選択とゲーム開始を適切に行えること', () => {
      render(<MemoryGame onClose={() => {}} />, { wrapper: createWrapper() })
      expect(screen.getByText(/記憶ゲーム|Memory/i)).toBeInTheDocument()

      const startBtn = screen.getByRole('button', { name: /スタート|Start/i })
      fireEvent.click(startBtn)

      // カードグリッドが表示される
      expect(screen.getByRole('grid')).toBeInTheDocument()
      const cards = screen.getAllByRole('button', { name: /カード/i })
      expect(cards.length).toBe(16)
    })
  })

  describe('PuzzleGame', () => {
    it('初期状態で説明とスタートボタンが表示されること', () => {
      render(<PuzzleGame onClose={() => {}} />, { wrapper: createWrapper() })
      expect(screen.getByRole('button', { name: /スタート|Start/i })).toBeInTheDocument()
    })

    it('スタートボタンを押すと3x3のスライドパズル盤面が表示されること', () => {
      render(<PuzzleGame onClose={() => {}} />, { wrapper: createWrapper() })
      const startBtn = screen.getByRole('button', { name: /スタート|Start/i })
      fireEvent.click(startBtn)

      expect(screen.getByRole('grid')).toBeInTheDocument()
      const pieceButtons = screen.getAllByRole('button', { name: /ピース/i })
      expect(pieceButtons.length).toBe(8) // 1〜8のピース (9番目は空スロット)

      // ピースをクリックできる
      fireEvent.click(pieceButtons[0])
    })
  })

  describe('BirthdayCalendar', () => {
    it('月の切り替えナビゲーションと12ヶ月の概要が表示されること', () => {
      render(<BirthdayCalendar onClose={() => {}} />, { wrapper: createWrapper() })
      expect(screen.getByRole('button', { name: /前の月/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /次の月/i })).toBeInTheDocument()

      // 前後ボタンをクリックして月を切り替え
      const nextBtn = screen.getByRole('button', { name: /次の月/i })
      fireEvent.click(nextBtn)

      // 12ヶ月のボタンが存在すること
      const monthButtons = screen.getAllByRole('button', { name: /月/i })
      expect(monthButtons.length).toBeGreaterThanOrEqual(12)
    })

    it('誕生日のある月を選択した際にカードが表示されること', () => {
      render(<BirthdayCalendar onClose={() => {}} />, { wrapper: createWrapper() })
      // 1月を選択 (太郎, 花子)
      const janButton = screen.getAllByRole('button', { name: /1月/i })[0]
      fireEvent.click(janButton)

      expect(screen.getByText('太郎')).toBeInTheDocument()
      expect(screen.getByText('花子')).toBeInTheDocument()
    })
  })
})
