'use client'

import { useState } from 'react'
import { LanguageSelector } from '@/components/ui/LanguageSelector'
import { Icon } from '@/components/ui/Icon'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface HeaderProps {
  title?: string
  showLanguageSelector?: boolean
  onMenuClick?: () => void
}

export default function Header({ title, showLanguageSelector = true, onMenuClick }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { t } = useLanguage()

  return (
    <header className="fixed top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 z-50">
      <div className="bg-[#FFF9F3]/90 dark:bg-stone-900/90 backdrop-blur-md rounded-2xl border-2 border-[#D4B08C] shadow-[4px_4px_0_#D4B08C] px-3.5 sm:px-5 py-2.5 sm:py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* ロゴ / タイトル */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 rounded-full bg-[#854D27] border border-[#D4B08C] flex items-center justify-center text-[#FFF9F3] shadow-xs">
              <span aria-hidden="true"><Icon name="Cake" size={20} className="text-[#FBE8D3]" /></span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-[#854D27] dark:text-stone-100 font-heading hidden xs:block sm:block">
              {title || t('happyBirthday')}
            </h1>
          </div>

          {/* デスクトップ用ナビゲーション */}
          <nav aria-label="Navigation" className="hidden md:flex items-center gap-4">
            {showLanguageSelector && <LanguageSelector />}
          </nav>

          {/* モバイルメニューのボタン */}
          <button
            onClick={() => {
              setIsMobileMenuOpen(!isMobileMenuOpen)
              onMenuClick?.()
            }}
            className="md:hidden w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-[#FFF9F3] dark:bg-stone-800 border-2 border-[#D4B08C] flex items-center justify-center text-[#854D27] dark:text-stone-100 hover:bg-[#FAF0E6] active:scale-[0.96] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#854D27]"
            aria-expanded={isMobileMenuOpen}
            aria-controls="header-mobile-menu"
            aria-label={t('menu')}
          >
            <span aria-hidden="true">
              <Icon name={isMobileMenuOpen ? 'X' : 'Menu'} size={20} />
            </span>
          </button>
        </div>

        {/* モバイルメニュー */}
        {isMobileMenuOpen && (
          <div id="header-mobile-menu" className="md:hidden mt-3 pt-3 border-t border-[#D4B08C]/40">
            <div className="flex flex-col gap-2">
              {showLanguageSelector && (
                <div className="py-2">
                  <LanguageSelector />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
