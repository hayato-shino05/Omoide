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

interface BirthdayThread {
  id: string | number
  sender: string
  message: string
  birthday_person: string | null
  celebration_date: string | null
  timezone: string | null
  created_at: string
  coverUrl: string | null
}

interface MessageFormProps {
  birthdayPerson?: string
  initialThreadId?: string | number
  onSuccess?: () => void
}

export function MessageForm({ birthdayPerson, initialThreadId, onSuccess }: MessageFormProps) {
  const { t } = useLanguage()
  const [sender, setSender] = useState('')
  const [birthdayThreads, setBirthdayThreads] = useState<BirthdayThread[]>([])
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    initialThreadId ? String(initialThreadId) : null
  )
  const [lastAutoFilledTemplate, setLastAutoFilledTemplate] = useState<string | null>(null)
  
  // 共有ストレージから送信者名を自動入力
  useEffect(() => {
    const savedName = localStorage.getItem('birthday_user_name')
    if (savedName) {
      setSender(savedName)
    }
  }, [])

  // 本日のお誕生日スレッド一覧を取得
  useEffect(() => {
    let isMounted = true
    async function fetchBirthdayThreads() {
      try {
        const response = await fetch('/api/community/birthday-threads')
        const payload = (await response.json().catch(() => null)) as { data?: BirthdayThread[] } | null
        if (isMounted && response.ok && Array.isArray(payload?.data)) {
          setBirthdayThreads(payload.data)
          // 初期スレッドIDまたは対象者名が渡されている場合は初期選択
          if (initialThreadId) {
            setSelectedThreadId(String(initialThreadId))
          } else if (birthdayPerson) {
            const matched = payload.data.find(
              (th) => th.birthday_person === birthdayPerson || String(th.id) === String(birthdayPerson)
            )
            if (matched) {
              setSelectedThreadId(String(matched.id))
            }
          }
        }
      } catch {
        // ネットワークエラー時はフォールバックとして空配列
      }
    }
    void fetchBirthdayThreads()
    return () => {
      isMounted = false
    }
  }, [birthdayPerson, initialThreadId])

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

  // 選択中の誕生日スレッド
  const selectedThread = birthdayThreads.find((th) => String(th.id) === selectedThreadId)

  // 対象者カード選択時の処理（温かいメッセージテンプレートの提案・自動補完）
  const handleSelectRecipient = (thread: BirthdayThread | null) => {
    if (thread) {
      const threadIdStr = String(thread.id)
      setSelectedThreadId(threadIdStr)
      const celebrantName = thread.birthday_person || thread.message
      const template = t('birthdayWishTemplate', { name: celebrantName })
      // メッセージが空、または以前の自動補完テンプレートのままの場合は新テンプレートを反映
      if (!message.trim() || message === lastAutoFilledTemplate) {
        setMessage(template)
        setLastAutoFilledTemplate(template)
      }
    } else {
      setSelectedThreadId(null)
      // 「みんなへ」選択時、自動補完テンプレートのままならクリア
      if (message === lastAutoFilledTemplate) {
        setMessage('')
        setLastAutoFilledTemplate(null)
      }
    }
  }

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
    // 1. 誕生日スレッドが選択されており、メディアファイルがない場合: /api/community/reply へ送信してスレッドに紐付け
    if (selectedThread && !selectedFile) {
      const response = await fetch('/api/community/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: String(selectedThread.id),
          sender: payload.sender,
          content: payload.message,
          musicTrackId: payload.musicTrackId || null,
        }),
      })
      if (!response.ok) {
        const responsePayload = (await response.json().catch(() => null)) as { error?: string } | null
        setError(responsePayload?.error ?? t('sendMessageFailed'))
        return false
      }
      return true
    }

    // 2. 全体宛て、またはメディア添付がある場合: /api/community へ送信
    const formData = new FormData()
    formData.set('kind', 'message')
    formData.set('sender', payload.sender)
    formData.set('content', payload.message)
    const targetBirthdayPerson = selectedThread?.birthday_person ?? payload.birthdayPerson
    if (targetBirthdayPerson) formData.set('birthdayPerson', targetBirthdayPerson)
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
      const success = await submitMessage({
        sender: sender.trim(),
        message: message.trim(),
        birthdayPerson: selectedThread?.birthday_person ?? birthdayPerson,
        musicTrackId: musicTrackId || undefined,
      })

      if (success) {
        // 送信者名を共有ストレージに保存
        try {
          localStorage.setItem('birthday_user_name', sender.trim())
        } catch {
          console.warn('Failed to save sender name')
        }
        // 送信者名は保持し、メッセージのみクリア
        setMessage('')
        setLastAutoFilledTemplate(null)
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
      {/* お祝いする相手の選択（Celebrant Card Selector） */}
      <div style={{ marginBottom: '16px' }} role="group" aria-labelledby="celebrant-selector-label">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label
            id="celebrant-selector-label"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.88rem',
              fontWeight: 700,
              color: '#854D27',
              letterSpacing: '0.02em',
            }}
          >
            <Icon name="Sparkles" size={16} style={{ color: '#D95D39' }} />
            <span>{t('selectCelebrant')}</span>
          </label>
          {selectedThread && (
            <span
              style={{
                fontSize: '0.75rem',
                color: '#D95D39',
                fontWeight: 600,
                background: 'rgba(217, 93, 57, 0.08)',
                padding: '2px 8px',
                borderRadius: '4px',
              }}
            >
              {t('selectedRecipient', { name: selectedThread.birthday_person || selectedThread.message })}
            </span>
          )}
        </div>

        <div
          role="radiogroup"
          aria-labelledby="celebrant-selector-label"
          style={{
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            paddingBottom: '8px',
            paddingTop: '2px',
            paddingLeft: '2px',
            paddingRight: '2px',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* 「みんなへ（全体）」カード */}
          <motion.button
            type="button"
            role="radio"
            aria-checked={selectedThreadId === null}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectRecipient(null)}
            style={{
              flex: '0 0 auto',
              minWidth: '130px',
              maxWidth: '160px',
              padding: '10px',
              background: selectedThreadId === null ? '#FFF9F3' : '#FFFFFF',
              border: selectedThreadId === null ? '2px solid #854D27' : '1.5px solid #D4B08C',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left',
              boxShadow: selectedThreadId === null ? '3px 3px 0 #854D27' : '1.5px 1.5px 0 rgba(212, 176, 140, 0.4)',
              transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: selectedThreadId === null ? '#854D27' : 'rgba(133, 77, 39, 0.1)',
                  color: selectedThreadId === null ? '#FFF9F3' : '#854D27',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="Sparkles" size={16} />
              </div>
              {selectedThreadId === null && (
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#854D27',
                    color: '#FFF9F3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                  }}
                >
                  <Icon name="CircleCheck" size={14} useSvg />
                </span>
              )}
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#2C1810',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {t('toEveryone')}
              </div>
            </div>
          </motion.button>

          {/* 本日の誕生日スレッド カード群 */}
          {birthdayThreads.map((thread) => {
            const isSelected = selectedThreadId === String(thread.id)
            const celebrantName = thread.birthday_person || thread.message
            return (
              <motion.button
                key={thread.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectRecipient(thread)}
                style={{
                  flex: '0 0 auto',
                  minWidth: '150px',
                  maxWidth: '190px',
                  padding: '10px',
                  background: isSelected ? '#FFF5F0' : '#FFFFFF',
                  border: isSelected ? '2px solid #D95D39' : '1.5px solid #D4B08C',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: isSelected ? '3px 3px 0 #D95D39' : '1.5px 1.5px 0 rgba(212, 176, 140, 0.4)',
                  transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  position: 'relative',
                }}
              >
                {/* バースデーバッジ */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: 'rgba(217, 93, 57, 0.12)',
                      color: '#D95D39',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                    }}
                  >
                    <Icon name="Cake" size={10} />
                    <span>{t('todaysBirthday')}</span>
                  </span>
                  {isSelected && (
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: '#D95D39',
                        color: '#FFF9F3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                      }}
                    >
                      <Icon name="CircleCheck" size={14} useSvg />
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {thread.coverUrl ? (
                    <span
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        flexShrink: 0,
                        display: 'inline-block',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thread.coverUrl}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </span>
                  ) : (
                    <span
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: isSelected ? '#D95D39' : '#854D27',
                        color: '#FFF9F3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {celebrantName[0]?.toUpperCase() || '?'}
                    </span>
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: '#2C1810',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {celebrantName}
                    </div>
                    {thread.celebration_date && (
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: '#854D27',
                          opacity: 0.7,
                        }}
                      >
                        {thread.celebration_date}
                      </div>
                    )}
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>
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
