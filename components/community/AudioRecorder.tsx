'use client'

import { useState } from 'react'
import { useAudioRecorder } from '@/lib/hooks/useAudioRecorder'
import { uploadCommunityMedia } from '@/lib/supabase/communityMedia'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface AudioRecorderProps {
  birthdayPerson?: string
  onRecorded?: (audioUrl: string) => void
}

export default function AudioRecorder({ birthdayPerson, onRecorded }: AudioRecorderProps) {
  const { t } = useLanguage()
  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    formatDuration,
  } = useAudioRecorder()

  const [sender, setSender] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const handleUpload = async () => {
    if (!audioBlob || !sender.trim()) return

    setUploading(true)
    setUploadError(null)

    try {
      const media = await uploadCommunityMedia({
        file: new File([audioBlob], `audio_${Date.now()}.webm`, { type: audioBlob.type || 'audio/webm' }),
        sender: sender.trim(),
        birthdayPerson,
      })

      setUploadSuccess(true)
      onRecorded?.(media.media_url)

      setTimeout(() => {
        resetRecording()
        setSender('')
        setUploadSuccess(false)
      }, 2000)
    } catch {
      setUploadError(t('audioUploadFailed'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-[#FFF9F3] rounded-2xl p-6 border-2 border-[#D4B08C] shadow-[4px_4px_0_#D4B08C] text-[#2C1810]">
      <h3 className="text-xl font-bold text-[#854D27] mb-4 flex items-center gap-2">
        <svg className="w-6 h-6 text-[#D95D39]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        {t('recordAudioMessage')}
      </h3>

      {error && (
        <div role="alert" className="bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-lg mb-4 text-sm font-medium">
          {error}
        </div>
      )}

      {uploadSuccess && (
        <div role="status" className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2 rounded-lg mb-4 text-sm font-medium">
          {t('messageSentSuccess')}
        </div>
      )}

      {/* 録音中のタイマー表示 */}
      <div className="flex items-center justify-center mb-6">
        <div className={`relative w-32 h-32 rounded-full flex items-center justify-center border-2 border-[#D4B08C] transition-colors ${
          isRecording ? 'bg-[#D95D39]/10' : 'bg-[#854D27]/5'
        }`}>
          {isRecording && !isPaused && (
            <div className="absolute inset-0 rounded-full bg-[#D95D39]/20 animate-ping pointer-events-none" />
          )}
          <div className="text-3xl font-mono font-bold text-[#854D27]">
            {formatDuration(duration)}
          </div>
        </div>
      </div>

      {/* 波形アニメーション */}
      {isRecording && (
        <div className="flex items-center justify-center gap-1.5 h-12 mb-4" aria-hidden="true">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 bg-[#D95D39] rounded-full animate-pulse"
              style={{
                height: `${Math.max(15, (i * 17) % 100)}%`,
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>
      )}

      {/* 音声プレビュー */}
      {audioUrl && !isRecording && (
        <div className="mb-4">
          <audio src={audioUrl} controls className="w-full h-11" />
        </div>
      )}

      {/* コントロール */}
      <div className="flex justify-center gap-3 mb-4">
        {!isRecording && !audioUrl && (
          <button
            type="button"
            onClick={startRecording}
            className="min-h-[44px] px-6 py-3 bg-[#D95D39] hover:bg-[#C24E2B] text-[#FFF9F3] rounded-full font-bold transition-all flex items-center gap-2 cursor-pointer shadow-[2px_2px_0_#854D27] focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="6" />
            </svg>
            {t('startRecording')}
          </button>
        )}

        {isRecording && (
          <>
            {isPaused ? (
              <button
                type="button"
                onClick={resumeRecording}
                aria-label={t('play')}
                className="min-h-[44px] min-w-[44px] px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full font-bold transition-colors cursor-pointer shadow-[2px_2px_0_#854D27] focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={pauseRecording}
                aria-label={t('pause')}
                className="min-h-[44px] min-w-[44px] px-5 py-3 bg-amber-700 hover:bg-amber-800 text-white rounded-full font-bold transition-colors cursor-pointer shadow-[2px_2px_0_#854D27] focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={stopRecording}
              aria-label={t('stopRecording')}
              className="min-h-[44px] px-6 py-3 bg-[#854D27] hover:bg-[#6D3D1E] text-[#FFF9F3] rounded-full font-bold transition-colors cursor-pointer shadow-[2px_2px_0_#D4B08C] focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" />
              </svg>
              <span>{t('stopRecording')}</span>
            </button>
          </>
        )}

        {audioUrl && !isRecording && (
          <button
            type="button"
            onClick={resetRecording}
            className="min-h-[44px] px-5 py-3 bg-[#854D27]/15 hover:bg-[#854D27]/25 text-[#854D27] border border-[#D4B08C] rounded-full font-bold transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
          >
            {t('rerecord')}
          </button>
        )}
      </div>

      {/* アップロードフォーム */}
      {audioUrl && !isRecording && (
        <div className="space-y-3 pt-3 border-t border-[#D4B08C]/40">
          <input
            type="text"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            placeholder={t('yourName')}
            className="w-full min-h-[44px] px-4 py-2 bg-white border-2 border-[#D4B08C] rounded-xl text-[#2C1810] placeholder-[#854D27]/50 focus:outline-none focus:ring-2 focus:ring-[#854D27] text-sm"
          />
          {uploadError && (
            <p role="alert" className="text-red-700 text-sm font-medium">{uploadError}</p>
          )}
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || !sender.trim()}
            className="w-full min-h-[44px] px-4 py-3 bg-[#854D27] hover:bg-[#6D3D1E] disabled:opacity-50 text-[#FFF9F3] rounded-xl font-bold transition-all cursor-pointer disabled:cursor-not-allowed shadow-[3px_3px_0_#D4B08C] focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
          >
            {uploading ? t('sending') : t('sendWish')}
          </button>
        </div>
      )}
    </div>
  )
}
