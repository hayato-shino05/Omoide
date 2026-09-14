'use client'

import { Icon } from './Icon'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useUIStore } from '@/lib/stores/uiStore'
import { MobileGameMenu } from './MobileGameMenu'

const gameButtonStyle: React.CSSProperties = {
  padding: '10px 20px',
  background: '#854D27',
  color: '#FFF9F3',
  border: '2px solid #D4B08C',
  borderRadius: 0,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: '0.85em',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '1px',
  boxShadow: '4px 4px 0 #D4B08C',
  transition: 'transform 0.3s, box-shadow 0.3s, filter 0.3s',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  whiteSpace: 'nowrap',
}

export function GameButtons() {
  const { t } = useLanguage()
  const { openModal } = useUIStore()

  const games = [
    { id: 'omikuji' as const, icon: 'Sparkles' as const, label: t('omikujiTitle') },
    { id: 'flashback' as const, icon: 'Calendar' as const, label: t('flashbackTitle') },
    { id: 'memoryGame' as const, icon: 'Brain' as const, label: t('memoryGame') },
    { id: 'puzzleGame' as const, icon: 'Puzzle' as const, label: t('puzzleGame') },
    { id: 'calendar' as const, icon: 'Calendar' as const, label: t('birthdayCalendar') },
    { id: 'quiz' as const, icon: 'HelpCircle' as const, label: t('birthdayQuiz') },
  ]

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'translate(-2px, -2px)'
    e.currentTarget.style.boxShadow = '6px 6px 0 #D4B08C'
    e.currentTarget.style.filter = 'brightness(1.15)'
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'translate(0, 0)'
    e.currentTarget.style.boxShadow = '4px 4px 0 #D4B08C'
    e.currentTarget.style.filter = 'brightness(1)'
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'translate(0, 0)'
    e.currentTarget.style.boxShadow = '1px 1px 0 #D4B08C'
    e.currentTarget.style.filter = 'brightness(0.95)'
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'translate(-2px, -2px)'
    e.currentTarget.style.boxShadow = '6px 6px 0 #D4B08C'
    e.currentTarget.style.filter = 'brightness(1.15)'
  }

  return (
    <>
      <div className="games-mobile-only">
        <MobileGameMenu />
      </div>

      <div className="games-container games-desktop-only">
        {games.map((game) => {
          return (
            <button
              key={game.id}
              className="game-button"
              onClick={() => openModal(game.id)}
              style={gameButtonStyle}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            >
              <Icon name={game.icon} size={22} />
              <span>{game.label}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}
