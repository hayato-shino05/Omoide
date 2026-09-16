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
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        {t('recordVideoMessage')}
      </h3>

      {error && (
        <div className="bg-red-500/20 text-red-200 px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      {uploadSuccess && (
        <div className="bg-green-500/20 text-green-200 px-4 py-2 rounded-lg mb-4">
          {t('videoSent')}
        </div>
      )}

      {/* ビデオのプレビュー／再生エリア */}
      <div className="relative aspect-video bg-black/50 rounded-xl overflow-hidden mb-4">
        {!hasPermission && !videoUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60">
            <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p>{t('cameraTurnOnPrompt')}</p>
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
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full">
            <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
            <span className="text-white font-mono text-sm">{formatDuration(duration)}</span>
          </div>
        )}
      </div>

      {/* コントロール */}
      <div className="flex justify-center gap-3 mb-4">
        {!hasPermission && !videoUrl && (
          <button
            onClick={requestPermission}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium transition-colors flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {t('turnOnCamera')}
          </button>
        )}

        {hasPermission && !isRecording && !videoUrl && (
          <button
            onClick={startRecording}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium transition-colors flex items-center gap-2 cursor-pointer"
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
                onClick={resumeRecording}
                className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full font-medium transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            ) : (
              <button
                onClick={pauseRecording}
                className="px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full font-medium transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              </button>
            )}
            <button
              onClick={stopRecording}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-full font-medium transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" />
              </svg>
            </button>
          </>
        )}

        {videoUrl && !isRecording && (
          <button
            onClick={resetRecording}
            className="px-4 py-3 bg-white/20 hover:bg-white/30 text-white rounded-full font-medium transition-colors cursor-pointer"
          >
            {t('rerecord')}
          </button>
        )}
      </div>

      {/* アップロードフォーム */}
      {videoUrl && !isRecording && (
        <div className="space-y-3">
          <input
            type="text"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            placeholder={t('yourName')}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          {uploadError && (
            <p className="text-red-300 text-sm">{uploadError}</p>
          )}
          <button
            onClick={handleUpload}
            disabled={uploading || !sender.trim()}
            className="w-full px-4 py-3 bg-[#D95D39] hover:bg-[#C24E2B] disabled:opacity-50 text-white rounded-lg font-bold transition-all cursor-pointer disabled:cursor-not-allowed shadow-sm"
          >
            {uploading ? t('sending') : t('sendVideo')}
          </button>
        </div>
      )}
    </div>
  )
}
