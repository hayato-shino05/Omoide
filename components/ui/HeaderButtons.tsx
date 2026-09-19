'use client'

import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useUIStore } from '@/lib/stores/uiStore'
import { Icon } from './Icon'

interface HeaderButtonsProps {
  position: 'center' | 'right'
}

export function HeaderButtons({ position }: HeaderButtonsProps) {
  const { t } = useLanguage()
  const { openModal } = useUIStore()

  if (position === 'center') {
    return (
      <button
        type="button"
        className="btn-vintage flex items-center gap-2 px-6 py-3 text-[0.95em] min-h-[44px] cursor-pointer"
        onClick={() => openModal('album')}
        aria-label={t('viewAlbum')}
      >
        <Icon name="Camera" size={20} />
        <span>{t('viewAlbum')}</span>
      </button>
    )
  }

  return (
    <nav aria-label="Quick Actions" className="flex flex-col gap-2.5">
      <button
        type="button"
        className="btn-vintage flex items-center gap-2 px-4 py-2 text-xs min-h-[44px] cursor-pointer"
        onClick={() => openModal('message')}
        aria-label={t('sendMessage')}
      >
        <Icon name="PenLine" size={18} />
        <span>{t('sendMessage')}</span>
      </button>

      <button
        type="button"
        className="btn-vintage flex items-center gap-2 px-4 py-2 text-xs min-h-[44px] cursor-pointer"
        onClick={() => openModal('bulletin')}
        aria-label={t('bulletinBoard')}
      >
        <Icon name="ClipboardList" size={18} />
        <span>{t('bulletinBoard')}</span>
      </button>

      {/* 勉強部屋（コワーキング・共同学習） */}
      <button
        type="button"
        className="btn-vintage flex items-center gap-2 px-4 py-2 text-xs min-h-[44px] cursor-pointer"
        onClick={() => openModal('studyRoom')}
        aria-label={t('studyRoomTitle')}
      >
        <Icon name="BookOpen" size={18} />
        <span>{t('studyRoomTitle')}</span>
      </button>

      {/* 禅・集中モード（ソロ集中・全画面） */}
      <button
        type="button"
        className="btn-vintage flex items-center gap-2 px-4 py-2 text-xs min-h-[44px] cursor-pointer"
        onClick={() => openModal('zenFocus')}
        aria-label={t('studyZenModeTitle')}
      >
        <Icon name="Sparkles" size={18} />
        <span>{t('studyZenModeTitle')}</span>
      </button>

      {/* タイムカプセル */}
      <button
        type="button"
        className="btn-vintage flex items-center gap-2 px-4 py-2 text-xs min-h-[44px] cursor-pointer"
        onClick={() => openModal('timeCapsule')}
        aria-label={t('timeCapsuleTitle')}
      >
        <Icon name="Archive" size={18} />
        <span>{t('timeCapsuleTitle')}</span>
      </button>
    </nav>
  )
}
