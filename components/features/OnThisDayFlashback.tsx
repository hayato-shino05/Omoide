'use client'

import { useState, useEffect } from 'react'
import { RotateCcw } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { Icon } from '@/components/ui/Icon'
import { useUIStore } from '@/lib/stores/uiStore'

interface FlashbackMemory {
  id: string | number
  type: 'media' | 'post'
  sender: string
  content?: string
  mediaUrl?: string
  mediaKind?: 'image' | 'video' | 'audio'
  createdAt: string
  yearsAgo: number
}

// 過去の同日に投稿された写真やメッセージを振り返るコンポーネント
export function OnThisDayFlashback({ onClose }: { onClose?: () => void }) {
  const { t, language } = useLanguage()
  const openModal = useUIStore((state) => state.openModal)
  const [memories, setMemories] = useState<FlashbackMemory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const fetchFlashbackMemories = async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = getSupabase()
      const now = new Date()
      const currentMonth = now.getMonth() + 1
      const currentDay = now.getDate()
      const currentYear = now.getFullYear()

      // メディアと掲示板投稿を取得
      const [mediaRes, postsRes] = await Promise.all([
        supabase.from('media_submissions').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('bulletin_posts').select('*').order('created_at', { ascending: false }).limit(100),
      ])

      const matchedMemories: FlashbackMemory[] = []

      // メディアの照合
      if (mediaRes.data) {
        for (const item of mediaRes.data) {
          const date = new Date(item.created_at)
          if (
            date.getMonth() + 1 === currentMonth &&
            date.getDate() === currentDay &&
            date.getFullYear() < currentYear
          ) {
            const { data } = supabase.storage
              .from('community-media')
              .getPublicUrl(item.object_path)

            matchedMemories.push({
              id: `media-${item.id}`,
              type: 'media',
              sender: item.sender,
              content: item.description || undefined,
              mediaUrl: data?.publicUrl,
              mediaKind: item.media_kind as 'image' | 'video' | 'audio',
              createdAt: item.created_at,
              yearsAgo: currentYear - date.getFullYear(),
            })
          }
        }
      }

      // 掲示板投稿の照合
      if (postsRes.data) {
        for (const item of postsRes.data) {
          const date = new Date(item.created_at)
          if (
            date.getMonth() + 1 === currentMonth &&
            date.getDate() === currentDay &&
            date.getFullYear() < currentYear
          ) {
            matchedMemories.push({
              id: `post-${item.id}`,
              type: 'post',
              sender: item.sender,
              content: item.message,
              createdAt: item.created_at,
              yearsAgo: currentYear - date.getFullYear(),
            })
          }
        }
      }

      setMemories(matchedMemories)
    } catch (err) {
      console.error('Failed to fetch flashback memories:', err)
      setError(t('error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFlashbackMemories()
  }, [])

  const currentMemory = memories[currentIndex]

  return (
    <div className="flex flex-col items-center justify-center p-2 max-w-lg mx-auto">
      {loading ? (
        <div className="w-full bg-[#FFF9F3] border-2 border-[#D4B08C]/40 rounded-2xl p-6 shadow-sm animate-pulse flex flex-col items-center gap-4 py-12" role="status" aria-label={t('loading')}>
          <div className="w-full h-56 rounded-xl bg-[#D4B08C]/20" />
          <div className="w-3/4 h-4 rounded-full bg-[#D4B08C]/30" />
          <div className="w-1/2 h-3 rounded-full bg-[#D4B08C]/20" />
        </div>
      ) : error ? (
        <div className="w-full bg-[#FFF9F3] border-2 border-red-300 rounded-2xl p-6 text-center shadow-sm" role="alert">
          <p className="text-sm text-red-600 font-bold mb-4">{error}</p>
          <button
            onClick={() => fetchFlashbackMemories()}
            className="min-h-11 px-5 py-2.5 rounded-xl bg-[#854D27] text-[#FFF9F3] text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
          >
            <RotateCcw size={16} />
            {t('retry')}
          </button>
        </div>
      ) : memories.length > 0 && currentMemory ? (
        <div className="w-full">
          {/* ポラロイド風カード */}
          <div className="bg-[#FFF9F3] border-2 border-[#D4B08C] rounded-2xl p-4 shadow-lg relative overflow-hidden">
            {/* 年数バッジ */}
            <div className="absolute top-3 right-3 bg-[#854D27] text-[#FFF9F3] text-xs font-bold px-3 py-1 rounded-full border border-[#D4B08C] shadow-sm">
              {t('yearsAgoToday', { count: currentMemory.yearsAgo })}
            </div>

            {/* メディア表示（画像・動画・音声） */}
            {currentMemory.mediaUrl && (
              <div className="w-full h-64 rounded-xl overflow-hidden mb-4 bg-black/5 flex items-center justify-center border border-[#D4B08C]/40">
                {currentMemory.mediaKind === 'video' ? (
                  <video
                    src={currentMemory.mediaUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : currentMemory.mediaKind === 'audio' ? (
                  <div className="flex flex-col items-center justify-center p-6 gap-3 w-full">
                    <Icon name="Music" size={36} />
                    <audio src={currentMemory.mediaUrl} controls className="w-full" />
                  </div>
                ) : (
                  // Dynamic community media URLs are not statically allowlisted for next/image.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentMemory.mediaUrl}
                    alt={t('flashbackPhotoAlt')}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            )}

            {/* メッセージ本文 */}
            {currentMemory.content && (
              <p className="text-sm text-[#854D27] italic font-serif leading-relaxed mb-3 px-2">
                &ldquo;{currentMemory.content}&rdquo;
              </p>
            )}

            {/* 投稿者情報 */}
            <div className="flex items-center justify-between pt-3 border-t border-[#D4B08C]/30 text-xs text-[#854D27]/80">
              <span className="font-semibold">
                {t('fromSender', { name: currentMemory.sender })}
              </span>
              <span>
                {new Date(currentMemory.createdAt).toLocaleDateString(
                  language === 'ja' ? 'ja-JP' : 'en-US',
                  { year: 'numeric', month: 'short', day: 'numeric' }
                )}
              </span>
            </div>
          </div>

          {/* 複数ある場合のナビゲーション */}
          {memories.length > 1 && (
            <div className="flex items-center justify-between mt-4 px-2">
              <button
                onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : memories.length - 1))}
                className="min-h-11 min-w-11 px-4 py-2.5 rounded-xl bg-[#854D27] text-[#FFF9F3] text-xs font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-xs"
                aria-label={t('previousMedia')}
              >
                {t('previousMedia')}
              </button>
              <span className="text-xs font-bold text-[#854D27]">
                {currentIndex + 1} / {memories.length}
              </span>
              <button
                onClick={() => setCurrentIndex((prev) => (prev < memories.length - 1 ? prev + 1 : 0))}
                className="min-h-11 min-w-11 px-4 py-2.5 rounded-xl bg-[#854D27] text-[#FFF9F3] text-xs font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-xs"
                aria-label={t('nextMedia')}
              >
                {t('nextMedia')}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* 過去の記録がない場合の案内 */
        <div className="w-full bg-[#FFF9F3] border-2 border-dashed border-[#D4B08C] rounded-2xl p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-[#854D27]/10 flex items-center justify-center mx-auto mb-3 text-[#854D27]">
            <Icon name="PenLine" size={24} />
          </div>
          <h3 className="text-base font-bold text-[#854D27] mb-2">{t('flashbackEmptyTitle')}</h3>
          <p className="text-xs text-[#854D27]/80 leading-relaxed mb-6">
            {t('flashbackEmptyDesc')}
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => {
                onClose?.()
                openModal('message')
              }}
              className="min-h-11 px-5 py-2.5 rounded-xl bg-[#854D27] text-[#FFF9F3] text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer flex items-center justify-center"
            >
              {t('sendMessage')}
            </button>
            <button
              onClick={() => {
                onClose?.()
                openModal('album')
              }}
              className="min-h-11 px-5 py-2.5 rounded-xl bg-transparent border border-[#854D27] text-[#854D27] text-xs font-bold hover:bg-[#854D27]/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
            >
              {t('viewAlbum')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default OnThisDayFlashback
