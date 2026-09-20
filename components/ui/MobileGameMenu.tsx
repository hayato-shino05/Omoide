'use client'

import React, { useState, useRef, useEffect, useId, useMemo, useCallback } from 'react'
import { Icon } from './Icon'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useUIStore } from '@/lib/stores/uiStore'
import { GAME_MENU_ITEMS } from './gameConfig'

const menuButtonStyle: React.CSSProperties = {
  minWidth: '44px',
  minHeight: '44px',
  padding: '8px 12px',
  background: '#854D27',
  color: '#FFF9F3',
  border: '2px solid #D4B08C',
  borderRadius: 0,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: '0.7em',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '1px',
  boxShadow: '2px 2px 0 #D4B08C',
  transition: 'transform 0.2s, box-shadow 0.2s',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  whiteSpace: 'nowrap',
}

const menuItemStyle: React.CSSProperties = {
  minHeight: '44px',
  padding: '12px 16px',
  background: 'transparent',
  color: '#FFF9F3',
  border: 'none',
  borderBottom: '1px solid rgba(212, 176, 140, 0.3)',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: '0.85em',
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  width: '100%',
  textAlign: 'left',
  transition: 'background 0.2s',
}

export const MobileGameMenu = React.memo(function MobileGameMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()
  const { t } = useLanguage()
  const openModal = useUIStore((state) => state.openModal)

  const games = useMemo(
    () =>
      GAME_MENU_ITEMS.map((g) => ({
        id: g.id,
        icon: g.icon,
        label: t(g.i18nKey),
      })),
    [t]
  )

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        toggleRef.current?.focus()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleToggle = () => {
    setIsOpen((open) => !open)
  }


  const handleGameClick = (gameId: (typeof GAME_MENU_ITEMS)[number]['id']) => {
    openModal(gameId)
    setIsOpen(false)
  }

  return (
    <div className="mobile-game-menu" ref={menuRef}>

      <button
        ref={toggleRef}
        onClick={handleToggle}
        style={menuButtonStyle}
        className="mobile-game-toggle"
        aria-label={isOpen ? t('closeGameMenu') : t('openGameMenu')}
        aria-expanded={isOpen}
        aria-controls={menuId}
      >
        <Icon name={isOpen ? 'X' : 'Gamepad'} size={16} />
        <span>{t('games')}</span>
      </button>


      {isOpen && (
        <div id={menuId} className="mobile-game-dropdown">
          {games.map((game) => {
            return (
              <button
                key={game.id}
                onClick={() => handleGameClick(game.id)}
                style={menuItemStyle}
                className="mobile-game-item"
              >
                <Icon name={game.icon} size={18} />
                <span>{game.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
})
