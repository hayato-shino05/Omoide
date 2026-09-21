'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Icon } from '@/components/ui/Icon'
import { getSupabase } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export interface ChatMessage {
  id: number
  sender: string
  message: string
  created_at: string
  pending?: boolean
}

export function appendRealtimeChatMessage(
  messages: readonly ChatMessage[],
  message: ChatMessage,
): ChatMessage[] {
  if (messages.some((item) => item.id === message.id)) return [...messages]
  return [...messages, message]
}

export function mergeLoadedChatMessages(
  loadedMessages: readonly ChatMessage[],
  currentMessages: readonly ChatMessage[],
): ChatMessage[] {
  const messagesById = new Map<number, ChatMessage>()
  for (const message of loadedMessages) messagesById.set(message.id, message)
  for (const message of currentMessages) messagesById.set(message.id, message)

  return [...messagesById.values()].sort((left, right) => {
    const leftTime = Date.parse(left.created_at)
    const rightTime = Date.parse(right.created_at)
    if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) return left.id - right.id
    if (Number.isNaN(leftTime)) return 1
    if (Number.isNaN(rightTime)) return -1
    return leftTime - rightTime || left.id - right.id
  })
}

export function reconcileInsertedChatMessage(
  messages: readonly ChatMessage[],
  optimisticId: number,
  insertedMessage: ChatMessage,
): ChatMessage[] {
  const hasInsertedMessage = messages.some((item) => item.id === insertedMessage.id && !item.pending)
  let replacedOptimistic = false

  const reconciled = messages.flatMap((item) => {
    if (item.id !== optimisticId) return [item]
    replacedOptimistic = true
    return hasInsertedMessage ? [] : [insertedMessage]
  })

  if (replacedOptimistic || hasInsertedMessage) return reconciled
  return [...reconciled, insertedMessage]
}

function parseChatMessage(value: unknown): ChatMessage | null {
  if (typeof value !== 'object' || value === null) return null
  const record = value as Record<string, unknown>
  const message = typeof record.message === 'string'
    ? record.message
    : typeof record.text === 'string'
      ? record.text
      : null

  if (
    typeof record.id !== 'number' ||
    typeof record.sender !== 'string' ||
    message === null ||
    typeof record.created_at !== 'string'
  ) return null

  return {
    id: record.id,
    sender: record.sender,
    message,
    created_at: record.created_at,
  }
}

function persistFallbackChatMessage(message: ChatMessage): void {
  try {
    const parsed = JSON.parse(localStorage.getItem('birthdayChatMessages') || '[]') as unknown
    const storedMessages = Array.isArray(parsed)
      ? parsed.map(parseChatMessage).filter((item): item is ChatMessage => item !== null)
      : []

    if (storedMessages.some((item) => item.id === message.id)) return
    localStorage.setItem('birthdayChatMessages', JSON.stringify([...storedMessages, message]))
  } catch {
    return
  }
}

interface ChatRoomProps {
  onClose: () => void
}

