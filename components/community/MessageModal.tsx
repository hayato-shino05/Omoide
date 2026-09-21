'use client'

import { motion } from 'framer-motion'
import { MessageForm } from './MessageForm'
import { MessageList } from './MessageList'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { Icon } from '@/components/ui/Icon'

interface MessageModalProps {
  onClose: () => void
  birthdayPerson?: string
  initialThreadId?: string | number
}

export function MessageModal({ onClose, birthdayPerson, initialThreadId }: MessageModalProps) {
  const { t } = useLanguage()

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={t('sendMessage')}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFF9F3',
          border: '3px solid #D4B08C',
          borderRadius: '16px',
          padding: '28px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '85vh',
          overflow: 'auto',
          boxShadow: '8px 8px 0 #D4B08C',
        }}
      >
        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#854D27', fontFamily: 'var(--font-heading)', margin: 0, fontSize: '1.4rem' }}>
            {t('sendMessage')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#854D27',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
            }}
          >
            <Icon name="X" size={22} />
          </button>
        </div>

        {/* メッセージ送信フォーム */}
        <div style={{ marginBottom: '30px' }}>
          <MessageForm birthdayPerson={birthdayPerson} initialThreadId={initialThreadId} onSuccess={onClose} />
        </div>

        {/* 最近のメッセージ一覧 */}
        <div>
          <h3 style={{ color: '#854D27', fontSize: '1.05rem', fontWeight: 700, marginBottom: '15px' }}>{t('recentMessages')}</h3>
          <MessageList limit={5} />
        </div>
      </motion.div>
    </motion.div>
  )
}
