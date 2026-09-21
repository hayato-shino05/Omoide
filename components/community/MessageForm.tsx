'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { ContributorPromptButtons } from './ContributorPromptButtons'
import { SelectedMusicTrackRow } from './SelectedMusicTrackRow'
import { SelectedPostRow } from './SelectedPostRow'
import type { TargetPostItem } from './PostPickerModal'
import { normalizeMediaFile, validateCommunityMediaFile } from '@/lib/validations/upload'
import { Icon } from '@/components/ui/Icon'
import { getSupabase } from '@/lib/supabase/client'

const CameraCapture = dynamic(() => import('./CameraCapture').then((mod) => mod.CameraCapture), { ssr: false })
const SongPickerModal = dynamic(() => import('./SongPickerModal'), { ssr: false })
const PostPickerModal = dynamic(() => import('./PostPickerModal'), { ssr: false })

/** 投稿モーダルの選択モード（新規投稿 vs 既存投稿へ返信） */
export type MessageFormMode = 'new' | 'reply'

/** 他コンポーネントとの互換性のための再エクスポート */
export type { TargetPostItem } from './PostPickerModal'

interface MessageFormProps {
  birthdayPerson?: string
  initialThreadId?: string | number
  defaultMode?: MessageFormMode
  onSuccess?: () => void
}