export function ChatRoom({ onClose }: ChatRoomProps) {
  const { locale, t } = useLanguage()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [userName, setUserName] = useState('')
  const [isJoined, setIsJoined] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(false)
  const messagesRef = useRef<ChatMessage[]>([])
  const fallbackTimersRef = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  useEffect(() => {
    mountedRef.current = true
    const fallbackTimers = fallbackTimersRef.current
    return () => {
      mountedRef.current = false
      for (const [messageId, timer] of fallbackTimers) {
        clearTimeout(timer)
        const current = messagesRef.current.find((message) => message.id === messageId)
        if (current?.pending) {
          persistFallbackChatMessage({ ...current, pending: false })
        }
        fallbackTimers.delete(messageId)
      }
    }
  }, [])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // 共有ストレージから保存済みのユーザー名を読み込む
  useEffect(() => {
    // 共有ストレージを優先し、次にチャット専用領域を確認する
    const sharedName = localStorage.getItem('birthday_user_name')
    const chatName = localStorage.getItem('birthdayChatUserName')
    const saved = sharedName || chatName

    if (saved) {
      setUserName(saved)
      setIsJoined(true)
      // 共有ストレージへ同期する
      if (!sharedName && chatName) {
        localStorage.setItem('birthday_user_name', chatName)
      }
    }
  }, [])

  // チャット履歴を読み込む
  const loadMessages = useCallback(async () => {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) {
        if (error.code === '42P01') return
        throw error
      }
      const loadedMessages =
        data?.map(parseChatMessage).filter((message): message is ChatMessage => message !== null) ?? []
      if (!mountedRef.current) return
      setMessages((prev) => mergeLoadedChatMessages(loadedMessages, prev))
    } catch {
      // フォールバックとしてlocalStorageから読み込む
      try {
        const messagesData = localStorage.getItem('birthdayChatMessages')
        if (messagesData && mountedRef.current) {
          const parsed = JSON.parse(messagesData) as unknown
          if (Array.isArray(parsed)) {
            const loadedMessages = parsed
              .map(parseChatMessage)
              .filter((message): message is ChatMessage => message !== null)
            setMessages((prev) => mergeLoadedChatMessages(loadedMessages, prev))
          }
        }
      } catch {
        return
      }
    }
  }, [])

  // リアルタイム更新を購読する
  useEffect(() => {
    if (!isJoined) return

    loadMessages()

    let channel: ReturnType<typeof getSupabase>['channel'] extends (name: string) => infer R ? R : never
    try {
      const supabase = getSupabase()
      channel = supabase
        .channel('public:chat_messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        }, (payload) => {
          const message = parseChatMessage(payload.new)
          if (!message || !mountedRef.current) return
          setMessages((prev) => appendRealtimeChatMessage(prev, message))
        })
        .subscribe()
    } catch {
      // リアルタイム更新が利用できない
    }

    return () => {
      if (channel) {
        try {
          getSupabase().removeChannel(channel)
        } catch {
          // このエラーは無視する
        }
      }
    }
  }, [isJoined, loadMessages])

  // 最新メッセージへ自動スクロールする（描画フレームに合わせてスムーズに実行）
  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(frameId)
  }, [messages])

  const handleJoin = () => {
    if (!userName.trim()) return
    // 互換性のため両方のストレージへ保存する
    localStorage.setItem('birthdayChatUserName', userName.trim())
    localStorage.setItem('birthday_user_name', userName.trim())
    setIsJoined(true)
  }

  const handleSend = async () => {
    const trimmedMessage = newMessage.trim()
    if (!trimmedMessage || loading) return

    const messageData: ChatMessage = {
      id: -Date.now(),
      sender: userName,
      message: trimmedMessage,
      created_at: new Date().toISOString(),
      pending: true,
    }

    setMessages(prev => [...prev, messageData])
    setNewMessage('')
    setLoading(true)

    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          sender: userName,
          message: trimmedMessage,
        })
        .select('*')
        .single()

      if (error) throw error
      const insertedMessage = parseChatMessage(data)
      if (!insertedMessage) throw new Error('Supabase returned an invalid chat message')
      const fallbackTimer = fallbackTimersRef.current.get(messageData.id)
      if (fallbackTimer) {
        clearTimeout(fallbackTimer)
        fallbackTimersRef.current.delete(messageData.id)
      }
      if (mountedRef.current) {
        setMessages((prev) => reconcileInsertedChatMessage(prev, messageData.id, insertedMessage))
      }
    } catch {
      if (!mountedRef.current) {
        persistFallbackChatMessage({ ...messageData, pending: false })
        return
      }

      const fallbackTimer = setTimeout(() => {
        fallbackTimersRef.current.delete(messageData.id)
        const current = messagesRef.current.find((item) => item.id === messageData.id)
        if (!current || !current.pending) return

        const fallbackMessage = { ...messageData, pending: false }
        persistFallbackChatMessage(fallbackMessage)
        messagesRef.current = messagesRef.current.map((item) => item.id === messageData.id ? fallbackMessage : item)
        if (mountedRef.current) {
          setMessages((prev) => prev.map((item) => item.id === messageData.id ? fallbackMessage : item))
        }
      }, 3000)
      fallbackTimersRef.current.set(messageData.id, fallbackTimer)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 参加画面
  if (!isJoined) {
    return (
      <div className="chat-modal show" role="dialog" aria-modal="true" aria-label={t('groupChat')}>
        <div className="chat-header">
          <h3 className="chat-title">{t('groupChat')}</h3>
          <div className="chat-controls">
            <button
              type="button"
              className="chat-btn focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
              style={{ minWidth: '44px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={onClose}
              aria-label={t('close')}
            >
              <Icon name="X" size={18} />
            </button>
          </div>
        </div>
        <div className="chat-content" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h4 style={{ marginBottom: '15px', color: 'var(--community-primary)' }}>
              {t('enterNameToChat')}
            </h4>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder={`${t('yourName')}...`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleJoin()
                }
              }}
              className="chat-message-input focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
              style={{ marginBottom: '15px', width: '100%', minHeight: '44px' }}
            />
            <button
              type="button"
              onClick={handleJoin}
              disabled={!userName.trim()}
              className="chat-send-btn focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
              style={{ width: '100%', minHeight: '44px', opacity: userName.trim() ? 1 : 0.5 }}
            >
              {t('joinChat')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`chat-modal show ${isMinimized ? '' : 'chat-modal-expanded'}`} role="region" aria-label={t('groupChat')}>
      <div className="chat-header">
        <h3 className="chat-title">{t('groupChat')}</h3>
        <div className="chat-controls">
          <button
            type="button"
            className="chat-btn chat-minimize focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
            style={{ minWidth: '44px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setIsMinimized(!isMinimized)}
            aria-label={isMinimized ? t('expandChat') : t('minimizeChat')}
            aria-expanded={!isMinimized}
          >
            <Icon name="Minus" size={18} />
          </button>
          <button
            type="button"
            className="chat-btn focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
            style={{ minWidth: '44px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={onClose}
            aria-label={t('close')}
          >
            <Icon name="X" size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="chat-content" tabIndex={0} aria-label={t('groupChat')}>
            {messages.length === 0 ? (
              <p style={{ textAlign: 'center', opacity: 0.6 }}>
                {t('startConversation')}
              </p>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender === userName
                return (
                  <div
                    key={msg.id}
                    className={`chat-message ${isMe ? 'chat-message--sender' : 'chat-message--receiver'}`}
                  >
                    <div className="chat-message__sender">{msg.sender}</div>
                    {msg.message}
                    <div className="chat-message__time">{formatTime(msg.created_at)}</div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder={t('typeMessage')}
              className="chat-message-input focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
              style={{ minHeight: '44px' }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!newMessage.trim() || loading}
              className="chat-send-btn focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
              style={{ minWidth: '44px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label={t('sendMessage')}
            >
              <Icon name="Send" size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
