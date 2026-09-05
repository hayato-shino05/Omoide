'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useMusicPlayer } from '@/lib/hooks/useMusicPlayer'
import { Icon } from './Icon'
import SongPickerModal from '@/components/community/SongPickerModal'

export function MusicPlayer() {
  const { t } = useLanguage()
  const { isPlaying, currentTrack, toggle, selectTrack, nextTrack, prevTrack } = useMusicPlayer()
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const handleConfirmTrack = (reference: string) => {
    const separatorIndex = reference.indexOf(':')
    const trackId = separatorIndex >= 0 ? reference.slice(separatorIndex + 1) : reference
    selectTrack(trackId)
    setIsPickerOpen(false)
  }

  const currentReference = currentTrack ? `jamendo:${currentTrack.id}` : ''

  return (
    <div
      className="music-player"
      style={{
        background: 'rgba(255, 249, 243, 0.95)',
        border: '2px solid #D4B08C',
        borderRadius: 0,
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        boxShadow: '4px 4px 0 #D4B08C',
        fontFamily: 'var(--font-body)',
        position: 'relative',
      }}
    >
      {/* 前の曲ボタン */}
      <button
        onClick={prevTrack}
        aria-label={t('previousTrack')}
        style={{
          width: '32px',
          height: '32px',
          background: 'transparent',
          color: '#854D27',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s, opacity 0.2s, filter 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.15)'
          e.currentTarget.style.filter = 'brightness(1.2)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.filter = 'brightness(1)'
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.95)'
          e.currentTarget.style.filter = 'brightness(0.9)'
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1.15)'
          e.currentTarget.style.filter = 'brightness(1.2)'
        }}
      >
        <Icon name="SkipBack" size={22} useSvg={true} className="text-[#854D27]" />
      </button>

      {/* 再生/一時停止ボタン */}
      <button
        onClick={toggle}
        aria-label={isPlaying ? t('pause') : t('play')}
        style={{
          width: '42px',
          height: '42px',
          background: '#854D27',
          color: '#FFF9F3',
          border: '2px solid #D4B08C',
          borderRadius: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2em',
          boxShadow: '2px 2px 0 #D4B08C',
          transition: 'transform 0.2s, box-shadow 0.2s, filter 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translate(-2px, -2px)'
          e.currentTarget.style.boxShadow = '4px 4px 0 #D4B08C'
          e.currentTarget.style.filter = 'brightness(1.15)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translate(0, 0)'
          e.currentTarget.style.boxShadow = '2px 2px 0 #D4B08C'
          e.currentTarget.style.filter = 'brightness(1)'
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'translate(0, 0)'
          e.currentTarget.style.boxShadow = '1px 1px 0 #D4B08C'
          e.currentTarget.style.filter = 'brightness(0.95)'
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'translate(-2px, -2px)'
          e.currentTarget.style.boxShadow = '4px 4px 0 #D4B08C'
          e.currentTarget.style.filter = 'brightness(1.15)'
        }}
      >
        <Icon name={isPlaying ? 'Pause' : 'Play'} size={22} useSvg={true} className="text-[#FFF9F3]" />
      </button>

      {/* 次の曲ボタン */}
      <button
        onClick={nextTrack}
        aria-label={t('nextTrack')}
        style={{
          width: '32px',
          height: '32px',
          background: 'transparent',
          color: '#854D27',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s, opacity 0.2s, filter 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.15)'
          e.currentTarget.style.filter = 'brightness(1.2)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.filter = 'brightness(1)'
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.95)'
          e.currentTarget.style.filter = 'brightness(0.9)'
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1.15)'
          e.currentTarget.style.filter = 'brightness(1.2)'
        }}
      >
        <Icon name="SkipForward" size={22} useSvg={true} className="text-[#854D27]" />
      </button>

      <span
        className="song-title"
        style={{
          color: '#854D27',
          fontSize: '0.95em',
          fontWeight: 500,
          maxWidth: '150px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {currentTrack?.name || t('birthdaySong') || t('chooseSong')}
      </span>

      <button
        onClick={() => setIsPickerOpen(true)}
        aria-label={t('selectMusic')}
        style={{
          padding: '8px 15px',
          background: isPickerOpen ? 'rgba(212, 176, 140, 0.3)' : 'transparent',
          color: '#854D27',
          border: '2px solid #D4B08C',
          borderRadius: 0,
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
          fontSize: '0.85em',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          transition: 'background 0.3s, filter 0.3s',
          minHeight: '44px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.filter = 'brightness(1.15)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = 'brightness(1)'
        }}
      >
        <Icon name="Music" size={20} />
        <span>{t('selectMusic')}</span>
      </button>

      <SongPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onConfirm={handleConfirmTrack}
        initialValue={currentReference}
      />
    </div>
  )
}
