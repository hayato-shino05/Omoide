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
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        {t('recordAudioMessage')}
      </h3>

      {error && (
        <div className="bg-red-500/20 text-red-200 px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      {uploadSuccess && (
        <div className="bg-green-500/20 text-green-200 px-4 py-2 rounded-lg mb-4">
          {t('messageSentSuccess')}
        </div>
      )}

      {/* 録音中のビジュアライゼーション */}
      <div className="flex items-center justify-center mb-6">
        <div className={`relative w-32 h-32 rounded-full flex items-center justify-center ${
          isRecording ? 'bg-red-500/30' : 'bg-white/10'
        }`}>
          {isRecording && !isPaused && (
            <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
          )}
          <div className="text-3xl font-mono text-white">
            {formatDuration(duration)}
          </div>
        </div>
      </div>

      {/* 波形アニメーション（プレースホルダー） */}
      {isRecording && (
        <div className="flex items-center justify-center gap-1 h-12 mb-4">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-white/60 rounded-full animate-pulse"
              style={{
                height: `${Math.random() * 100}%`,
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>
      )}

      {/* 音声プレビュー */}
      {audioUrl && !isRecording && (
        <div className="mb-4">
          <audio src={audioUrl} controls className="w-full" />
        </div>
      )}

      {/* コントロール */}
      <div className="flex justify-center gap-3 mb-4">
        {!isRecording && !audioUrl && (
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

        {audioUrl && !isRecording && (
          <button
            onClick={resetRecording}
            className="px-4 py-3 bg-white/20 hover:bg-white/30 text-white rounded-full font-medium transition-colors cursor-pointer"
          >
            {t('rerecord')}
          </button>
        )}
      </div>

      {/* アップロードフォーム */}
      {audioUrl && !isRecording && (
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
            {uploading ? t('sending') : t('sendWish')}
          </button>
        </div>
      )}
    </div>
  )
}
