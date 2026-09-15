'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { CameraCapture } from './CameraCapture'
import { ContributorPromptButtons } from './ContributorPromptButtons'
import { SelectedMusicTrackRow } from './SelectedMusicTrackRow'
import SongPickerModal from './SongPickerModal'
import { normalizeMediaFile, validateCommunityMediaFile } from '@/lib/validations/upload'
import { Icon } from '@/components/ui/Icon'
import { getSupabase } from '@/lib/supabase/client'

/** 投稿モーダルの選択モード（新規投稿 vs 既存投稿へ返信） */
export type MessageFormMode = 'new' | 'reply'

/** 返信先として選択可能な投稿／スレッドの項目データ */
export interface TargetPostItem {
  id: string | number
  type: 'thread' | 'post'
  sender: string
  birthdayPerson: string | null
  message: string
  celebrationDate: string | null
  coverUrl: string | null
  createdAt: string
}

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
      if (!trimmedMessage && !musicTrackId && !selectedFile) {
        setError(t('allFieldsRequired'))
        return
      }
    }

    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      if (mode === 'reply') {
        // モードB: 既存投稿へのコメント
        if (!selectedFile) {
          // メディア添付なし: /api/community/reply へ JSON 送信
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
          // メディア添付あり: /api/community へ FormData 送信
          const formData = new FormData()
          formData.set('kind', 'message')
          formData.set('sender', trimmedSender)
          formData.set('content', trimmedMessage)
          const targetCelebrant = selectedTarget?.birthdayPerson || recipient.trim() || undefined
          if (targetCelebrant) formData.set('birthdayPerson', targetCelebrant)
          if (musicTrackId) formData.set('musicTrackId', musicTrackId)
          formData.set('media', selectedFile, selectedFile.name)

          const success = await sendFormDataWithProgress(formData)
          if (!success) return
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
          padding: '8px 12px',
          background: mode === 'new' ? 'rgba(133, 77, 39, 0.06)' : 'rgba(217, 93, 57, 0.08)',
          borderLeft: `3px solid ${mode === 'new' ? '#854D27' : '#D95D39'}`,
          borderRadius: '4px',
          fontSize: '0.8rem',
          color: '#854D27',
          lineHeight: '1.4',
        }}
      >
        {mode === 'new' ? t('createPostSubtitle') : t('replyToPostSubtitle')}
      </div>

      {/* モードB専用: 既存投稿・スレッドの視覚的カード選択エリア */}
      {mode === 'reply' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#854D27',
              }}
            >
              <Icon name="ClipboardList" size={16} style={{ color: '#D95D39' }} />
              <span>{t('selectPostToReply')}</span>
            </label>
            {selectedTarget && (
              <span
                style={{
                  fontSize: '0.72rem',
                  color: '#D95D39',
                  fontWeight: 700,
                  background: 'rgba(217, 93, 57, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  maxWidth: '180px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {t('replyTargetPost', {
                  name: selectedTarget.birthdayPerson || selectedTarget.sender,
                })}
              </span>
            )}
          </div>

          {isLoadingTargets ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                color: '#854D27',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Icon name="LoaderCircle" size={18} className="animate-spin" />
              <span>{t('loading')}</span>
            </div>
          ) : targetPosts.length === 0 ? (
            <div
              style={{
                padding: '18px',
                textAlign: 'center',
                background: '#FFF9F3',
                border: '1.5px dashed #D4B08C',
                borderRadius: '8px',
                color: '#854D27',
                fontSize: '0.85rem',
              }}
            >
              <p style={{ margin: 0, opacity: 0.8 }}>{t('noPostsToReply')}</p>
            </div>
          ) : (
            <div
              role="radiogroup"
              aria-label={t('selectPostToReply')}
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
              {targetPosts.map((target) => {
                const isSelected = selectedTargetId === String(target.id)
                const isThread = target.type === 'thread'
                const displayName = target.birthdayPerson || target.sender

                return (
                  <motion.button
                    key={`${target.type}-${target.id}`}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectTarget(target)}
                    style={{
                      flex: '0 0 auto',
                      minWidth: '160px',
                      maxWidth: '210px',
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
                    {/* 種別バッジ＆選択チェック */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: isThread ? 'rgba(233, 30, 99, 0.12)' : 'rgba(45, 140, 255, 0.12)',
                          color: isThread ? '#E91E63' : '#2D8CFF',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                        }}
                      >
                        <Icon name={isThread ? 'Cake' : 'ClipboardList'} size={11} />
                        <span>{isThread ? t('postTypeThread') : t('postTypeBulletin')}</span>
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

                    {/* 送信者・対象者＆サムネイル */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {target.coverUrl ? (
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
                            src={target.coverUrl}
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
                          {displayName[0]?.toUpperCase() || '?'}
                        </span>
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
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
                          {displayName}
                        </div>
                        {target.celebrationDate && (
                          <div style={{ fontSize: '0.68rem', color: '#854D27', opacity: 0.7 }}>
                            {target.celebrationDate}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 本文プレビュー */}
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.75rem',
                        color: '#5D4037',
                        lineHeight: '1.3',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {target.message}
                    </p>
                  </motion.button>
                )
              })}
            </div>
          )}
        </div>
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

      {/* メディア添付エリア */}
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
                width: `${uploadProgress}%`,
                background: '#854D27',
                transition: 'width 0.3s',
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
            borderRadius: '6px',
            border: '1px solid rgba(220, 53, 69, 0.3)',
            fontSize: '0.85rem',
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
        style={{
          width: '100%',
          padding: '12px 20px',
          background: isSubmitting ? '#999' : mode === 'reply' ? '#D95D39' : '#854D27',
          color: '#FFF9F3',
          border: '2px solid #D4B08C',
          borderRadius: 0,
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-body)',
          fontSize: '0.95rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          boxShadow: '4px 4px 0 #D4B08C',
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
    </form>
  )
}