export function MessageForm({ birthdayPerson, initialThreadId, defaultMode = 'new', onSuccess }: MessageFormProps) {
  const { t } = useLanguage()

  // モード選択（初期スレッドIDが指定されている場合は自動的に返信モードを開始）
  const [mode, setMode] = useState<MessageFormMode>(initialThreadId ? 'reply' : defaultMode)

  // フォーム共通状態
  const [sender, setSender] = useState('')
  const [recipient, setRecipient] = useState('')
  const [message, setMessage] = useState('')
  const [musicTrackId, setMusicTrackId] = useState('')
  const [isMusicPickerOpen, setIsMusicPickerOpen] = useState(false)
  const [isPostPickerOpen, setIsPostPickerOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 返信先の対象投稿一覧および選択状態
  const [targetPosts, setTargetPosts] = useState<TargetPostItem[]>([])
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(
    initialThreadId ? String(initialThreadId) : null
  )
  const [isLoadingTargets, setIsLoadingTargets] = useState(false)
  const [lastAutoFilledTemplate, setLastAutoFilledTemplate] = useState<string | null>(null)

  // メディアアップロード関連の状態
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 共有ストレージから過去に入力した送信者名を復元
  useEffect(() => {
    try {
      const savedName = localStorage.getItem('birthday_user_name')
      if (savedName) {
        setSender(savedName)
      }
    } catch {
      // localStorage アクセス制限時のフォールバック
    }
  }, [])

  // コンポーネントアンマウント時のプレビューURL解放（メモリリーク防止）
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // 返信対象となるスレッドおよび掲示板投稿の取得
  const fetchTargetPosts = useCallback(async () => {
    setIsLoadingTargets(true)
    const combined: TargetPostItem[] = []

    try {
      // 1. お誕生日スレッドの取得
      const threadsRes = await fetch('/api/community/birthday-threads')
      if (threadsRes.ok) {
        const payload = (await threadsRes.json().catch(() => null)) as {
          data?: Array<{
            id: string | number
            sender: string
            message: string
            birthday_person: string | null
            celebration_date: string | null
            timezone: string | null
            created_at: string
            coverUrl: string | null
          }>
        } | null

        if (Array.isArray(payload?.data)) {
          payload.data.forEach((th) => {
            combined.push({
              id: th.id,
              type: 'thread',
              sender: th.sender,
              birthdayPerson: th.birthday_person,
              message: th.message,
              celebrationDate: th.celebration_date,
              coverUrl: th.coverUrl,
              createdAt: th.created_at,
            })
          })
        }
      }

      // 2. 掲示板投稿の取得
      try {
        const supabase = getSupabase()
        const { data: postsData } = await supabase
          .from('bulletin_posts')
          .select('id, sender, message, birthday_person, celebration_date, created_at, media_object_path')
          .order('created_at', { ascending: false })
          .limit(20)

        if (Array.isArray(postsData)) {
          const existingIds = new Set(combined.map((item) => String(item.id)))
          postsData.forEach((post) => {
            const strId = String(post.id)
            if (!existingIds.has(strId)) {
              let coverUrl: string | null = null
              if (post.media_object_path) {
                const { data } = supabase.storage.from('community-media').getPublicUrl(post.media_object_path)
                coverUrl = data?.publicUrl || null
              }
              combined.push({
                id: post.id,
                type: 'post',
                sender: post.sender,
                birthdayPerson: post.birthday_person,
                message: post.message,
                celebrationDate: post.celebration_date,
                coverUrl,
                createdAt: post.created_at,
              })
            }
          })
        }
      } catch {
        // Supabase直接読み込みエラー時はスレッドのみ使用
      }

      setTargetPosts(combined)

      // 初期選択の解決
      if (initialThreadId) {
        setSelectedTargetId(String(initialThreadId))
      } else if (birthdayPerson) {
        const matched = combined.find(
          (item) => item.birthdayPerson === birthdayPerson || String(item.id) === String(birthdayPerson)
        )
        if (matched) {
          setSelectedTargetId(String(matched.id))
        }
      }
    } catch {
      // ネットワーク障害時のフォールバック
    } finally {
      setIsLoadingTargets(false)
    }
  }, [birthdayPerson, initialThreadId])

  useEffect(() => {
    void fetchTargetPosts()
  }, [fetchTargetPosts])

  // 選択中の返信対象投稿
  const selectedTarget = targetPosts.find((item) => String(item.id) === selectedTargetId)

  // 対象投稿選択ハンドラ
  const handleSelectTarget = (target: TargetPostItem) => {
    const targetIdStr = String(target.id)
    setSelectedTargetId(targetIdStr)
    setError(null)

    // お祝い対象者名が存在する場合はメッセージテンプレートを自動補完
    const celebrantName = target.birthdayPerson || (target.type === 'thread' ? target.message : target.sender)
    if (celebrantName) {
      const template = t('birthdayWishTemplate', { name: celebrantName })
      if (!message.trim() || message === lastAutoFilledTemplate) {
        setMessage(template)
        setLastAutoFilledTemplate(template)
      }
    }
  }

  // ファイル選択のバリデーションと反映
  const handleSelectedFile = (file: File): boolean => {
    const normalizedFile = normalizeMediaFile(file)
    const validation = validateCommunityMediaFile(normalizedFile)
    if (!validation.valid) {
      setError(
        file.size > 50 * 1024 * 1024
          ? t('fileTooLargeWithLimit', { size: 50 })
          : t('fileTypeError')
      )
      return false
    }

    setSelectedFile(normalizedFile)
    setError(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(normalizedFile))
    return true
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // 送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedSender = sender.trim()
    const trimmedMessage = message.trim()

    // 必須バリデーション
    if (!trimmedSender) {
      setError(t('allFieldsRequired'))
      return
    }

    if (mode === 'new') {
      if (!trimmedMessage) {
        setError(t('allFieldsRequired'))
        return
      }
    } else {
      // 返信モード: 対象投稿の選択が必須
      if (!selectedTargetId) {
        setError(t('selectTargetPostFirst'))
        return
      }
      if (!trimmedMessage && !musicTrackId) {
        setError(t('allFieldsRequired'))
        return
      }
    }

    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      if (mode === 'reply') {
        // モードB: 既存投稿へのコメント (/api/community/reply へ送信)
        const response = await fetch('/api/community/reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId: selectedTargetId,
            sender: trimmedSender,
            content: trimmedMessage || null,
            musicTrackId: musicTrackId || null,
          }),
        })

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null
          setError(payload?.error ?? t('sendMessageFailed'))
          return
        }
      } else {
        // モードA: 新規投稿を作成 (/api/community へ送信)
        const formData = new FormData()
        formData.set('kind', 'message')
        formData.set('sender', trimmedSender)
        formData.set('content', trimmedMessage)
        if (recipient.trim()) formData.set('birthdayPerson', recipient.trim())
        if (musicTrackId) formData.set('musicTrackId', musicTrackId)
        if (selectedFile) formData.set('media', selectedFile, selectedFile.name)

        const success = await sendFormDataWithProgress(formData)
        if (!success) return
      }

      // 送信者名を localStorage に保存
      try {
        localStorage.setItem('birthday_user_name', trimmedSender)
      } catch {
        // ignore
      }

      // フォームのクリア
      setMessage('')
      setRecipient('')
      setMusicTrackId('')
      setLastAutoFilledTemplate(null)
      removeFile()

      onSuccess?.()
    } catch {
      setError(t('genericError'))
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  // FormData 送信（進行度トラッキング付き）
  const sendFormDataWithProgress = async (formData: FormData): Promise<boolean> => {
    if (selectedFile) {
      const xhrResponse = await new Promise<XMLHttpRequest>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', '/api/community')
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100))
          }
        }
        xhr.onload = () => resolve(xhr)
        xhr.onerror = () => reject(new Error('Network request failed'))
        xhr.onabort = () => reject(new Error('Network request aborted'))
        xhr.send(formData)
      })

      if (xhrResponse.status < 200 || xhrResponse.status >= 300) {
        let errorMsg: string | undefined
        try {
          errorMsg = (JSON.parse(xhrResponse.responseText) as { error?: string }).error
        } catch {
          errorMsg = undefined
        }
        setError(errorMsg ?? t('sendMessageFailed'))
        return false
      }
      setUploadProgress(100)
      return true
    }

    const response = await fetch('/api/community', { method: 'POST', body: formData })
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      setError(payload?.error ?? t('sendMessageFailed'))
      return false
    }
    return true
  }

  const isVideo = selectedFile?.type.startsWith('video/')

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 2つの選択オプション（モード切替） */}
      <div
        role="tablist"
        aria-label={t('sendMessage')}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          background: 'rgba(212, 176, 140, 0.15)',
          padding: '5px',
          borderRadius: '10px',
          border: '1.5px solid #D4B08C',
        }}
      >
        {/* モードA: 新規投稿を作成 */}
        <button
          type="button"
          role="tab"
          id="tab-mode-new"
          aria-selected={mode === 'new'}
          aria-controls="panel-mode-new"
          onClick={() => {
            setMode('new')
            setError(null)
          }}
          style={{
            padding: '10px 12px',
            border: mode === 'new' ? '2px solid #854D27' : '1px solid transparent',
            borderRadius: '8px',
            background: mode === 'new' ? '#FFF9F3' : 'transparent',
            color: '#854D27',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: mode === 'new' ? '2px 2px 0 #854D27' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <Icon name="PenLine" size={16} style={{ color: mode === 'new' ? '#D95D39' : 'inherit' }} />
          <span>{t('postModeNew')}</span>
        </button>

        {/* モードB: 既存の投稿にコメント */}
        <button
          type="button"
          role="tab"
          id="tab-mode-reply"
          aria-selected={mode === 'reply'}
          aria-controls="panel-mode-reply"
          onClick={() => {
            setMode('reply')
            setError(null)
          }}
          style={{
            padding: '10px 12px',
            border: mode === 'reply' ? '2px solid #D95D39' : '1px solid transparent',
            borderRadius: '8px',
            background: mode === 'reply' ? '#FFF5F0' : 'transparent',
            color: mode === 'reply' ? '#D95D39' : '#854D27',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: mode === 'reply' ? '2px 2px 0 #D95D39' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <Icon name="MessageCircle" size={16} style={{ color: mode === 'reply' ? '#D95D39' : 'inherit' }} />
          <span>{t('postModeReply')}</span>
        </button>
      </div>

      {/* モード説明バナー */}
      <div
        style={{
          padding: '10px 14px',
          background: mode === 'new' ? 'rgba(133, 77, 39, 0.06)' : 'rgba(217, 93, 57, 0.08)',
          border: `1.5px solid ${mode === 'new' ? '#D4B08C' : '#D95D39'}`,
          borderRadius: '8px',
          fontSize: '0.82rem',
          color: '#854D27',
          lineHeight: '1.4',
        }}
      >
        {mode === 'new' ? t('createPostSubtitle') : t('replyToPostSubtitle')}
      </div>

      {/* モードB専用: 既存投稿・スレッドのスマートな選択エリア */}
      {mode === 'reply' && (
        <SelectedPostRow
          post={selectedTarget}
          onOpenPicker={() => setIsPostPickerOpen(true)}
          onClear={() => setSelectedTargetId(null)}
          isLoading={isLoadingTargets}
        />
      )}

      {/* 送信者名入力 */}
      <div>
        <label
          htmlFor="message-form-sender"
          style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#854D27', marginBottom: '4px' }}
        >
          {t('yourName')}
        </label>
        <input
          id="message-form-sender"
          type="text"
          value={sender}
          onChange={(e) => setSender(e.target.value)}
          placeholder={t('yourName')}
          aria-label={t('yourName')}
          required
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '2px solid #D4B08C',
            borderRadius: 0,
            fontFamily: 'var(--font-body)',
            fontSize: '0.95rem',
            background: '#FFF9F3',
            color: '#2C1810',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* モードA専用: お祝い対象者（任意） */}
      {mode === 'new' && (
        <div>
          <label
            htmlFor="message-form-recipient"
            style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#854D27', marginBottom: '4px' }}
          >
            {t('recipientOptional')}
          </label>
          <input
            id="message-form-recipient"
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder={t('recipientExamplePlaceholder')}
            aria-label={t('recipientOptional')}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '2px solid #D4B08C',
              borderRadius: 0,
              fontFamily: 'var(--font-body)',
              fontSize: '0.95rem',
              background: '#FFF9F3',
              color: '#2C1810',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {/* メッセージ本文 */}
      <div>
        <label
          htmlFor="message-form-content"
          style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#854D27', marginBottom: '4px' }}
        >
          {mode === 'new' ? t('typeMessage') : t('typeReply')}
        </label>
        <textarea
          id="message-form-content"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={mode === 'new' ? t('typeMessage') : t('typeReply')}
          aria-label={t('messagePlaceholder')}
          rows={3}
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '2px solid #D4B08C',
            borderRadius: 0,
            fontFamily: 'var(--font-body)',
            fontSize: '0.95rem',
            background: '#FFF9F3',
            color: '#2C1810',
            resize: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* メッセージの提案ボタン */}
      <ContributorPromptButtons hasContent={message.trim().length > 0} onSelect={setMessage} />

      {/* 楽曲選択・プレビュー */}
      <SelectedMusicTrackRow
        value={musicTrackId}
        onChange={setMusicTrackId}
        onOpenPicker={() => setIsMusicPickerOpen(true)}
      />

      {/* モードA専用: メディア添付エリア */}
      {mode === 'new' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />

          {!selectedFile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* ライブラリから選択 */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '2px dashed #D4B08C',
                  borderRadius: 0,
                  background: 'rgba(212, 176, 140, 0.1)',
                  color: '#854D27',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Icon name="Folder" size={16} />
                <span>{t('chooseFromLibrary')}</span>
              </button>

              {/* カメラ撮影ボタン */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setCameraMode('photo')
                    setShowCamera(true)
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: '2px solid #D4B08C',
                    borderRadius: 0,
                    background: '#854D27',
                    color: '#FFF9F3',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '2px 2px 0 #D4B08C',
                  }}
                >
                  <Icon name="Camera" size={15} />
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
                    padding: '10px 12px',
                    border: '2px solid #D4B08C',
                    borderRadius: 0,
                    background: '#854D27',
                    color: '#FFF9F3',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '2px 2px 0 #D4B08C',
                  }}
                >
                  <Icon name="Video" size={15} />
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
              {/* プレビュー表示 */}
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                {isVideo ? (
                  <video
                    src={previewUrl || ''}
                    style={{
                      width: '100%',
                      maxHeight: '180px',
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
                      maxHeight: '180px',
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
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'rgba(220, 53, 69, 0.9)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="X" size={16} />
                </button>
              </div>

              {/* ファイル情報 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#854D27' }}>
                <Icon name={isVideo ? 'Video' : 'Image'} size={15} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedFile.name}
                </span>
                <span style={{ opacity: 0.7 }}>{(selectedFile.size / 1024 / 1024).toFixed(1)}MB</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* アップロード進行状況 */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuenow={uploadProgress}
          aria-valuemax={100}
          aria-label={t('uploadProgress', { progress: uploadProgress })}
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
                width: '100%',
                background: '#854D27',
                transform: `scaleX(${uploadProgress / 100})`,
                transformOrigin: 'left',
                transition: 'transform 0.3s ease-out',
                willChange: 'transform',
              }}
            />
          </div>
          <p style={{ fontSize: '0.78rem', color: '#854D27', marginTop: '4px', textAlign: 'center' }}>
            {t('uploadProgress', { progress: uploadProgress })}
          </p>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div
          role="alert"
          style={{
            color: '#dc3545',
            background: 'rgba(220, 53, 69, 0.1)',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(220, 53, 69, 0.3)',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      {/* 送信ボタン */}
      <motion.button
        type="submit"
        disabled={isSubmitting}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
        style={{
          width: '100%',
          minHeight: '44px',
          padding: '12px 20px',
          background: isSubmitting ? '#999' : mode === 'reply' ? '#D95D39' : '#854D27',
          color: '#FFF9F3',
          border: '2px solid #D4B08C',
          borderRadius: '8px',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-body)',
          fontSize: '0.95rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          boxShadow: '3px 3px 0 #D4B08C',
          transition: 'background 0.2s',
        }}
      >
        {isSubmitting
          ? t('sending')
          : mode === 'reply'
            ? t('reply')
            : t('sendWish')}
      </motion.button>

      {/* カメラキャプチャモーダル */}
      <AnimatePresence>
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
      </AnimatePresence>

      {/* 楽曲選択モーダル */}
      <SongPickerModal
        isOpen={isMusicPickerOpen}
        onClose={() => setIsMusicPickerOpen(false)}
        onConfirm={(reference) => {
          setMusicTrackId(reference)
          setIsMusicPickerOpen(false)
        }}
        initialValue={musicTrackId}
      />

      {/* 返信用投稿選択モーダル */}
      <PostPickerModal
        isOpen={isPostPickerOpen}
        onClose={() => setIsPostPickerOpen(false)}
        onConfirm={(target) => {
          handleSelectTarget(target)
          setIsPostPickerOpen(false)
        }}
        initialSelectedId={selectedTargetId}
        posts={targetPosts}
        isLoading={isLoadingTargets}
      />
    </form>
  )
}
