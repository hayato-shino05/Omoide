'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Post } from '@/lib/hooks/usePosts'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface BulletinPostProps {
  post: Post
  onLike: (postId: string) => Promise<boolean>
  onReply?: () => void
}

export default function BulletinPost({ post, onLike, onReply }: BulletinPostProps) {
  const { locale, t } = useLanguage()
  const [liked, setLiked] = useState(false)
  const [liking, setLiking] = useState(false)
  const [localLikes, setLocalLikes] = useState(post.likes)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    // 完全な日時を表示用に整形
    const fullDate = date.toLocaleString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    const relative = minutes < 1
      ? new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(0, 'minute')
      : minutes < 60
        ? new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-minutes, 'minute')
        : hours < 24
          ? new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-hours, 'hour')
          : days < 7
            ? new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-days, 'day')
            : ''

    return relative ? `${relative} • ${fullDate}` : fullDate
  }

  const handleLike = async () => {
    if (liked || liking) return

    setLiking(true)
    setLiked(true)
    setLocalLikes(prev => prev + 1)

    try {
      const success = await onLike(post.id)
      if (!success) {
        setLiked(false)
        setLocalLikes(prev => prev - 1)
      }
    } catch {
      setLiked(false)
      setLocalLikes(prev => prev - 1)
    } finally {
      setLiking(false)
    }
  }

  return (
    <article
      style={{
        background: '#FFF9F3',
        border: '2px solid #D4B08C',
        borderRadius: '10px',
        padding: '18px',
        boxShadow: '3px 3px 0 #D4B08C',
        cursor: onReply ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
      }}
      onClick={onReply}
      onKeyDown={(e) => {
        if (onReply && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onReply()
        }
      }}
      tabIndex={onReply ? 0 : undefined}
      role={onReply ? 'button' : 'article'}
      aria-label={onReply ? `${post.sender}: ${post.message}` : undefined}
      className={onReply ? 'focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none' : ''}
      onMouseEnter={(e) => {
        if (onReply) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '5px 5px 0 #D4B08C'
          e.currentTarget.style.borderColor = '#854D27'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '3px 3px 0 #D4B08C'
        e.currentTarget.style.borderColor = '#D4B08C'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: '#854D27',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFF9F3',
            fontWeight: 'bold',
            fontSize: '1.05rem',
            flexShrink: 0,
            border: '1.5px solid #D4B08C',
            boxShadow: '1px 1px 0 #D4B08C',
          }}
          aria-hidden="true"
        >
          {post.sender?.[0]?.toUpperCase() || '?'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, color: '#854D27', margin: 0, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {post.sender}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#854D27', opacity: 0.7, margin: '2px 0 0 0' }}>
            {formatDate(post.created_at)}
          </p>
        </div>
      </div>

      <p style={{
        color: '#2C1810',
        marginBottom: '14px',
        whiteSpace: 'pre-wrap',
        fontSize: '0.92rem',
        lineHeight: 1.6,
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {post.message}
      </p>

      {post.media_url && (
        <div style={{ marginBottom: '14px', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1', width: '100%', border: '1px solid #D4B08C', background: '#2C1810' }}>
          {post.media_url.endsWith('.mp4') || post.media_url.endsWith('.webm') || post.media_url.endsWith('.ogg') ? (
            <video
              src={post.media_url}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              muted
              preload="metadata"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.media_url}
              alt={t('mediaAlt')}
              loading="lazy"
              decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(212, 176, 140, 0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleLike}
          disabled={liked || liking}
          aria-label={`${liked ? t('liked') : t('like')} (${localLikes})`}
          className="focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: liked ? 'rgba(217, 93, 57, 0.12)' : 'transparent',
            border: '1.5px solid',
            borderColor: liked ? '#D95D39' : '#D4B08C',
            borderRadius: '20px',
            minHeight: '44px',
            padding: '8px 14px',
            cursor: liked ? 'default' : 'pointer',
            color: liked ? '#D95D39' : '#854D27',
            fontSize: '0.85rem',
            fontWeight: 600,
            transition: 'all 0.2s',
          }}
        >
          <Icon name="Heart" size={18} style={{ color: liked ? '#D95D39' : '#854D27' }} />
          <span>{localLikes}</span>
        </button>

        {onReply && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onReply()
            }}
            aria-label={`${t('reply')} (${post.replies_count || 0})`}
            className="focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              border: '1.5px solid #D4B08C',
              borderRadius: '20px',
              minHeight: '44px',
              padding: '8px 14px',
              cursor: 'pointer',
              color: '#854D27',
              fontSize: '0.85rem',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            <Icon name="MessageCircle" size={18} style={{ color: '#854D27' }} />
            <span>{post.replies_count || 0}</span>
          </button>
        )}
      </div>
    </article>
  )
}
