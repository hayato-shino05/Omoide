'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useMessages } from '@/lib/hooks/useMessages'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { parseMusicTrackReference } from '@/lib/music/reference'
import type { TranslationKey } from '@/lib/i18n/types'
import type { CustomMessage } from '@/types'
import { MusicComment } from './MusicComment'

interface MessageListProps {
  limit?: number
}

export function MessageList({ limit }: MessageListProps) {
  const { messages, isLoading, error } = useMessages()
  const { t } = useLanguage()

  const displayMessages = limit ? messages.slice(0, limit) : messages

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <p style={{ color: '#854D27' }}>{t('loading')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <p style={{ color: '#dc3545' }}>{error}</p>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <p style={{ color: '#854D27' }}>{t('noWishes')}</p>
      </div>
    )
  }

  return (
    <div
      role="feed"
      aria-label={t('bulletinBoard')}
      aria-busy={false}
      style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
    >
      {displayMessages.map((msg, index) => (
        <MessageCard
          key={msg.id}
          message={msg}
          index={index}
          total={displayMessages.length}
        />
      ))}
    </div>
  )
}

const avatarStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  flexShrink: 0,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #D4B08C, #854D27)',
  color: '#FFF9F3',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.95rem',
  fontWeight: 700,
  border: '2px solid #D4B08C',
  boxShadow: '1px 1px 0 #D4B08C',
  userSelect: 'none',
}

const attachmentStyle: React.CSSProperties = {
  marginTop: '10px',
  padding: '10px',
  border: '1px solid rgba(212, 176, 140, 0.55)',
  borderRadius: '6px',
  background: 'rgba(255, 249, 243, 0.7)',
  boxShadow: '2px 2px 0 #D4B08C',
}

const providerChipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '1px 6px',
  marginLeft: '6px',
  borderRadius: '999px',
  background: 'rgba(133, 77, 39, 0.16)',
  color: '#854D27',
  fontSize: '0.65rem',
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  verticalAlign: 'middle',
}

function monogramFor(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  const first = Array.from(trimmed)[0] ?? '?'
  return first.toUpperCase()
}

function providerLabel(provider: string, t: (key: TranslationKey) => string): string {
  if (provider === 'jamendo') return t('provider_jamendo')
  if (provider === 'soundcloud') return t('provider_soundcloud')
  return provider
}

function MessageCard({
  message,
  index,
  total,
}: {
  message: CustomMessage
  index: number
  total: number
}) {
  const { locale, t } = useLanguage()
  const prefersReducedMotion = useReducedMotion()
  const musicRef = message.music_track_id
    ? parseMusicTrackReference(message.music_track_id)
    : null
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <motion.article
      role="article"
      aria-posinset={index + 1}
      aria-setsize={total}
      aria-labelledby={`message-${message.id}-sender`}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? undefined : { delay: index * 0.1 }}
      style={{
        padding: '15px',
        background: '#FFF9F3',
        border: '2px solid #D4B08C',
        borderRadius: '8px',
        boxShadow: '3px 3px 0 #D4B08C',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
        <span aria-hidden="true" style={avatarStyle}>
          {monogramFor(message.sender)}
        </span>
        <div style={{ display: 'flex', flex: 1, alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', minWidth: 0 }}>
          <span
            id={`message-${message.id}-sender`}
            style={{ fontWeight: 600, color: '#854D27', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {message.sender}
            {musicRef && (
              <span style={providerChipStyle} aria-label={providerLabel(musicRef.provider, t)}>
                {providerLabel(musicRef.provider, t)}
              </span>
            )}
          </span>
          <span style={{ fontSize: '0.8rem', color: '#854D27', opacity: 0.7, flexShrink: 0 }}>
            {formatDate(message.created_at)}
          </span>
        </div>
      </header>
      <p style={{ color: '#2C1810', margin: 0, lineHeight: 1.6 }}>{message.message}</p>
      {message.music_track_id && (
        <div style={attachmentStyle}>
          <MusicComment trackReference={message.music_track_id} />
        </div>
      )}
    </motion.article>
  )
}
