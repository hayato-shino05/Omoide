import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PostPickerModal, { type TargetPostItem } from '@/components/community/PostPickerModal'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'
import type { ReactNode } from 'react'

const wrapper = ({ children }: { children: ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
)

const mockPosts: TargetPostItem[] = [
  {
    id: 'thread-1',
    type: 'thread',
    sender: 'Alice',
    birthdayPerson: 'Sakura',
    message: 'Happy Birthday Sakura! Have a wonderful year.',
    celebrationDate: '2026-09-15',
    coverUrl: 'https://example.com/cover1.jpg',
    createdAt: '2026-09-10T10:00:00Z',
  },
  {
    id: 'post-1',
    type: 'post',
    sender: 'Bob',
    birthdayPerson: 'Kenji',
    message: 'Congratulations Kenji! Best wishes.',
    celebrationDate: '2026-09-18',
    coverUrl: null,
    createdAt: '2026-09-11T12:00:00Z',
  },
  {
    id: 'post-2',
    type: 'post',
    sender: 'Charlie',
    birthdayPerson: null,
    message: 'Welcome everyone to the memory board!',
    celebrationDate: null,
    coverUrl: null,
    createdAt: '2026-09-12T15:00:00Z',
  },
]

describe('PostPickerModal (投稿選択モーダル)', () => {
  it('モーダルが開いているときに投稿一覧が表示されること', () => {
    render(
      <PostPickerModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        posts={mockPosts}
      />,
      { wrapper }
    )

    expect(screen.getByText('Sakura')).toBeInTheDocument()
    expect(screen.getByText('Kenji')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
  })

  it('リアルタイム検索でキーワードに一致する投稿のみが表示されること', () => {
    render(
      <PostPickerModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        posts={mockPosts}
      />,
      { wrapper }
    )

    const searchInput = screen.getByRole('searchbox')
    fireEvent.change(searchInput, { target: { value: 'Sakura' } })

    expect(screen.getByText('Sakura')).toBeInTheDocument()
    expect(screen.queryByText('Kenji')).not.toBeInTheDocument()
    expect(screen.queryByText('Charlie')).not.toBeInTheDocument()
  })

  it('検索クリアボタンでキーワードがクリアされること', () => {
    render(
      <PostPickerModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        posts={mockPosts}
      />,
      { wrapper }
    )

    const searchInput = screen.getByRole('searchbox')
    fireEvent.change(searchInput, { target: { value: 'Sakura' } })

    const clearButton = screen.getByRole('button', { name: /入力を消去|clear/i })
    fireEvent.click(clearButton)

    expect(screen.getByText('Sakura')).toBeInTheDocument()
    expect(screen.getByText('Kenji')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
  })

  it('カテゴリタブでフィルタリングできること', () => {
    render(
      <PostPickerModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        posts={mockPosts}
      />,
      { wrapper }
    )

    // 誕生日スレッドタブをクリック
    const threadTab = screen.getByRole('tab', { name: /誕生日スレッド|Birthday Threads/i })
    fireEvent.click(threadTab)

    expect(screen.getByText('Sakura')).toBeInTheDocument()
    expect(screen.queryByText('Kenji')).not.toBeInTheDocument()
    expect(screen.queryByText('Charlie')).not.toBeInTheDocument()

    // 掲示板投稿タブをクリック
    const postTab = screen.getByRole('tab', { name: /一般投稿|Bulletin Posts/i })
    fireEvent.click(postTab)

    expect(screen.queryByText('Sakura')).not.toBeInTheDocument()
    expect(screen.getByText('Kenji')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
  })

  it('投稿を選択して確定ボタンを押すと onConfirm が呼ばれること', () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()

    render(
      <PostPickerModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        posts={mockPosts}
      />,
      { wrapper }
    )

    // Sakura の投稿をクリックして選択
    const sakuraButton = screen.getByRole('button', { name: /Sakura/i })
    fireEvent.click(sakuraButton)

    // 確定ボタンをクリック
    const confirmButton = screen.getByRole('button', { name: /確認|confirm/i })
    expect(confirmButton).not.toBeDisabled()
    fireEvent.click(confirmButton)

    expect(onConfirm).toHaveBeenCalledWith(mockPosts[0])
    expect(onClose).toHaveBeenCalled()
  })

  it('一致する投稿が0件のときに和風Empty Stateが表示されること', () => {
    render(
      <PostPickerModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        posts={mockPosts}
      />,
      { wrapper }
    )

    const searchInput = screen.getByRole('searchbox')
    fireEvent.change(searchInput, { target: { value: '存在しない名前xyz' } })

    expect(screen.getByText(/一致する投稿が見つかりませんでした|No matching posts found/i)).toBeInTheDocument()
  })
})
