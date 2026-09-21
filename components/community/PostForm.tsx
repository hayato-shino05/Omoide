'use client'

import { useState, useRef, useEffect } from 'react'
import { normalizeMediaFile, validateCommunityMediaFile } from '@/lib/validations/upload'
import { CameraCapture } from './CameraCapture'
import { ContributorPromptButtons } from './ContributorPromptButtons'
import { Icon } from '@/components/ui/Icon'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface PostFormProps {
  onSubmit: (sender: string, message: string, giftId?: string, mediaUrl?: string) => Promise<boolean>
}

export default function PostForm({ onSubmit }: PostFormProps) {
  const { t } = useLanguage()
  const [author, setAuthor] = useState('')
  
  // 共有ストレージから自動入力
  useEffect(() => {
    const savedName = localStorage.getItem('birthday_user_name')
    if (savedName) {
      setAuthor(savedName)
    }
  }, [])
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // メディア関連の状態
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // コンポーネントアンマウント時のプレビューURL解放（メモリリーク防止）
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

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
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const submitPostWithMedia = async (file: File): Promise<boolean> => {
    const formData = new FormData()
    formData.set('kind', 'post')
    formData.set('sender', author.trim())
    formData.set('content', content.trim())
    formData.set('media', file, file.name)

    setUploadProgress(10)
    const response = await fetch('/api/community', { method: 'POST', body: formData })
    setUploadProgress(100)
    if (response.ok) return true

    const errorBody = await response.json().catch(() => null) as { error?: string } | null
    setError(errorBody?.error ?? t('postFailed'))
    return false
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!author.trim() || !content.trim()) return

    setSubmitting(true)
    setError(null)
    setUploadProgress(0)

    try {
      const success = selectedFile
        ? await submitPostWithMedia(selectedFile)
        : await onSubmit(author.trim(), content.trim())

      if (success) {
        // 名前を共有ストレージに保存する（他のフォームと共用）
        try {
          localStorage.setItem('birthday_user_name', author.trim())
        } catch {
          console.warn('Failed to save author name')
        }
        // 投稿者名は保持し、本文のみクリアする
        setContent('')
        removeFile()
      } else if (!selectedFile) {
        setError(t('postFailed'))
      }
    } catch {
      setError(t('genericError'))
    } finally {
      setSubmitting(false)
      setUploadProgress(0)
    }
  }

  const isVideo = selectedFile?.type.startsWith('video/')

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: '#FFF9F3',
        border: '2px solid #D4B08C',
        borderRadius: '12px',
        padding: '18px',
        boxShadow: '3px 3px 0 #D4B08C',
      }}
    >
      <div style={{ display: 'flex', gap: '12px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: '#854D27',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFF9F3',
            fontWeight: 'bold',
            fontSize: '1.05rem',
            flexShrink: 0,
            border: '1.5px solid #D4B08C',
            boxShadow: '1px 1px 0 #D4B08C',
          }}
          aria-hidden="true"
        >
          {author ? author[0].toUpperCase() : '?'}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label htmlFor="post-form-author" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#854D27', marginBottom: '4px' }}>
              {t('yourName')}
            </label>
            <input
              id="post-form-author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder={t('yourName')}
              aria-label={t('yourName')}
              required
              className="focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
              style={{
                width: '100%',
                minHeight: '44px',
                padding: '10px 14px',
                background: '#FFF9F3',
                border: '2px solid #D4B08C',
                borderRadius: '8px',
                color: '#2C1810',
                fontFamily: 'var(--font-body)',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label htmlFor="post-form-content" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#854D27', marginBottom: '4px' }}>
              {t('typeMessage')}
            </label>
            <textarea
              id="post-form-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('typeMessage')}
              aria-label={t('typeMessage')}
              rows={3}
              required
              className="focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#FFF9F3',
                border: '2px solid #D4B08C',
                borderRadius: '8px',
                color: '#2C1810',
                fontFamily: 'var(--font-body)',
                fontSize: '0.95rem',
                resize: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <ContributorPromptButtons hasContent={content.trim().length > 0} onSelect={setContent} />

          {/* メディアアップロード */}
          <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileSelect} style={{ display: 'none' }} />

          {!selectedFile ? (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
                style={{
                  minHeight: '44px',
                  padding: '8px 14px',
                  border: '1.5px dashed #D4B08C',
                  borderRadius: '8px',
                  background: 'rgba(212, 176, 140, 0.12)',
                  color: '#854D27',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Icon name="Folder" size={18} style={{ color: '#854D27' }} /> {t('library')}
              </button>
              <button
                type="button"
                onClick={() => { setCameraMode('photo'); setShowCamera(true) }}
                className="focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
                style={{
                  minHeight: '44px',
                  padding: '8px 14px',
                  border: '1.5px solid #D4B08C',
                  borderRadius: '8px',
                  background: '#854D27',
                  color: '#FFF9F3',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '1px 1px 0 #D4B08C',
                }}
              >
                <Icon name="Camera" size={18} style={{ color: '#FFF9F3' }} /> {t('takePhoto')}
              </button>
              <button
                type="button"
                onClick={() => { setCameraMode('video'); setShowCamera(true) }}
                className="focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
                style={{
                  minHeight: '44px',
                  padding: '8px 14px',
                  border: '1.5px solid #D4B08C',
                  borderRadius: '8px',
                  background: '#854D27',
                  color: '#FFF9F3',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '1px 1px 0 #D4B08C',
                }}
              >
                <Icon name="Video" size={18} style={{ color: '#FFF9F3' }} /> {t('takeVideo')}
              </button>
            </div>
          ) : (
            <div style={{ position: 'relative', border: '1.5px solid #D4B08C', borderRadius: '8px', padding: '10px', background: 'rgba(212,176,140,0.15)' }}>
              {isVideo ? (
                <video src={previewUrl || ''} style={{ width: '100%', maxHeight: '180px', objectFit: 'contain' }} controls />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl || ''} alt={t('preview')} style={{ width: '100%', maxHeight: '180px', objectFit: 'contain' }} />
              )}
              <button
                type="button"
                onClick={removeFile}
                aria-label={t('removeFile')}
                className="focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '32px',
                  height: '32px',
                  minWidth: '32px',
                  minHeight: '32px',
                  borderRadius: '50%',
                  background: 'rgba(220,53,69,0.95)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="X" size={16} style={{ color: '#FFFFFF' }} />
              </button>
              <p style={{ fontSize: '0.78rem', color: '#854D27', marginTop: '6px', fontWeight: 500 }}>{selectedFile.name} ({(selectedFile.size/1024/1024).toFixed(1)}MB)</p>
            </div>
          )}

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuenow={uploadProgress}
              aria-valuemax={100}
              style={{ height: '4px', background: 'rgba(212,176,140,0.3)', borderRadius: '2px', overflow: 'hidden' }}
            >
              <div
                style={{
                  height: '100%',
                  width: '100%',
                  background: '#854D27',
                  transform: `scaleX(${uploadProgress / 100})`,
                  transformOrigin: 'left',
                  transition: 'transform 0.3s ease-out',
                  willChange: 'transform',
                }}
              />
            </div>
          )}

          {error && <p role="alert" style={{ color: '#dc3545', fontSize: '0.85rem', fontWeight: 600 }}>{error}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={submitting || !author.trim() || !content.trim()}
              className="focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
              style={{
                minHeight: '44px',
                padding: '10px 24px',
                background: submitting ? '#999' : '#854D27',
                color: '#FFF9F3',
                border: '2px solid #D4B08C',
                borderRadius: '8px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '0.92rem',
                fontWeight: 700,
                boxShadow: '3px 3px 0 #D4B08C',
                opacity: (!author.trim() || !content.trim()) ? 0.5 : 1,
                transition: 'background 0.2s',
              }}
            >
              {submitting ? t('posting') : t('postMessage')}
            </button>
          </div>
        </div>
      </div>

      {showCamera && (
        <CameraCapture
          mode={cameraMode}
          onCapture={(file) => {
            if (handleSelectedFile(file)) setShowCamera(false)
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </form>
  )
}
