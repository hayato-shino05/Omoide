'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGifts, GIFT_CATALOG } from '@/lib/hooks/useGifts'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { Icon } from '@/components/ui/Icon'

interface GiftSelectorProps {
  onClose: () => void
  birthdayPerson?: string
}

export function GiftSelector({ onClose, birthdayPerson }: GiftSelectorProps) {
  const { gifts, sendGift } = useGifts()
  const { t } = useLanguage()
  const [sender, setSender] = useState('')
  const [selectedGift, setSelectedGift] = useState<{ emoji: string; nameKey: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSendGift = async () => {
    if (!sender.trim() || !selectedGift) return

    setIsSubmitting(true)
    const success = await sendGift(sender.trim(), selectedGift.emoji, t(selectedGift.nameKey as Parameters<typeof t>[0]), birthdayPerson)
    setIsSubmitting(false)

    if (success) {
      setSender('')
      setSelectedGift(null)
    }
  }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={t('sendVirtualGift')}
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
          maxWidth: '520px',
          width: '100%',
          maxHeight: '85vh',
          overflow: 'auto',
          boxShadow: '8px 8px 0 #D4B08C',
        }}
      >
        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#854D27', fontFamily: 'var(--font-heading)', margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="Gift" size={24} style={{ color: '#D95D39' }} />
            {t('sendVirtualGift')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
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
              outline: 'none',
            }}
            className="focus-visible:ring-2 focus-visible:ring-[#854D27]"
          >
            <Icon name="X" size={22} />
          </button>
        </div>

        {/* 送信者入力 */}
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="gift-sender-input" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#854D27', marginBottom: '6px' }}>
            {t('yourName')}
          </label>
          <input
            id="gift-sender-input"
            type="text"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            placeholder={t('yourName')}
            className="focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
            style={{
              width: '100%',
              minHeight: '44px',
              padding: '10px 14px',
              border: '2px solid #D4B08C',
              borderRadius: '8px',
              fontFamily: 'var(--font-body)',
              fontSize: '0.95rem',
              background: '#FFF9F3',
              color: '#2C1810',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* ギフト一覧グリッド */}
        <div style={{ marginBottom: '10px' }}>
          <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#854D27', marginBottom: '8px' }}>
            {t('chooseGift')}
          </span>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            {GIFT_CATALOG.map((gift) => {
              const isSelected = selectedGift?.emoji === gift.emoji
              return (
                <motion.button
                  key={gift.emoji}
                  type="button"
                  onClick={() => setSelectedGift(gift)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-pressed={isSelected}
                  aria-label={`${t(gift.nameKey as Parameters<typeof t>[0])} ${gift.emoji}`}
                  className="focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
                  style={{
                    minHeight: '64px',
                    padding: '10px 6px',
                    background: isSelected ? 'rgba(217, 93, 57, 0.15)' : '#FFF9F3',
                    border: `2px solid ${isSelected ? '#D95D39' : '#D4B08C'}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    boxShadow: isSelected ? '2px 2px 0 #D95D39' : 'none',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                >
                  <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>{gift.emoji}</span>
                  <span style={{ fontSize: '0.72rem', color: '#854D27', fontWeight: isSelected ? 700 : 500, textAlign: 'center' }}>
                    {t(gift.nameKey as Parameters<typeof t>[0])}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* 送信ボタン */}
        <button
          type="button"
          onClick={handleSendGift}
          disabled={!sender.trim() || !selectedGift || isSubmitting}
          className="focus-visible:ring-2 focus-visible:ring-[#854D27] outline-none"
          style={{
            width: '100%',
            minHeight: '44px',
            padding: '12px 25px',
            background: !sender.trim() || !selectedGift || isSubmitting ? '#999' : '#854D27',
            color: '#FFF9F3',
            border: '2px solid #D4B08C',
            borderRadius: '8px',
            cursor: !sender.trim() || !selectedGift || isSubmitting ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-body)',
            fontSize: '1rem',
            fontWeight: 700,
            boxShadow: '3px 3px 0 #D4B08C',
            transition: 'background 0.2s',
          }}
        >
          {isSubmitting ? t('sending') : t('sendGift')}
        </button>

        {/* 最近受け取ったギフト */}
        {gifts.length > 0 && (
          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #D4B08C' }}>
            <h3 style={{ color: '#854D27', fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px' }}>{t('receivedGifts')}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {gifts.slice(0, 10).map((gift) => (
                <div
                  key={gift.id}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(212, 176, 140, 0.25)',
                    border: '1px solid #D4B08C',
                    borderRadius: '20px',
                    fontSize: '0.82rem',
                    color: '#854D27',
                    fontWeight: 500,
                  }}
                >
                  {gift.gift_emoji} <span className="font-bold">{gift.sender}</span> {t('giftFrom')}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
