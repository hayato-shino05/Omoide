'use client'

import { useState, useRef } from 'react'
import { useAudioMessages, AudioMessage } from '@/lib/hooks/useAudioMessages'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface AudioMessageListProps {
  birthdayPerson?: string
}

function AudioPlayer({ message }: { message: AudioMessage }) {
  const { locale, t } = useLanguage()
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    if (!audioRef.current) return
    const percent = (audioRef.current.currentTime / audioRef.current.duration) * 100
    setProgress(percent)
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setProgress(0)
  }

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
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="bg-[#FFF9F3] rounded-xl p-4 border-2 border-[#D4B08C] shadow-[2px_2px_0_#D4B08C] hover:border-[#854D27] transition-colors">
      <audio
        ref={audioRef}
        src={message.audio_url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? (t('pause') || '一時停止') : (t('play') || '再生')}
          className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-full bg-[#854D27] hover:bg-[#D95D39] flex items-center justify-center text-[#FFF9F3] hover:scale-105 transition-all cursor-pointer shadow-[1px_1px_0_#D4B08C] focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-[#854D27] truncate">{message.sender}</span>
            <span className="text-xs font-mono text-[#854D27]/70 shrink-0 ml-2">{formatDuration(message.duration)}</span>
          </div>

          <div className="h-2 bg-[#D4B08C]/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#854D27] transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-[11px] text-[#854D27]/60 mt-1">{formatDate(message.created_at)}</p>
        </div>
      </div>
    </div>
  )
}

export default function AudioMessageList({ birthdayPerson }: AudioMessageListProps) {
  const { t } = useLanguage()
  const { messages, loading, error, refetch } = useAudioMessages(birthdayPerson)

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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
        {t('audioWishesCount', { count: messages.length })}
      </h3>

      {messages.length === 0 ? (
        <p className="text-[#854D27]/70 text-center py-6 text-sm">
          {t('noAudioWishes')}
        </p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {messages.map((message) => (
            <AudioPlayer key={message.id} message={message} />
          ))}
        </div>
      )}
    </div>
  )
}
