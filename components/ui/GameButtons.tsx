'use client'

import React, { useMemo } from 'react'
import { Icon } from './Icon'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useUIStore } from '@/lib/stores/uiStore'
import { MobileGameMenu } from './MobileGameMenu'

export const GameButtons = React.memo(function GameButtons() {
  const { t } = useLanguage()
  const openModal = useUIStore((state) => state.openModal)

  const games = useMemo(
    () => [
      { id: 'omikuji' as const, icon: 'Sparkles' as const, label: t('omikujiTitle') },
      { id: 'flashback' as const, icon: 'Calendar' as const, label: t('flashbackTitle') },
      { id: 'memoryGame' as const, icon: 'Brain' as const, label: t('memoryGame') },
      { id: 'puzzleGame' as const, icon: 'Puzzle' as const, label: t('puzzleGame') },
      { id: 'calendar' as const, icon: 'Calendar' as const, label: t('birthdayCalendar') },
      { id: 'quiz' as const, icon: 'HelpCircle' as const, label: t('birthdayQuiz') },
    ],
    [t]
  )

  return (
    <>
      <div className="games-mobile-only">
        <MobileGameMenu />
      </div>

      <nav aria-label={t('games')} className="games-container games-desktop-only">
        {games.map((game) => {
          return (
            <button
              key={game.id}
              type="button"
              className="game-button btn-vintage flex items-center gap-1.5 px-4 py-2 text-xs min-h-[44px] cursor-pointer whitespace-nowrap active:scale-[0.96] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#854D27]"
              onClick={() => openModal(game.id)}
            >
              <Icon name={game.icon} size={18} aria-hidden="true" />
              <span>{game.label}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
})
