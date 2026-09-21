import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BirthdayCake } from '@/components/features/BirthdayCake'
import { BlowButton } from '@/components/features/BlowButton'
import { PhotoCard } from '@/components/features/PhotoCard'
import { TagInput } from '@/components/features/TagInput'
import { OnThisDayFlashback } from '@/components/features/OnThisDayFlashback'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'
import type { ReactNode } from 'react'
import type { MediaFile } from '@/types'

// Mock Supabase client
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
  <LanguageProvider>{children}</LanguageProvider>
)

describe('Birthday Features & Media Components', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('BlowButton', () => {
    it('allCandlesBlownがfalseの場合にボタンが表示され、クリックでコールバックが呼ばれること', () => {
      const onClick = vi.fn()
      render(<BlowButton onClick={onClick} allCandlesBlown={false} />, { wrapper })

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('min-h-12')

      fireEvent.click(button)
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('allCandlesBlownがtrueの場合はボタンが非表示になること', () => {
      const onClick = vi.fn()
      const { container } = render(<BlowButton onClick={onClick} allCandlesBlown={true} />, { wrapper })
      expect(container.firstChild).toBeNull()
    })
  })

  describe('BirthdayCake', () => {
    it('ケーキとろうそく、マイクボタンが正常にレンダリングされること', () => {
      render(<BirthdayCake candleCount={5} />, { wrapper })
      const blowButton = screen.getByRole('button', { name: /ろうそくを吹いて！|Blow/i })
      expect(blowButton).toBeInTheDocument()
    })
  })

  describe('PhotoCard', () => {
    const mockMedia: MediaFile = {
      id: 1,
      file_name: 'sakura_memory.jpg',
      file_path: 'https://example.com/sakura.jpg',
      file_type: 'image',
      file_size: 102400,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    it('写真カードがアクセシブルにレンダリングされ、クリックやキーボード操作で選択できること', () => {
      const onClick = vi.fn()
      render(<PhotoCard media={mockMedia} onClick={onClick} />, { wrapper })

      const card = screen.getByRole('button', { name: /sakura_memory\.jpg/i })
      expect(card).toBeInTheDocument()

      fireEvent.click(card)
      expect(onClick).toHaveBeenCalledTimes(1)

      fireEvent.keyDown(card, { key: 'Enter' })
      expect(onClick).toHaveBeenCalledTimes(2)
    })
  })

  describe('TagInput', () => {
    it('タグ一覧が表示され、新しいタグの追加およびタグの削除ができること', () => {
      const onChange = vi.fn()
      render(<TagInput tags={['birthday', 'party']} onChange={onChange} />, { wrapper })

      expect(screen.getByText('#birthday')).toBeInTheDocument()
      expect(screen.getByText('#party')).toBeInTheDocument()

      // タグ削除ボタンをクリック
      const deleteButtons = screen.getAllByRole('button', { name: /リセット|reset/i })
      expect(deleteButtons.length).toBe(2)
      fireEvent.click(deleteButtons[0])
      expect(onChange).toHaveBeenCalledWith(['party'])

      // 新しいタグを入力してEnter
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'tokyo' } })
      fireEvent.keyDown(input, { key: 'Enter' })
      expect(onChange).toHaveBeenCalledWith(['birthday', 'party', 'tokyo'])
    })
  })

  describe('OnThisDayFlashback', () => {
    it('記録がない場合に親切な空状態とアクションボタンが表示されること', async () => {
      render(<OnThisDayFlashback />, { wrapper })

      await waitFor(() => {
        expect(screen.getByText(/今日の思い出を紡ぐ|Weave today's memories/i)).toBeInTheDocument()
      })

      const sendButton = screen.getByRole('button', { name: /お祝いメッセージ|Send wish/i })
      const albumButton = screen.getByRole('button', { name: /思い出アルバム|View Album/i })
      expect(sendButton).toBeInTheDocument()
      expect(albumButton).toBeInTheDocument()
      expect(sendButton).toHaveClass('min-h-11')
      expect(albumButton).toHaveClass('min-h-11')
    })
  })
})
