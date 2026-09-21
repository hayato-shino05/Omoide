'use client'

import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { buildLineShareUrl } from '@/lib/share'

interface ShareButtonProps {
  url?: string
  title?: string
  text?: string
}

export default function ShareButton({ url, title, text }: ShareButtonProps) {
  const { t } = useLanguage()
  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
  const shareTitle = title || t('happyBirthday')
  const shareText = text || t('allWishesComeTrue')

  useEffect(() => {
    if (!showMenu) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMenu(false)
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl })
      } catch {
        // ユーザーがキャンセルしました
      }
    } else {
      setShowMenu(!showMenu)
    }
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
      setShowMenu(false)
    }, 1500)
  }

  const shareLinks = [
    {
      name: 'Facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      icon: (
        <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: 'LINE',
      url: buildLineShareUrl(shareTitle, shareText, shareUrl),
      icon: <span className="font-bold text-[#06C755] text-xs" aria-hidden="true">LINE</span>,
    },
    {
      name: 'Twitter',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: 'WhatsApp',
      url: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
      icon: (
        <svg className="w-5 h-5" fill="#25D366" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={handleNativeShare}
        aria-expanded={showMenu}
        aria-haspopup="menu"
        className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#FFF9F3] dark:bg-stone-900 border-2 border-[#D4B08C] shadow-[2px_2px_0_#D4B08C] hover:shadow-[3px_3px_0_#D4B08C] hover:bg-[#FAF0E6] flex items-center justify-center text-[#854D27] dark:text-[#D4B08C] transition-all active:scale-[0.96] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#854D27]"
        aria-label={t('share')}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      </button>

      {showMenu && (
        <div
          role="menu"
          aria-label={t('share')}
          className="absolute right-0 mt-2 w-52 bg-[#FFF9F3] dark:bg-stone-900 rounded-xl border-2 border-[#D4B08C] shadow-[6px_6px_0_#D4B08C] p-1.5 z-50 flex flex-col gap-1"
        >
          {shareLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              role="menuitem"
              aria-label={link.name === 'LINE' ? t('shareOnLine') : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#854D27] dark:text-stone-200 hover:bg-[#FAF0E6] dark:hover:bg-stone-800 rounded-lg transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#854D27]"
              onClick={() => setShowMenu(false)}
            >
              {link.icon}
              <span>{link.name}</span>
            </a>
          ))}
          <button
            onClick={handleCopyLink}
            role="menuitem"
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#854D27] dark:text-stone-200 hover:bg-[#FAF0E6] dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#854D27]"
          >
            <svg className="w-5 h-5 text-[#854D27] dark:text-[#D4B08C]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            <span>{copied ? t('copied') : t('copyLink')}</span>
          </button>
        </div>
      )}
    </div>
  )
}
