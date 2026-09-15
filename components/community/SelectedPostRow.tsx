'use client'

import Image from 'next/image'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { Icon } from '@/components/ui/Icon'
import type { TargetPostItem } from './PostPickerModal'

export interface SelectedPostRowProps {
  post?: TargetPostItem | null
  onOpenPicker: () => void
  onClear?: () => void
  isLoading?: boolean
}

/** 日付文字列を和モダン形式にフォーマット */
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

export function SelectedPostRow({ post, onOpenPicker, onClear, isLoading = false }: SelectedPostRowProps) {
  const { t } = useLanguage()

  // ローディング状態
  if (isLoading) {
    return (
      <section
        className="mb-4 rounded-2xl border border-[#D4B08C]/60 bg-[#FFF9F3] p-4 text-[#854D27]"
        role="status"
        aria-live="polite"
      >
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-[#D4B08C] border-t-[#D95D39] motion-reduce:animate-none"
            aria-hidden="true"
          />
          {t('loading')}
        </span>
      </section>
    )
  }

  // 未選択時（CTAトリガーカード）
  if (!post) {
    return (
      <section className="mb-4" aria-labelledby="selected-post-label">
        <p id="selected-post-label" className="mb-1.5 text-xs font-bold text-[#854D27]">
          {t('selectPostTitle')}
        </p>
        <button
          type="button"
          onClick={onOpenPicker}
          aria-label={t('selectPostToReplyCta')}
          className="flex min-h-[56px] w-full items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-[#D4B08C] bg-orange-50/50 hover:bg-orange-50 px-4 py-3 font-body font-bold text-[#D95D39] transition-all hover:border-[#D95D39] hover:shadow-xs active:scale-[0.99] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D95D39]"
        >
          <span className="inline-flex items-center gap-2.5 min-w-0">
            <span
              className="w-8 h-8 rounded-lg bg-orange-500/15 text-[#D95D39] flex items-center justify-center shrink-0 border border-orange-600/20"
              aria-hidden="true"
            >
              <Icon name="ClipboardList" size={18} useSvg />
            </span>
            <span className="text-sm truncate">{t('selectPostToReplyCta')}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[#D95D39] text-white shrink-0 shadow-2xs font-semibold">
            <span>{t('chooseSong').replace(/曲|Song/g, '選択')}</span>
            <Icon name="ChevronRight" size={14} useSvg />
          </span>
        </button>
      </section>
    )
  }

  // 選択済みカード表示
  const isThread = post.type === 'thread'
  const displayName = post.birthdayPerson || (isThread ? post.message : post.sender)
  const hasCover = isSafeHttpsUrl(post.coverUrl)

  return (
    <section
      className="mb-4 rounded-2xl border-2 border-[#D95D39]/40 bg-[#FFF9F3] p-3.5 shadow-xs transition-all relative overflow-hidden"
      aria-labelledby="selected-post-label"
    >
      {/* 左端アクセントカラーバー */}
      <span
        className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#D95D39]"
        aria-hidden="true"
      />

      <div className="flex items-center justify-between gap-2 mb-2 pl-1.5">
        <p id="selected-post-label" className="text-xs font-bold text-[#854D27] flex items-center gap-1.5">
          <Icon name="CheckCircle2" size={14} className="text-[#D95D39]" useSvg />
          <span>{t('selectPostTitle')}</span>
        </p>
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
      </div>

      <div className="flex min-w-0 items-start gap-3 pl-1.5">
        {/* サムネイル */}
        <div
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border border-[#D4B08C]/60 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shrink-0 shadow-2xs relative"
          aria-hidden="true"
        >
          {hasCover ? (
            <Image
              src={post.coverUrl!}
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

        {/* 投稿情報 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <strong className="block truncate text-sm font-bold text-[#2C1810]">
              {displayName}
            </strong>
            {post.sender && post.sender !== displayName && (
              <span className="text-xs text-[#854D27]/70 truncate">
                ({t('fromSender', { sender: post.sender })})
              </span>
            )}
            {(post.celebrationDate || post.createdAt) && (
              <span className="text-[11px] text-[#854D27]/60 tabular-nums ml-auto">
                {formatDate(post.celebrationDate || post.createdAt)}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-[#5D4037] line-clamp-2 leading-relaxed">
            {post.message}
          </p>
        </div>
      </div>

      {/* アクションボタン（変更・解除） */}
      <div className="mt-3 flex flex-wrap justify-end gap-2 pt-2 border-t border-[#D4B08C]/40">
        <button
          type="button"
          onClick={onOpenPicker}
          aria-label={t('changePost')}
          className="min-h-[40px] px-3.5 py-1.5 rounded-lg border border-[#D95D39] bg-[#D95D39] font-body text-xs font-bold text-white hover:brightness-105 active:scale-95 cursor-pointer transition-all shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D95D39]"
        >
          {t('changePost')}
        </button>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            aria-label={t('clearSelection')}
            className="min-h-[40px] px-3.5 py-1.5 rounded-lg border border-[#D4B08C] bg-transparent font-body text-xs font-semibold text-[#854D27] hover:bg-orange-100/50 active:scale-95 cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D95D39]"
          >
            {t('clearSelection')}
          </button>
        )}
      </div>
    </section>
  )
}
