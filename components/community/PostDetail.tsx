'use client'

import { useState, useEffect, useCallback } from 'react'
import { Post } from '@/lib/hooks/usePosts'
import { Icon } from '@/components/ui/Icon'
import { getSupabase } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { MusicComment } from './MusicComment'
import { SelectedMusicTrackRow } from './SelectedMusicTrackRow'
import SongPickerModal from './SongPickerModal'

interface Reply {
  id: string
  post_id: string
  sender: string
  message: string | null
  music_track_id: string | null
  created_at: string
}

interface PostDetailProps {
  post: Post
  onBack: () => void
  onLike: (postId: string) => Promise<boolean>
}

export default function PostDetail({ post, onBack, onLike }: PostDetailProps) {
  const { locale, t } = useLanguage()
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [replyName, setReplyName] = useState('')
  const [musicTrackId, setMusicTrackId] = useState('')
  const [isMusicPickerOpen, setIsMusicPickerOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [liked, setLiked] = useState(false)
  const [localLikes, setLocalLikes] = useState(post.likes)

  // 共有ストレージから自動入力する
  useEffect(() => {
    const savedName = localStorage.getItem('birthday_user_name')
    if (savedName) {
      setReplyName(savedName)
    }
  }, [])

  const fetchReplies = useCallback(async () => {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('post_replies')
        .select('*')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })

      if (error) throw error
      setReplies(data || [])
    } catch (err) {
      console.error('Error fetching replies:', err)
    } finally {
      setLoading(false)
    }
  }, [post.id])

  useEffect(() => {
    fetchReplies()
  }, [fetchReplies])

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    const sender = replyName.trim()
    const content = replyText.trim()
    const hasContent = content.length > 0
    const hasMusic = musicTrackId.length > 0
    if (!sender || (!hasContent && !hasMusic)) return

    setSubmitting(true)
    setSubmitError(null)
    try {
      const response = await fetch('/api/community/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          sender,
          content: hasContent ? content : null,
          musicTrackId: hasMusic ? musicTrackId : null,
        }),
      })
      const payload = (await response.json().catch(() => null)) as { data?: Reply; error?: string } | null
      if (!response.ok) {
        setSubmitError(payload?.error ?? t('sendMessageFailed'))
        return
      }
      if (payload?.data) {
        setReplies(prev => [...prev, payload.data as Reply])
      }
      // 名前を共有ストレージへ保存する
      localStorage.setItem('birthday_user_name', sender)
      setReplyText('')
      setMusicTrackId('')
    } catch {
      setSubmitError(t('sendMessageFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleLike = async () => {
    if (liked) return
    setLiked(true)
    setLocalLikes(prev => prev + 1)
    const success = await onLike(post.id)
    if (!success) {
      setLiked(false)
      setLocalLikes(prev => prev - 1)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

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

  return (
    <div className="flex h-full min-h-0 flex-col text-[var(--music-text)]">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex min-h-11 items-center gap-2 self-start border-0 bg-transparent p-0 text-sm text-[var(--music-accent)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--music-focus)]"
      >
        <Icon name="ArrowLeft" size={18} />
        <span>{t('back')}</span>
      </button>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto lg:flex-row lg:overflow-hidden">
        <div className="min-w-0 flex-1 overflow-visible lg:overflow-y-auto">
          <article className="border border-[var(--music-border)] border-t-4 border-t-[var(--music-accent)] bg-[var(--music-surface)] p-5">
            <header className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[var(--music-accent)] font-serif text-lg font-semibold text-[var(--music-surface)]">
                {post.sender?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0">
                <p className="m-0 truncate text-base font-semibold text-[var(--music-text)]">{post.sender}</p>
                <p className="m-0 text-xs text-[var(--music-text-muted)]">{formatDate(post.created_at)}</p>
              </div>
            </header>

            <p className="m-0 mb-5 whitespace-pre-wrap text-base leading-relaxed text-[var(--music-text)]">{post.message}</p>

            {post.media_url && (
              <div className="mb-5 overflow-hidden border border-[var(--music-border)] bg-[var(--music-text)]">
                {post.media_url.endsWith('.mp4') || post.media_url.endsWith('.webm') || post.media_url.endsWith('.ogg') ? (
                  <video src={post.media_url} controls className="max-h-[400px] w-full" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.media_url} alt={t('mediaAlt')} className="max-h-[400px] w-full object-contain" />
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 border-t border-[var(--music-border)] pt-4">
              <button
                type="button"
                onClick={handleLike}
                disabled={liked}
                className={`inline-flex min-h-11 items-center gap-2 border px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--music-focus)] ${liked ? 'border-[var(--music-accent)] bg-[color-mix(in_srgb,var(--music-accent)_12%,transparent)] text-[var(--music-accent)]' : 'border-[var(--music-border)] bg-transparent text-[var(--music-text)] hover:border-[var(--music-accent)] hover:text-[var(--music-accent)]'} disabled:cursor-default`}
              >
                <Icon name="Heart" size={18} />
                <span>{localLikes} {t('liked')}</span>
              </button>
              <div className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--music-text-muted)]">
                <Icon name="MessageCircle" size={18} />
                <span>{replies.length} {t('replies')}</span>
              </div>
            </div>
          </article>
        </div>


        <section className="flex min-w-0 flex-1 flex-col border border-[var(--music-border)] bg-[var(--music-surface-elevated)] p-4">
          <h2 className="mb-4 flex items-center gap-2 border-b border-[var(--music-border)] pb-3 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--music-text)]">
            <Icon name="MessageCircle" size={18} />
            {t('replies')} ({replies.length})
          </h2>

          <div className="mb-4 min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <p role="status" aria-live="polite" className="py-6 text-center text-sm text-[var(--music-text-muted)]">{t('loading')}</p>
            ) : replies.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--music-text-muted)]">{t('noRepliesPrompt')}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {replies.map((reply) => (
                  <article key={reply.id} className="border border-[var(--music-border)] bg-[var(--music-surface)] p-3">
                    <header className="mb-2 flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[var(--music-text)] font-serif text-xs font-semibold text-[var(--music-surface)]">
                        {reply.sender?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="m-0 truncate text-sm font-semibold text-[var(--music-text)]">{reply.sender}</p>
                        <p className="m-0 text-xs text-[var(--music-text-muted)]">{formatDate(reply.created_at)}</p>
                      </div>
                    </header>
                    {reply.music_track_id ? (
                      <MusicComment trackReference={reply.music_track_id} />
                    ) : (
                      reply.message && <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-[var(--music-text)]">{reply.message}</p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmitReply} className="border-t border-[var(--music-border)] pt-3">
            <input
              type="text"
              value={replyName}
              onChange={(e) => setReplyName(e.target.value)}
              placeholder={t('yourName')}
              aria-label={t('yourName')}
              className="mb-2 box-border min-h-11 w-full border border-[var(--music-border)] bg-[var(--music-surface)] px-3 py-2 text-sm text-[var(--music-text)] outline-none placeholder:text-[var(--music-text-muted)] focus-visible:ring-2 focus-visible:ring-[var(--music-focus)]"
            />
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={t('typeReply')}
              aria-label={t('typeReply')}
              rows={2}
              className="mb-2 box-border min-h-11 w-full resize-none border border-[var(--music-border)] bg-[var(--music-surface)] px-3 py-2 text-sm text-[var(--music-text)] outline-none placeholder:text-[var(--music-text-muted)] focus-visible:ring-2 focus-visible:ring-[var(--music-focus)]"
            />
            <SelectedMusicTrackRow
              value={musicTrackId}
              onChange={setMusicTrackId}
              onOpenPicker={() => setIsMusicPickerOpen(true)}
            />
            {submitError && <p role="alert" className="mb-2 text-sm text-[var(--music-error)]">{submitError}</p>}
            <button
              type="submit"
              disabled={submitting || !replyName.trim() || (!replyText.trim() && !musicTrackId)}
              className="min-h-11 w-full border border-[var(--music-accent)] bg-[var(--music-accent)] px-4 py-2 text-sm font-semibold text-[var(--music-surface)] outline-none transition-colors hover:bg-[var(--music-text)] focus-visible:ring-2 focus-visible:ring-[var(--music-focus)] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
            >
              {submitting ? t('sending') : t('sendMessage')}
            </button>
          </form>
          <SongPickerModal
            isOpen={isMusicPickerOpen}
            onClose={() => setIsMusicPickerOpen(false)}
            onConfirm={(reference) => {
              setMusicTrackId(reference)
              setIsMusicPickerOpen(false)
            }}
            initialValue={musicTrackId}
          />
        </section>
      </div>
    </div>
  )
}
