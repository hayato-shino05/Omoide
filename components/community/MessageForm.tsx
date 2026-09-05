'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { CameraCapture } from './CameraCapture'
import { ContributorPromptButtons } from './ContributorPromptButtons'
import { SelectedMusicTrackRow } from './SelectedMusicTrackRow'
import SongPickerModal from './SongPickerModal'
import { normalizeMediaFile, validateCommunityMediaFile } from '@/lib/validations/upload'
import { Icon } from '@/components/ui/Icon'

interface MessageFormProps {
  birthdayPerson?: string
  onSuccess?: () => void
}

export function MessageForm({ birthdayPerson, onSuccess }: MessageFormProps) {
  const { t } = useLanguage()
  const [sender, setSender] = useState('')
  
  // 共有ストレージから自動入力
  useEffect(() => {
    const savedName = localStorage.getItem('birthday_user_name')
    if (savedName) {
      setSender(savedName)
    }
  }, [])
  const [message, setMessage] = useState('')
  const [musicTrackId, setMusicTrackId] = useState('')
  const [isMusicPickerOpen, setIsMusicPickerOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // メディアアップロードに関する状態
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSelectedFile = (file: File): boolean => {
    const normalizedFile = normalizeMediaFile(file)
    const validation = validateCommunityMediaFile(normalizedFile)
    if (!validation.valid) {
      setError(!validation.valid && file.size > 50 * 1024 * 1024
        ? t('fileTooLargeWithLimit', { size: 50 })
        : t('fileTypeError'))
      return false
    }

    setSelectedFile(normalizedFile)
    setError(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(normalizedFile))
    return true
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleSelectedFile(file)
  }

  const removeFile = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const submitMessage = async (
    payload: { sender: string; message: string; birthdayPerson?: string; musicTrackId?: string }
  ): Promise<boolean> => {
    const formData = new FormData()
    formData.set('kind', 'message')
    formData.set('sender', payload.sender)
    formData.set('content', payload.message)
    if (payload.birthdayPerson) formData.set('birthdayPerson', payload.birthdayPerson)
    if (payload.musicTrackId) formData.set('musicTrackId', payload.musicTrackId)
    if (selectedFile) formData.set('media', selectedFile, selectedFile.name)

    try {
      if (selectedFile) {
        const response = await new Promise<XMLHttpRequest>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('POST', '/api/community')
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) setUploadProgress(Math.round((event.loaded / event.total) * 100))
          }
          xhr.onload = () => resolve(xhr)
          xhr.onerror = () => reject(new Error('community submission request failed'))
          xhr.onabort = () => reject(new Error('community submission request aborted'))
          xhr.send(formData)
        })
        if (response.status < 200 || response.status >= 300) {
          let errorMessage: string | undefined
          try {
            errorMessage = (JSON.parse(response.responseText) as { error?: string }).error
          } catch {
            errorMessage = undefined
          }
          setError(errorMessage ?? t('sendMessageFailed'))
          return false
        }
        setUploadProgress(100)
        return true
      }

      const response = await fetch('/api/community', { method: 'POST', body: formData })
      if (!response.ok) {
        const responsePayload = (await response.json().catch(() => null)) as { error?: string } | null
        setError(responsePayload?.error ?? t('sendMessageFailed'))
        return false
      }
      return true
    } catch {
      setError((currentError) => currentError ?? t('genericError'))
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sender.trim() || !message.trim()) {
      setError(t('allFieldsRequired'))
      return
    }

    setIsSubmitting(true)
    setError(null)
    setUploadProgress(0)

    try {
      // メディア付き投稿は server-side の transaction 経路 /api/community に統一し、
      // メディアアップロードと message 挿入の不整合による孤立 object を防ぐ。
      const success = await submitMessage({
        sender: sender.trim(),
        message: message.trim(),
        birthdayPerson,
        musicTrackId: musicTrackId || undefined,
      })

      if (success) {
        // 名前を共有ストレージに保存する（他のフォームと共用）
        try {
          localStorage.setItem('birthday_user_name', sender.trim())
        } catch {
          console.warn('Failed to save sender name')
        }
        // 送信者名は保持し、メッセージのみクリアする
        setMessage('')
        removeFile()
        onSuccess?.()
      }
    } catch {
      setError((currentError) => currentError ?? t('genericError'))
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  const isVideo = selectedFile?.type.startsWith('video/')

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '15px' }}>
        <input
          type="text"
          value={sender}
          onChange={(e) => setSender(e.target.value)}
          placeholder={t('yourName')}
          aria-label={t('yourName')}
          style={{
            width: '100%',
            padding: '12px 15px',
            border: '2px solid #D4B08C',
            borderRadius: 0,
            fontFamily: 'var(--font-body)',
            fontSize: '1rem',
            background: '#FFF9F3',
            color: '#2C1810',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('typeMessage')}
          aria-label={t('messagePlaceholder')}
          rows={4}
          style={{
            width: '100%',
            padding: '12px 15px',
            border: '2px solid #D4B08C',
            borderRadius: 0,
            fontFamily: 'var(--font-body)',
            fontSize: '1rem',
            background: '#FFF9F3',
            color: '#2C1810',
            resize: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <ContributorPromptButtons hasContent={message.trim().length > 0} onSelect={setMessage} />

      <SelectedMusicTrackRow
        value={musicTrackId}
        onChange={setMusicTrackId}
        onOpenPicker={() => setIsMusicPickerOpen(true)}
      />

      {/* ファイルアップロードエリア */}
      <div style={{ marginBottom: '15px' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        

        
        {!selectedFile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* ライブラリから選択 */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                padding: '12px 15px',
                border: '2px dashed #D4B08C',
                borderRadius: 0,
                background: 'rgba(212, 176, 140, 0.1)',
                color: '#854D27',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Icon name="Folder" size={18} />
              <span>{t('chooseFromLibrary')}</span>
            </button>
            
            {/* カメラ撮影ボタン */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setCameraMode('photo')
                  setShowCamera(true)
                }}
                style={{
                  flex: 1,
                  padding: '12px 15px',
                  border: '2px solid #D4B08C',
                  borderRadius: 0,
                  background: '#854D27',
                  color: '#FFF9F3',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '2px 2px 0 #D4B08C',
                }}
              >
                <Icon name="Camera" size={16} />
                <span>{t('takePhoto')}</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setCameraMode('video')
                  setShowCamera(true)
                }}
                style={{
                  flex: 1,
                  padding: '12px 15px',
                  border: '2px solid #D4B08C',
                  borderRadius: 0,
                  background: '#854D27',
                  color: '#FFF9F3',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '2px 2px 0 #D4B08C',
                }}
              >
                <Icon name="Video" size={16} />
                <span>{t('takeVideo')}</span>
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              border: '2px solid #D4B08C',
              borderRadius: '8px',
              padding: '10px',
              background: 'rgba(212, 176, 140, 0.1)',
            }}
          >
            {/* プレビュー */}
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              {isVideo ? (
                <video
                  src={previewUrl || ''}
                  style={{
                    width: '100%',
                    maxHeight: '200px',
                    objectFit: 'contain',
                    borderRadius: '4px',
                  }}
                  controls
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl || ''}
                  alt={t('preview')}
                  style={{
                    width: '100%',
                    maxHeight: '200px',
                    objectFit: 'contain',
                    borderRadius: '4px',
                  }}
                />
              )}
              
              {/* 削除ボタン */}
              <button
                type="button"
                onClick={removeFile}
                aria-label={t('removeFile')}
                style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(220, 53, 69, 0.9)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="X" size={18} />
              </button>
            </div>

            {/* ファイル情報 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#854D27' }}>
              <Icon name={isVideo ? 'Video' : 'Image'} size={16} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedFile.name}
              </span>
              <span style={{ opacity: 0.7 }}>
                {(selectedFile.size / 1024 / 1024).toFixed(1)}MB
              </span>
            </div>
          </div>
        )}
      </div>

      {/* アップロードの進行状況 */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuenow={uploadProgress}
          aria-valuemax={100}
          aria-label={t('uploadProgress', { progress: uploadProgress })}
          style={{ marginBottom: '15px' }}
        >
          <div
            style={{
              height: '4px',
              background: 'rgba(212, 176, 140, 0.3)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${uploadProgress}%`,
                background: '#854D27',
                transition: 'width 0.3s',
              }}
            />
          </div>
          <p style={{ fontSize: '0.8rem', color: '#854D27', marginTop: '5px', textAlign: 'center' }}>
            {t('uploadProgress', { progress: uploadProgress })}
          </p>
        </div>
      )}

      {error && (
        <p role="alert" style={{ color: '#dc3545', marginBottom: '15px', fontSize: '0.9rem' }}>{error}</p>
      )}

      <motion.button
        type="submit"
        disabled={isSubmitting}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          width: '100%',
          padding: '12px 25px',
          background: isSubmitting ? '#999' : '#854D27',
          color: '#FFF9F3',
          border: '2px solid #D4B08C',
          borderRadius: 0,
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-body)',
          fontSize: '1rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          boxShadow: '4px 4px 0 #D4B08C',
        }}
      >
        {isSubmitting ? t('sending') : t('sendWish')}
      </motion.button>

      {/* カメラキャプチャ用モーダル */}
      {showCamera && (
        <CameraCapture
          mode={cameraMode}
          onCapture={(file) => {
            handleSelectedFile(file)
            setShowCamera(false)
          }}
          onClose={() => setShowCamera(false)}
        />
      )}

      <SongPickerModal
        isOpen={isMusicPickerOpen}
        onClose={() => setIsMusicPickerOpen(false)}
        onConfirm={(reference) => {
          setMusicTrackId(reference)
          setIsMusicPickerOpen(false)
        }}
        initialValue={musicTrackId}
      />
    </form>
  )
}
