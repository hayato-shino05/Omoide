'use client'

import { useState, useRef } from 'react'
import { useVideoMessages, VideoMessage } from '@/lib/hooks/useVideoMessages'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface VideoMessageListProps {
  birthdayPerson?: string
}

function VideoCard({ message }: { message: VideoMessage }) {
  const { locale, t } = useLanguage()
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const handlePlayClick = () => {
    if (videoRef.current) {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  return (
    <div className="bg-[#FFF9F3] rounded-xl overflow-hidden border-2 border-[#D4B08C] shadow-[2px_2px_0_#D4B08C] hover:border-[#854D27] transition-all">
      <div className="relative aspect-video bg-[#2C1810]">
        <video
          ref={videoRef}
          src={message.video_url}
          controls={isPlaying}
          className="w-full h-full object-cover"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {!isPlaying && (
          <button
            type="button"
            onClick={handlePlayClick}
            aria-label={`${t('play') || '再生'}: ${message.sender}`}
            className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#FFF9F3] outline-none"
          >
            <div className="w-14 h-14 min-h-[44px] min-w-[44px] rounded-full bg-[#854D27]/90 text-[#FFF9F3] border border-[#D4B08C] flex items-center justify-center shadow-md hover:scale-105 transition-transform">
              <svg className="w-7 h-7 text-[#FFF9F3] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </button>
        )}

        <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded text-xs font-mono text-[#FFF9F3] border border-white/20">
          {formatDuration(message.duration)}
        </div>
      </div>

      <div className="p-3 bg-[#FFF9F3]">
        <p className="font-bold text-[#854D27] truncate">{message.sender}</p>
        <p className="text-[11px] text-[#854D27]/60 mt-0.5">{formatDate(message.created_at)}</p>
      </div>
    </div>
  )
}

export default function VideoMessageList({ birthdayPerson }: VideoMessageListProps) {
  const { t } = useLanguage()
  const { messages, loading, error, refetch } = useVideoMessages(birthdayPerson)

  if (loading) {
    return (
      <div className="bg-[#FFF9F3] rounded-2xl p-6 border-2 border-[#D4B08C] shadow-[4px_4px_0_#D4B08C]">
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="w-8 h-8 border-3 border-[#D4B08C]/30 border-t-[#854D27] rounded-full animate-spin" />
          <span className="text-xs text-[#854D27]/80">{t('loading')}</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-[#FFF9F3] rounded-2xl p-6 border-2 border-[#D4B08C] shadow-[4px_4px_0_#D4B08C]">
        <p className="text-red-700 text-center text-sm font-medium">{error}</p>
        <button
          type="button"
          onClick={refetch}
          className="mt-3 min-h-[44px] px-5 py-2 bg-[#854D27] text-[#FFF9F3] rounded-xl font-bold text-xs mx-auto block cursor-pointer shadow-[2px_2px_0_#D4B08C] focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
        >
          {t('retry')}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-[#FFF9F3] rounded-2xl p-6 border-2 border-[#D4B08C] shadow-[4px_4px_0_#D4B08C]">
      <h3 className="text-xl font-bold text-[#854D27] mb-4 flex items-center gap-2">
        <svg className="w-6 h-6 text-[#D95D39]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        {t('videoWishesCount', { count: messages.length })}
      </h3>

      {messages.length === 0 ? (
        <p className="text-[#854D27]/70 text-center py-6 text-sm">
          {t('noVideoWishes')}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
          {messages.map((message) => (
            <VideoCard key={message.id} message={message} />
          ))}
        </div>
      )}
    </div>
  )
}
