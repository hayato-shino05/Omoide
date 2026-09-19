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
        className="header-btn"
        onClick={() => openModal('album')}
        aria-label={t('viewAlbum')}
        style={{
          padding: '12px 25px',
          background: '#854D27',
          color: '#FFF9F3',
          border: '2px solid #D4B08C',
          borderRadius: 0,
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
          fontSize: '0.95em',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          boxShadow: '4px 4px 0 #D4B08C',
          transition: 'transform 0.3s, box-shadow 0.3s, filter 0.3s',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translate(-2px, -2px)'
          e.currentTarget.style.boxShadow = '6px 6px 0 #D4B08C'
          e.currentTarget.style.filter = 'brightness(1.15)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translate(0, 0)'
          e.currentTarget.style.boxShadow = '4px 4px 0 #D4B08C'
          e.currentTarget.style.filter = 'brightness(1)'
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'translate(0, 0)'
          e.currentTarget.style.boxShadow = '1px 1px 0 #D4B08C'
          e.currentTarget.style.filter = 'brightness(0.95)'
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'translate(-2px, -2px)'
          e.currentTarget.style.boxShadow = '6px 6px 0 #D4B08C'
          e.currentTarget.style.filter = 'brightness(1.15)'
        }}
      >
        <Icon name="Camera" size={22} />
        <span>{t('viewAlbum')}</span>
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <button
        className="header-btn"
        onClick={() => openModal('message')}
        aria-label={t('sendMessage')}
        style={{
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
          boxShadow: '3px 3px 0 #D4B08C',
          transition: 'transform 0.3s, box-shadow 0.3s, filter 0.3s',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translate(-2px, -2px)'
          e.currentTarget.style.boxShadow = '5px 5px 0 #D4B08C'
          e.currentTarget.style.filter = 'brightness(1.15)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translate(0, 0)'
          e.currentTarget.style.boxShadow = '3px 3px 0 #D4B08C'
          e.currentTarget.style.filter = 'brightness(1)'
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'translate(0, 0)'
          e.currentTarget.style.boxShadow = '1px 1px 0 #D4B08C'
          e.currentTarget.style.filter = 'brightness(0.95)'
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'translate(-2px, -2px)'
          e.currentTarget.style.boxShadow = '5px 5px 0 #D4B08C'
          e.currentTarget.style.filter = 'brightness(1.15)'
        }}
      >
        <Icon name="PenLine" size={22} />
        <span>{t('sendMessage')}</span>
      </button>

      <button
        className="header-btn"
        onClick={() => openModal('bulletin')}
        aria-label={t('bulletinBoard')}
        style={{
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
          boxShadow: '3px 3px 0 #D4B08C',
          transition: 'transform 0.3s, box-shadow 0.3s, filter 0.3s',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translate(-2px, -2px)'
          e.currentTarget.style.boxShadow = '5px 5px 0 #D4B08C'
          e.currentTarget.style.filter = 'brightness(1.15)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translate(0, 0)'
          e.currentTarget.style.boxShadow = '3px 3px 0 #D4B08C'
          e.currentTarget.style.filter = 'brightness(1)'
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'translate(0, 0)'
          e.currentTarget.style.boxShadow = '1px 1px 0 #D4B08C'
          e.currentTarget.style.filter = 'brightness(0.95)'
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'translate(-2px, -2px)'
          e.currentTarget.style.boxShadow = '5px 5px 0 #D4B08C'
          e.currentTarget.style.filter = 'brightness(1.15)'
        }}
      >
        <Icon name="ClipboardList" size={22} />
        <span>{t('bulletinBoard')}</span>
      </button>

      {/* 勉強部屋（コワーキング・共同学習） */}
      <button
        className="header-btn"
        onClick={() => openModal('studyRoom')}
        aria-label={t('studyRoomTitle')}
        style={{
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
          boxShadow: '3px 3px 0 #D4B08C',
          transition: 'transform 0.3s, box-shadow 0.3s, filter 0.3s',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translate(-2px, -2px)'
          e.currentTarget.style.boxShadow = '5px 5px 0 #D4B08C'
          e.currentTarget.style.filter = 'brightness(1.15)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translate(0, 0)'
          e.currentTarget.style.boxShadow = '3px 3px 0 #D4B08C'
          e.currentTarget.style.filter = 'brightness(1)'
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'translate(0, 0)'
          e.currentTarget.style.boxShadow = '1px 1px 0 #D4B08C'
          e.currentTarget.style.filter = 'brightness(0.95)'
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'translate(-2px, -2px)'
          e.currentTarget.style.boxShadow = '5px 5px 0 #D4B08C'
          e.currentTarget.style.filter = 'brightness(1.15)'
        }}
      >
        <Icon name="BookOpen" size={22} />
        <span>{t('studyRoomTitle')}</span>
      </button>

      {/* 禅・集中モード（ソロ集中・全画面） */}
      <button
        className="header-btn"
        onClick={() => openModal('zenFocus')}
        aria-label={t('studyZenModeTitle')}
        style={{
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
          boxShadow: '3px 3px 0 #D4B08C',
          transition: 'transform 0.3s, box-shadow 0.3s, filter 0.3s',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translate(-2px, -2px)'
          e.currentTarget.style.boxShadow = '5px 5px 0 #D4B08C'
          e.currentTarget.style.filter = 'brightness(1.15)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translate(0, 0)'
          e.currentTarget.style.boxShadow = '3px 3px 0 #D4B08C'
          e.currentTarget.style.filter = 'brightness(1)'
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'translate(0, 0)'
          e.currentTarget.style.boxShadow = '1px 1px 0 #D4B08C'
          e.currentTarget.style.filter = 'brightness(0.95)'
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'translate(-2px, -2px)'
          e.currentTarget.style.boxShadow = '5px 5px 0 #D4B08C'
          e.currentTarget.style.filter = 'brightness(1.15)'
        }}
      >
        <Icon name="Sparkles" size={22} />
        <span>{t('studyZenModeTitle')}</span>
      </button>

      {/* タイムカプセル */}
      <button
        className="header-btn"
        onClick={() => openModal('timeCapsule')}
        aria-label={t('timeCapsuleTitle')}
        style={{
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
          boxShadow: '3px 3px 0 #D4B08C',
          transition: 'transform 0.3s, box-shadow 0.3s, filter 0.3s',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translate(-2px, -2px)'
          e.currentTarget.style.boxShadow = '5px 5px 0 #D4B08C'
          e.currentTarget.style.filter = 'brightness(1.15)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translate(0, 0)'
          e.currentTarget.style.boxShadow = '3px 3px 0 #D4B08C'
          e.currentTarget.style.filter = 'brightness(1)'
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'translate(0, 0)'
          e.currentTarget.style.boxShadow = '1px 1px 0 #D4B08C'
          e.currentTarget.style.filter = 'brightness(0.95)'
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'translate(-2px, -2px)'
          e.currentTarget.style.boxShadow = '5px 5px 0 #D4B08C'
          e.currentTarget.style.filter = 'brightness(1.15)'
        }}
      >
        <Icon name="Archive" size={22} />
        <span>{t('timeCapsuleTitle')}</span>
      </button>
    </div>
  )
}
