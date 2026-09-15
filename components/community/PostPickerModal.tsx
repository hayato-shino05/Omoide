'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import Image from 'next/image'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { Icon } from '@/components/ui/Icon'
import Modal from '@/components/ui/Modal'

/** 返信先として選択可能な投稿／スレッドの項目データ */
export interface TargetPostItem {
  id: string | number
  type: 'thread' | 'post'
  sender: string
  birthdayPerson: string | null
  message: string
  celebrationDate: string | null
  coverUrl: string | null
  createdAt: string
  likesCount?: number
  repliesCount?: number
}

/** カテゴリフィルターの種類 */
export type PostCategoryFilter = 'all' | 'thread' | 'post'

export interface PostPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (target: TargetPostItem) => void
  initialSelectedId?: string | number | null
  posts?: TargetPostItem[]
  isLoading?: boolean
}

/** 日付文字列を和モダンで読みやすい形式にフォーマット */
const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  } catch {
    return dateStr
  }
}

/** 有効なHTTPS画像URLかチェック */
const isSafeHttpsUrl = (value: string | null | undefined): value is string => {
  if (!value) return false
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

export default function PostPickerModal({
  isOpen,
  onClose,
  onConfirm,
  initialSelectedId,
  posts = [],
  isLoading = false,
}: PostPickerModalProps) {
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<PostCategoryFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedId ? String(initialSelectedId) : null
  )
  const [activeIndex, setActiveIndex] = useState(-1)
  const listboxId = useId()
  const listRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  // モーダル表示時の初期化
  useEffect(() => {
    if (!isOpen) return
    setSelectedId(initialSelectedId ? String(initialSelectedId) : null)
    setQuery('')
    setCategoryFilter('all')
    setActiveIndex(-1)
  }, [initialSelectedId, isOpen])

  // カテゴリ別の件数集計
  const counts = useMemo(() => {
    let threadCount = 0
    let postCount = 0
    for (const post of posts) {
      if (post.type === 'thread') threadCount++
      else postCount++
    }
    return {
      all: posts.length,
      thread: threadCount,
      post: postCount,
    }
  }, [posts])

  // 検索クエリとカテゴリによるフィルタリング
  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return posts.filter((post) => {
      // 1. カテゴリ一致チェック
      if (categoryFilter !== 'all' && post.type !== categoryFilter) {
        return false
      }

      // 2. 検索キーワード一致チェック
      if (!normalizedQuery) return true

      const senderMatch = post.sender?.toLowerCase().includes(normalizedQuery)
      const personMatch = post.birthdayPerson?.toLowerCase().includes(normalizedQuery)
      const messageMatch = post.message?.toLowerCase().includes(normalizedQuery)
      const celebrationMatch = post.celebrationDate?.toLowerCase().includes(normalizedQuery)
      const createdMatch = post.createdAt?.toLowerCase().includes(normalizedQuery)

      return Boolean(senderMatch || personMatch || messageMatch || celebrationMatch || createdMatch)
    })
  }, [posts, categoryFilter, query])

  // 選択中の投稿
  const selectedPost = useMemo(() => {
    if (!selectedId) return null
    return posts.find((p) => String(p.id) === selectedId) ?? null
  }, [posts, selectedId])

  const optionId = (id: string | number) => `${listboxId}-option-${String(id).replace(/[^a-zA-Z0-9_-]/g, '_')}`

  // 検索クリア
  const handleClearQuery = () => {
    setQuery('')
    searchInputRef.current?.focus()
  }

  // 選択確定
  const handleConfirm = () => {
    if (selectedPost) {
      onConfirm(selectedPost)
      onClose()
    }
  }

  // キーボード操作で項目をフォーカス
  const focusOption = (index: number) => {
    setActiveIndex(index)
    requestAnimationFrame(() => {
      if (!filteredPosts[index]) return
      const option = document.getElementById(optionId(filteredPosts[index].id))
      if (!option || !listRef.current?.contains(option)) return
      option.focus()
      option.scrollIntoView({ block: 'nearest' })
    })
  }

  const handleOptionKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (filteredPosts.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusOption((index + 1) % filteredPosts.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusOption((index - 1 + filteredPosts.length) % filteredPosts.length)
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusOption(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusOption(filteredPosts.length - 1)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setSelectedId(String(filteredPosts[index].id))
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2.5">
          <span
            className="w-8 h-8 rounded-lg bg-orange-500/15 text-[#D95D39] flex items-center justify-center border border-orange-600/20"
            aria-hidden="true"
          >
            <Icon name="ClipboardList" size={18} useSvg />
          </span>
          <span>{t('selectPostTitle')}</span>
        </span>
      }
      description={
        <span className="inline-flex items-center gap-1.5 text-xs text-[#854D27]/80 font-medium">
          <span>{t('selectPostSubtitle')}</span>
        </span>
      }
      size="widescreen"
      variant="default"
      initialFocusRef={searchInputRef}
    >
      <div className="relative w-full max-w-5xl rounded-xl transition-all duration-200 ease-out flex flex-col gap-4 text-[#2C1810] font-body">
        {/* 検索バー＆フィルタータブ */}
        <div className="flex flex-col gap-3">
          {/* 検索入力フォーム */}
          <form
            id={`${listboxId}-search-form`}
            className="flex items-center gap-2"
            onSubmit={(e: FormEvent) => e.preventDefault()}
          >
            <label htmlFor={`${listboxId}-input`} className="sr-only">
              {t('postSearchPlaceholder')}
            </label>
            <div className="relative flex-1 min-w-0">
              <span
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#854D27]/50 pointer-events-none flex items-center justify-center"
                aria-hidden="true"
              >
                <Icon name="Search" size={18} useSvg />
              </span>
              <input
                ref={searchInputRef}
                id={`${listboxId}-input`}
                type="search"
                value={query}
                maxLength={100}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActiveIndex(-1)
                }}
                placeholder={t('postSearchPlaceholder')}
                className="w-full min-h-[44px] pl-10 pr-12 py-2.5 rounded-xl border border-[#D4B08C] bg-[#FFF9F3] text-[#2C1810] placeholder:text-[#854D27]/50 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D95D39] text-sm transition-all duration-150 shadow-2xs hover:border-[#D95D39]/50 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-ms-clear]:hidden"
                aria-controls={listboxId}
              />
              {query.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearQuery}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full text-[#854D27]/60 hover:text-[#854D27] hover:bg-orange-100/50 active:scale-95 cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-[#D95D39]"
                  aria-label={t('clear')}
                >
                  <Icon name="X" size={16} useSvg />
                </button>
              )}
            </div>
          </form>

          {/* カテゴリフィルタータブ */}
          <div
            role="tablist"
            aria-label={t('selectPostTitle')}
            className="flex items-center gap-1.5 p-1 rounded-xl bg-orange-950/5 border border-[#D4B08C]/40 overflow-x-auto"
          >
            {/* すべて */}
            <button
              type="button"
              role="tab"
              aria-selected={categoryFilter === 'all'}
              onClick={() => {
                setCategoryFilter('all')
                setActiveIndex(-1)
              }}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-[#FFF9F3] text-[#D95D39] shadow-2xs border border-[#D4B08C]'
                  : 'text-[#854D27]/80 hover:text-[#854D27] hover:bg-white/40'
              }`}
            >
              <span>{t('allCategories')}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-orange-100/70 text-[#854D27]">
                {counts.all}
              </span>
            </button>

            {/* 誕生日スレッド */}
            <button
              type="button"
              role="tab"
              aria-selected={categoryFilter === 'thread'}
              onClick={() => {
                setCategoryFilter('thread')
                setActiveIndex(-1)
              }}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                categoryFilter === 'thread'
                  ? 'bg-[#FFF9F3] text-[#E91E63] shadow-2xs border border-pink-300'
                  : 'text-[#854D27]/80 hover:text-[#854D27] hover:bg-white/40'
              }`}
            >
              <Icon name="Cake" size={13} className="text-pink-600" />
              <span>{t('birthdayCategory')}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-pink-100 text-pink-700">
                {counts.thread}
              </span>
            </button>

            {/* 掲示板投稿 */}
            <button
              type="button"
              role="tab"
              aria-selected={categoryFilter === 'post'}
              onClick={() => {
                setCategoryFilter('post')
                setActiveIndex(-1)
              }}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                categoryFilter === 'post'
                  ? 'bg-[#FFF9F3] text-[#2D8CFF] shadow-2xs border border-blue-300'
                  : 'text-[#854D27]/80 hover:text-[#854D27] hover:bg-white/40'
              }`}
            >
              <Icon name="ClipboardList" size={13} className="text-blue-600" />
              <span>{t('bulletinCategory')}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-700">
                {counts.post}
              </span>
            </button>
          </div>
        </div>

        {/* 投稿縦スクロール一覧 */}
        <div
          ref={listRef}
          id={listboxId}
          role="list"
          aria-label={t('selectPostTitle')}
          className="flex-1 min-h-[240px] sm:min-h-[360px] max-h-[48vh] sm:max-h-[54vh] overflow-y-auto rounded-2xl border border-[#D4B08C]/60 bg-[#FFFDFB] p-2 sm:p-2.5 space-y-2 shadow-inner"
        >
          {/* ローディング表示 */}
          {isLoading && (
            <div role="status" aria-live="polite" className="p-4 space-y-3">
              <div className="flex items-center justify-center gap-2.5 py-4 text-xs font-semibold text-[#854D27]">
                <span
                  className="w-4 h-4 rounded-full border-2 border-[#D4B08C] border-t-[#D95D39] animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
                <span>{t('loading')}</span>
              </div>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl border border-[#D4B08C]/20 bg-orange-50/30 animate-pulse"
                  aria-hidden="true"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#D4B08C]/20 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-[#D4B08C]/25 rounded-md" />
                    <div className="h-3 w-3/4 bg-[#D4B08C]/15 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 投稿カード一覧 */}
          {!isLoading &&
            filteredPosts.map((item, index) => {
              const isSelected = selectedId === String(item.id)
              const isActive = index === activeIndex
              const isThread = item.type === 'thread'
              const displayName = item.birthdayPerson || (isThread ? item.message : item.sender)
              const hasCover = isSafeHttpsUrl(item.coverUrl)

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  role="listitem"
                  className={`group/item relative flex items-start justify-between gap-3 p-3 sm:p-3.5 rounded-xl border transition-all duration-150 ${
                    isSelected
                      ? 'border-[#D95D39] bg-[#FFF5F0] shadow-2xs ring-1 ring-[#D95D39]/30'
                      : 'border-transparent bg-white/70 hover:border-[#D4B08C] hover:bg-[#FFF9F3] hover:shadow-2xs'
                  } ${isActive && !isSelected ? 'ring-2 ring-[#D95D39]/40 ring-offset-1' : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  {/* 左端のアクティブライン */}
                  {isSelected && (
                    <span
                      className="absolute left-0 top-3 bottom-3 w-1.5 bg-[#D95D39] rounded-r-full"
                      aria-hidden="true"
                    />
                  )}

                  <button
                    id={optionId(item.id)}
                    type="button"
                    className="flex items-start gap-3 min-w-0 flex-1 text-left cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D95D39] rounded-lg p-0.5"
                    onClick={() => setSelectedId(String(item.id))}
                    onKeyDown={(e) => handleOptionKeyDown(e, index)}
                    aria-label={`${isThread ? t('postTypeThread') : t('postTypeBulletin')}: ${displayName}`}
                    aria-pressed={isSelected}
                    tabIndex={isActive || (activeIndex < 0 && index === 0) ? 0 : -1}
                  >
                    {/* サムネイル／アバター */}
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14 min-w-[48px] min-h-[48px] rounded-xl overflow-hidden border border-[#D4B08C]/50 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center relative flex-shrink-0 shadow-2xs"
                      aria-hidden="true"
                    >
                      {hasCover ? (
                        <Image
                          src={item.coverUrl!}
                          alt=""
                          width={56}
                          height={56}
                          unoptimized
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.hidden = true
                            e.currentTarget.parentElement?.querySelector('[data-avatar-fallback]')?.removeAttribute('hidden')
                          }}
                        />
                      ) : null}
                      <span
                        data-avatar-fallback
                        hidden={hasCover}
                        className="font-heading font-bold text-base text-[#854D27]"
                      >
                        {displayName ? displayName[0]?.toUpperCase() : '?'}
                      </span>
                    </div>

                    {/* 投稿詳細 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* 種別バッジ */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            isThread
                              ? 'bg-pink-50 border-pink-200 text-pink-700'
                              : 'bg-blue-50 border-blue-200 text-blue-700'
                          }`}
                        >
                          <Icon name={isThread ? 'Cake' : 'ClipboardList'} size={11} useSvg />
                          <span>{isThread ? t('postTypeThread') : t('postTypeBulletin')}</span>
                        </span>

                        {/* 日付 */}
                        {(item.celebrationDate || item.createdAt) && (
                          <span className="text-[11px] font-medium text-[#854D27]/70 tabular-nums">
                            {formatDate(item.celebrationDate || item.createdAt)}
                          </span>
                        )}

                        {/* 選択済みバッジ */}
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D95D39] text-white shadow-2xs ml-auto">
                            <Icon name="CircleCheck" size={12} useSvg aria-hidden="true" />
                            <span>{t('postSelected')}</span>
                          </span>
                        )}
                      </div>

                      {/* 対象者／投稿者名 */}
                      <div className="mt-1 flex items-baseline gap-1.5 truncate">
                        <strong className="text-sm font-bold text-[#2C1810] truncate group-hover/item:text-[#D95D39] transition-colors">
                          {displayName}
                        </strong>
                        {item.sender && item.sender !== displayName && (
                          <span className="text-xs text-[#854D27]/70 truncate">
                            ({t('fromSender', { sender: item.sender })})
                          </span>
                        )}
                      </div>

                      {/* メッセージ本文 */}
                      <p className="mt-1 text-xs text-[#5D4037] line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                    </div>
                  </button>

                  {/* 選択切り替えボタン */}
                  <button
                    type="button"
                    onClick={() => setSelectedId(String(item.id))}
                    className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 shrink-0 self-center ${
                      isSelected
                        ? 'bg-[#D95D39] text-white shadow-xs'
                        : 'border border-[#D4B08C]/60 bg-white text-[#854D27]/40 hover:text-[#D95D39] hover:border-[#D95D39] hover:bg-orange-50'
                    }`}
                    aria-label={isSelected ? t('postSelected') : t('selectPostTitle')}
                  >
                    {isSelected ? (
                      <Icon name="CircleCheck" size={18} useSvg />
                    ) : (
                      <span className="w-4 h-4 rounded-full border-2 border-[#D4B08C]" aria-hidden="true" />
                    )}
                  </button>
                </div>
              )
            })}

          {/* 検索0件時のEmpty State */}
          {!isLoading && filteredPosts.length === 0 && (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-3 text-[#854D27]/70 min-h-[220px]">
              <div className="w-14 h-14 rounded-2xl bg-orange-100/60 border border-[#D4B08C]/40 flex items-center justify-center text-[#D95D39] shadow-2xs">
                <Icon name="Search" size={24} useSvg aria-hidden="true" />
              </div>
              <div className="space-y-1 max-w-sm">
                <p className="text-sm font-bold text-[#2C1810]">{t('noMatchingPosts')}</p>
                <p className="text-xs text-[#854D27]/70">
                  {query ? `"${query}" に一致する投稿はありません` : t('noPostsToReply')}
                </p>
              </div>
              {query && (
                <button
                  type="button"
                  onClick={handleClearQuery}
                  className="min-h-[44px] px-4 py-1.5 rounded-xl border border-[#D4B08C] bg-white text-xs font-bold text-[#854D27] hover:bg-orange-50 active:scale-95 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D95D39]"
                >
                  {t('clear')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-3 border-t border-[#D4B08C]/50">
          <div className="flex-1 min-w-[180px] text-xs font-semibold text-[#2C1810] truncate" aria-live="polite">
            {selectedPost ? (
              <span className="inline-flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-[#D95D39] flex-shrink-0" aria-hidden="true" />
                <span className="text-[#854D27]/70">{t('replyTargetPost', { name: '' }).replace(/さんへ返信|To /g, '')}:</span>
                <strong className="text-[#D95D39] font-bold truncate">
                  {selectedPost.birthdayPerson || selectedPost.sender}
                </strong>
              </span>
            ) : (
              <span className="text-[#854D27]/70">{t('selectPostHint')}</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D4B08C] bg-transparent text-xs font-bold text-[#854D27] hover:bg-orange-50 active:scale-95 cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-[#D95D39]"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedPost}
              className="min-h-[44px] px-6 py-2 rounded-xl bg-[#D95D39] text-white text-xs font-bold shadow-xs hover:shadow-sm hover:brightness-105 active:translate-y-0.5 active:scale-[0.98] cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[#D95D39]"
            >
              {t('confirm')}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
