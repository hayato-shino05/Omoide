'use client'

import { useState, useEffect } from 'react'
import { useVideoRecorder } from '@/lib/hooks/useVideoRecorder'
import { uploadCommunityMedia } from '@/lib/supabase/communityMedia'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface VideoRecorderProps {
  birthdayPerson?: string
  onRecorded?: (videoUrl: string) => void
}

export default function VideoRecorder({ birthdayPerson, onRecorded }: VideoRecorderProps) {
  const { t } = useLanguage()
  const {
    isRecording,
    isPaused,
    duration,
    videoBlob,
    videoUrl,
    error,
    hasPermission,
    requestPermission,
    setVideoPreviewRef,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    stopCamera,
    formatDuration,
  } = useVideoRecorder()

  const [sender, setSender] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  const handleUpload = async () => {
    if (!videoBlob || !sender.trim()) return

    setUploading(true)
    setUploadError(null)

    try {
      const media = await uploadCommunityMedia({
        file: new File([videoBlob], `video_${Date.now()}.webm`, { type: videoBlob.type || 'video/webm' }),
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
      setUploadError(t('videoUploadFailed'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-[#FFF9F3] rounded-2xl p-6 border-2 border-[#D4B08C] shadow-[4px_4px_0_#D4B08C] text-[#2C1810]">
      <h3 className="text-xl font-bold text-[#854D27] mb-4 flex items-center gap-2">
        <svg className="w-6 h-6 text-[#D95D39]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        {t('recordVideoMessage')}
      </h3>

      {error && (
        <div role="alert" className="bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-lg mb-4 text-sm font-medium">
          {error}
        </div>
      )}

      {uploadSuccess && (
        <div role="status" className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2 rounded-lg mb-4 text-sm font-medium">
          {t('videoSent')}
        </div>
      )}

      {/* ビデオのプレビュー／再生エリア */}
      <div className="relative aspect-video bg-[#2C1810] rounded-xl overflow-hidden mb-4 border border-[#D4B08C]/60">
        {!hasPermission && !videoUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#FFF9F3]/80 p-4 text-center">
            <svg className="w-14 h-14 mb-2 text-[#D4B08C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium text-[#FFF9F3]">{t('cameraTurnOnPrompt')}</p>
          </div>
        )}

        {hasPermission && !videoUrl && (
          <video
            ref={setVideoPreviewRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        )}

        {videoUrl && (
          <video
            src={videoUrl}
            controls
            className="w-full h-full object-cover"
          />
        )}

        {/* 録画中インジケーター */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
            <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-red-500 animate-pulse'}`} />
            <span className="text-white font-mono text-sm font-bold">{formatDuration(duration)}</span>
          </div>
        )}
      </div>

      {/* コントロール */}
      <div className="flex justify-center gap-3 mb-4">
        {!hasPermission && !videoUrl && (
          <button
            type="button"
            onClick={requestPermission}
            className="min-h-[44px] px-6 py-3 bg-[#854D27] hover:bg-[#6D3D1E] text-[#FFF9F3] rounded-full font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-[2px_2px_0_#D4B08C] focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {t('turnOnCamera')}
          </button>
        )}

        {hasPermission && !isRecording && !videoUrl && (
          <button
            type="button"
            onClick={startRecording}
            className="min-h-[44px] px-6 py-3 bg-[#D95D39] hover:bg-[#C24E2B] text-[#FFF9F3] rounded-full font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-[2px_2px_0_#854D27] focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
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

        {videoUrl && !isRecording && (
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
      {videoUrl && !isRecording && (
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
            {uploading ? t('sending') : t('sendVideo')}
          </button>
        </div>
      )}
    </div>
  )
}
