'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useUIStore } from '@/lib/stores/uiStore'
import { useToast } from '@/components/ui/Toast'
import { buildLineShareUrl } from '@/lib/share'
import { Icon } from './Icon'

interface SocialButtonsProps {
  isZenMode?: boolean
}

export function SocialButtons({ isZenMode = false }: SocialButtonsProps) {
  const { t } = useLanguage()
  const { openModal } = useUIStore()
  const toast = useToast()
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [prevZenMode, setPrevZenMode] = useState(isZenMode)

  // 禅・集中モードへの切り替え時に共有メニューの状態をリセット
  if (isZenMode !== prevZenMode) {
    setPrevZenMode(isZenMode)
    if (isZenMode) {
      setShowShareMenu(false)
    }
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareText = t('allWishesComeTrue')

  const handleShare = async (platform: string) => {
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      line: buildLineShareUrl(t('happyBirthday'), shareText, shareUrl),
      copy: '',
    }

    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(shareUrl)
        toast.success(t('linkCopied'))
      } catch {
        toast.info(t('linkCopied'))
      }
      setShowShareMenu(false)
      return
    }

    if (platform === 'native' && navigator.share) {
      try {
        await navigator.share({ title: t('happyBirthday'), text: shareText, url: shareUrl })
      } catch {
        // ユーザーがキャンセルしました
      }
      setShowShareMenu(false)
      return
    }

    window.open(urls[platform], '_blank', 'width=600,height=400,noopener,noreferrer')
    setShowShareMenu(false)
  }

  return (
    <div className="flex flex-col gap-2.5 relative">
      {/* 友達招待・共有ボタン（禅・集中モード時は非表示） */}
      {!isZenMode && (
        <button
          type="button"
          onClick={() => setShowShareMenu(!showShareMenu)}
          aria-expanded={showShareMenu}
          aria-label={t('inviteFriends')}
          className="btn-vintage flex items-center gap-2 px-4 py-2 text-xs min-h-[44px] cursor-pointer whitespace-nowrap"
        >
          <Icon name="Users" size={20} />
          <span>{t('inviteFriends')}</span>
        </button>
      )}

      {/* シェアメニュー */}
      {!isZenMode && showShareMenu && (
        <div
          role="menu"
          aria-label={t('inviteFriends')}
          className="absolute bottom-full right-0 mb-2.5 bg-[#FFF9F3] border-2 border-[#D4B08C] p-2.5 shadow-[4px_4px_0_#D4B08C] flex flex-col gap-2 min-w-[160px] z-50 rounded-lg"
        >
          {/* Facebook 用シェアボタン */}
          <button
            type="button"
            onClick={() => handleShare('facebook')}
            className="flex items-center gap-2 px-3 py-2 bg-transparent hover:bg-[#FAF0E6] border border-[#D4B08C] text-[#854D27] text-xs font-body transition-colors cursor-pointer rounded"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            <span>Facebook</span>
          </button>
          <button
            type="button"
            onClick={() => handleShare('line')}
            aria-label={t('shareOnLine')}
            className="flex items-center gap-2 px-3 py-2 bg-transparent hover:bg-[#FAF0E6] border border-[#D4B08C] text-[#854D27] text-xs font-body transition-colors cursor-pointer rounded"
          >
            <span className="font-bold text-[#06C755] text-xs">LINE</span>
            <span>LINE</span>
          </button>
          {/* Twitter/X 用シェアボタン */}
          <button
            type="button"
            onClick={() => handleShare('twitter')}
            className="flex items-center gap-2 px-3 py-2 bg-transparent hover:bg-[#FAF0E6] border border-[#D4B08C] text-[#854D27] text-xs font-body transition-colors cursor-pointer rounded"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#000"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            <span>Twitter</span>
          </button>
          {/* WhatsApp 用シェアボタン */}
          <button
            type="button"
            onClick={() => handleShare('whatsapp')}
            className="flex items-center gap-2 px-3 py-2 bg-transparent hover:bg-[#FAF0E6] border border-[#D4B08C] text-[#854D27] text-xs font-body transition-colors cursor-pointer rounded"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            <span>WhatsApp</span>
          </button>
          {/* Telegram 用シェアボタン */}
          <button
            type="button"
            onClick={() => handleShare('telegram')}
            className="flex items-center gap-2 px-3 py-2 bg-transparent hover:bg-[#FAF0E6] border border-[#D4B08C] text-[#854D27] text-xs font-body transition-colors cursor-pointer rounded"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#0088cc"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            <span>Telegram</span>
          </button>
          {/* リンクをコピーするボタン */}
          <button
            type="button"
            onClick={() => handleShare('copy')}
            className="flex items-center gap-2 px-3 py-2 bg-transparent hover:bg-[#FAF0E6] border border-[#D4B08C] text-[#854D27] text-xs font-body transition-colors cursor-pointer rounded"
          >
            <Icon name="Copy" size={18} />
            <span>{t('copyLink')}</span>
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => openModal('chat')}
        aria-label={t('groupChat')}
        className="btn-vintage flex items-center gap-2 px-4 py-2 text-xs min-h-[44px] cursor-pointer whitespace-nowrap"
      >
        <Icon name="MessageCircle" size={20} />
        <span>{t('groupChat')}</span>
      </button>
    </div>
  )
}
