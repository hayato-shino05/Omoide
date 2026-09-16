import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SelectedPostRow } from '@/components/community/SelectedPostRow'
import type { TargetPostItem } from '@/components/community/PostPickerModal'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'
import type { ReactNode } from 'react'

const wrapper = ({ children }: { children: ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
)

const mockPost: TargetPostItem = {
  id: 'thread-1',
  type: 'thread',
  sender: 'Alice',
  birthdayPerson: 'Sakura',
  message: 'Happy Birthday Sakura! Have a wonderful year.',
  celebrationDate: '2026-09-15',
  coverUrl: null,
  createdAt: '2026-09-10T10:00:00Z',
}

describe('SelectedPostRow (返信先投稿選択ステータス表示)', () => {
  it('未選択時にCTAトリガーカードが表示され、クリックで onOpenPicker が呼ばれること', () => {
    const onOpenPicker = vi.fn()
    render(<SelectedPostRow onOpenPicker={onOpenPicker} />, { wrapper })

    const ctaButton = screen.getByRole('button', { name: /返信先の投稿を選択する|Select a post to reply to/i })
    expect(ctaButton).toBeInTheDocument()

    fireEvent.click(ctaButton)
    expect(onOpenPicker).toHaveBeenCalled()
  })

  it('選択済時に投稿内容が表示され、「変更」ボタンおよび「解除」ボタンが動作すること', () => {
    const onOpenPicker = vi.fn()
    const onClear = vi.fn()

    render(
      <SelectedPostRow
        post={mockPost}
        onOpenPicker={onOpenPicker}
        onClear={onClear}
      />,
      { wrapper }
    )

    expect(screen.getByText('Sakura')).toBeInTheDocument()
    expect(screen.getByText('Happy Birthday Sakura! Have a wonderful year.')).toBeInTheDocument()

    const changeButton = screen.getByRole('button', { name: /別の投稿を選ぶ|Change Post/i })
    fireEvent.click(changeButton)
    expect(onOpenPicker).toHaveBeenCalled()

    const clearButton = screen.getByRole('button', { name: /解除|Clear/i })
    fireEvent.click(clearButton)
    expect(onClear).toHaveBeenCalled()
  })

  it('ローディング状態が正しく表示されること', () => {
    render(<SelectedPostRow onOpenPicker={vi.fn()} isLoading={true} />, { wrapper })

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/読み込み中|loading/i)).toBeInTheDocument()
  })
})
