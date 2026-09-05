'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePosts, Post } from '@/lib/hooks/usePosts'
import { Icon } from '@/components/ui/Icon'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import BulletinPost from './BulletinPost'
import PostDetail from './PostDetail'

interface BirthdayThread {
  id: string
  sender: string
  message: string
  birthday_person: string | null
  celebration_date: string | null
  timezone: string | null
  created_at: string
  coverUrl: string | null
}

function toPost(thread: BirthdayThread): Post {
  return {
    id: thread.id,
    sender: thread.sender,
    message: thread.message,
    media_object_path: null,
    birthday_person: thread.birthday_person,
    celebration_date: thread.celebration_date,
    timezone: thread.timezone,
    is_system_generated: true,
    created_at: thread.created_at,
    likes: 0,
    replies_count: 0,
  }
}

export default function BulletinBoard() {
  const { t } = useLanguage()
  const { posts, loading, error, refetch, likePost } = usePosts()
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [birthdayThreads, setBirthdayThreads] = useState<BirthdayThread[]>([])
  const [threadsLoading, setThreadsLoading] = useState(true)

  const fetchBirthdayThreads = useCallback(async () => {
    try {
      const response = await fetch('/api/community/birthday-threads')
      const payload = (await response.json().catch(() => null)) as { data?: BirthdayThread[] } | null
      setBirthdayThreads(response.ok && payload?.data ? payload.data : [])
    } catch {
      setBirthdayThreads([])
    } finally {
      setThreadsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchBirthdayThreads()
  }, [fetchBirthdayThreads])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div
          className="animate-spin"
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid #D4B08C',
            borderTopColor: '#854D27',
            borderRadius: '50%',
            margin: '0 auto',
          }}
        />
        <p style={{ marginTop: '16px', color: '#854D27' }}>{t('loading')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: '#dc3545', marginBottom: '16px' }}>{error}</p>
        <button
          onClick={refetch}
          style={{
            padding: '10px 20px',
            background: '#854D27',
            color: '#FFF9F3',
            border: '2px solid #D4B08C',
            borderRadius: 0,
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            boxShadow: '3px 3px 0 #D4B08C',
          }}
        >
          {t('retry')}
        </button>
      </div>
    )
  }

  if (selectedPost) {
    return (
      <PostDetail
        post={selectedPost}
        onBack={() => setSelectedPost(null)}
        onLike={likePost}
      />
    )
  }

  return (
    <div>
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Icon name="ClipboardList" size={24} style={{ color: '#2D8CFF' }} />
          <h3 style={{ color: '#854D27', margin: 0, fontSize: '1.2rem' }}>
            {t('bulletinMessagesCount', { count: posts.length })}
          </h3>
        </div>
      </div>

      {/* 誕生日スレッド */}
      {!threadsLoading && birthdayThreads.length > 0 && (
        <section style={{ marginBottom: '28px' }} aria-labelledby="birthday-threads-heading">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Icon name="Cake" size={22} style={{ color: '#E91E63' }} />
            <h4 id="birthday-threads-heading" style={{ color: '#854D27', margin: 0, fontSize: '1.05rem' }}>
              {t('birthdayThreadsTitle')}
            </h4>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '16px',
            }}
          >
            {birthdayThreads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => setSelectedPost(toPost(thread))}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  padding: '14px',
                  background: '#FFF9F3',
                  border: '2px solid #D4B08C',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'var(--font-body)',
                  boxShadow: '2px 2px 0 #D4B08C',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '4px 4px 0 #D4B08C'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '2px 2px 0 #D4B08C'
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    alignSelf: 'flex-start',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'rgba(233, 30, 99, 0.1)',
                    color: '#E91E63',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                  }}
                >
                  <Icon name="Music" size={12} />
                  {t('birthdayThreadBadge')}
                </span>
                {thread.coverUrl ? (
                  <span
                    aria-hidden="true"
                    style={{
                      width: '100%',
                      aspectRatio: '4 / 3',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      display: 'block',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thread.coverUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </span>
                ) : (
                  <span
                    aria-hidden="true"
                    style={{
                      width: '100%',
                      aspectRatio: '4 / 3',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, #FFF9F3 0%, #F3E3D3 100%)',
                      border: '1px solid #D4B08C',
                    }}
                  >
                    <span
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: '#854D27',
                        color: '#FFF9F3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.6rem',
                        fontWeight: 700,
                      }}
                    >
                      {thread.birthday_person?.[0]?.toUpperCase() || '?'}
                    </span>
                  </span>
                )}
                <span style={{ display: 'block', minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: '#2C1810',
                      fontSize: '1rem',
                      fontWeight: 700,
                    }}
                  >
                    {thread.birthday_person ?? thread.message}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      color: '#854D27',
                      fontSize: '0.78rem',
                      opacity: 0.7,
                      marginTop: '2px',
                    }}
                  >
                    {thread.celebration_date ?? ''}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 投稿グリッド */}
      {posts.length === 0 ? (
        <div 
          style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            background: 'rgba(212, 176, 140, 0.1)',
            borderRadius: '8px',
          }}
        >
          <Icon name="Mail" size={48} style={{ color: '#E91E63', display: 'block', margin: '0 auto 16px' }} />
          <p style={{ color: '#854D27', opacity: 0.7 }}>
            {t('noBulletinMessages')}
          </p>
        </div>
      ) : (
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
            maxHeight: '60vh',
            overflowY: 'auto',
            padding: '4px',
          }}
        >
          {posts.map((post) => (
            <BulletinPost
              key={post.id}
              post={post}
              onLike={likePost}
              onReply={() => setSelectedPost(post)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
