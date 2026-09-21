'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import Modal from '@/components/ui/Modal'
import { Icon } from '@/components/ui/Icon'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useToast } from '@/components/ui/Toast'
import { exportElementAsPng } from '@/lib/export/keepsakeExporter'

export interface KeepsakeExportModalProps {
  isOpen: boolean
  onClose: () => void
  initialRecipient?: string
  initialMessage?: string
  initialDate?: string
}

/**
 * 記念カード（想い出ポラロイド・メッセージカード）画像エクスポートモーダル
 */
export function KeepsakeExportModal({
  isOpen,
  onClose,
  initialRecipient = '',
  initialMessage = '',
  initialDate = '',
}: KeepsakeExportModalProps) {
  const { t, language } = useLanguage()
  const toast = useToast()
  const [recipient, setRecipient] = useState(initialRecipient)
  const [message, setMessage] = useState(initialMessage)
  const [isExporting, setIsExporting] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const isJa = language === 'ja'
  const displayDate =
    initialDate ||
    new Date().toLocaleDateString(isJa ? 'ja-JP' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

  const handleExport = async () => {
    if (!cardRef.current || isExporting) return
    setIsExporting(true)

    try {
      const filename = `omoide-keepsake-${Date.now()}.png`
      const result = await exportElementAsPng(cardRef.current, filename, {
        scale: 2,
        backgroundColor: '#FFFDF9',
      })

      if (result) {
        toast.success(t('notificationSaveSuccess'))
      } else {
        toast.error(t('notificationSaveFailed'))
      }
    } catch {
      toast.error(t('notificationSaveFailed'))
    } finally {
      setIsExporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isJa ? '記念カードのエクスポート' : 'Export Keepsake Card'}
      size="md"
    >
      <div className="flex flex-col gap-5 p-2">
        {/* 入力フォーム */}
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-bold text-[#854D27] mb-1">
              {t('selectedRecipient', { name: recipient || (isJa ? '大切な人' : 'Loved One') })}
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={isJa ? 'お名前を入力 (例: さくらさん)' : 'Enter name'}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#D4B08C] bg-[#FFF9F3] text-[#854D27] focus:outline-hidden focus:ring-2 focus:ring-[#854D27]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#854D27] mb-1">
              {t('messagePlaceholder')}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                isJa
                  ? '心からの想い出メッセージを書き留めてください...'
                  : 'Write a heartfelt message...'
              }
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#D4B08C] bg-[#FFF9F3] text-[#854D27] focus:outline-hidden focus:ring-2 focus:ring-[#854D27] resize-none"
            />
          </div>
        </div>

        {/* プレビューカード（Retina 高解像度キャプチャ対象） */}
        <div className="flex flex-col items-center justify-center p-3 bg-[#854D27]/5 rounded-2xl border border-[#D4B08C]/40">
          <span className="text-[11px] font-bold text-[#854D27]/70 uppercase tracking-wider mb-2">
            {t('preview')}
          </span>

          <div
            ref={cardRef}
            id="omoide-keepsake-card-preview"
            className="w-full max-w-sm bg-[#FFFDF9] border-2 border-[#D4B08C] rounded-2xl p-6 shadow-lg text-center relative overflow-hidden"
            style={{
              backgroundImage: 'radial-gradient(#D4B08C 0.6px, transparent 0.6px)',
              backgroundSize: '16px 16px',
            }}
          >
            {/* 上部ヘッダー */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#D4B08C]/40">
              <span className="text-[10px] font-bold text-[#854D27] tracking-widest uppercase flex items-center gap-1">
                <Icon name="Sparkles" size={12} />
                <span>Omoide Bako</span>
              </span>
              <span className="text-[10px] text-[#854D27]/80">{displayDate}</span>
            </div>

            {/* お祝い宛先 */}
            <div className="my-3">
              <h3 className="text-xl font-bold font-serif text-[#854D27]">
                {recipient ? (isJa ? `親愛なる ${recipient} へ` : `Dear ${recipient}`) : (isJa ? '大切なあなたへ' : 'For You')}
              </h3>
            </div>

            {/* メッセージ本文 */}
            <div className="bg-[#FFF9F3] border border-[#D4B08C]/50 rounded-xl p-4 my-4 text-left">
              <p className="text-xs text-[#854D27] font-serif leading-relaxed italic">
                &ldquo;{message || (isJa ? 'かけがえのない想い出と、あたたかな日々に感謝を込めて。' : 'Wishing you endless joy, cherished memories, and warm blessings.')}&rdquo;
              </p>
            </div>

            {/* フッター */}
            <div className="pt-2 text-[10px] text-[#854D27]/60 font-serif">
              想い出箱（Omoide Bako）— 大切な記念日と思い出を分かち合う空間
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#D4B08C]/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#854D27] hover:bg-[#854D27]/10 rounded-xl transition-colors font-medium"
          >
            {t('cancel')}
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#854D27] to-[#A05D30] text-[#FFF9F3] font-bold text-sm shadow-md hover:brightness-110 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <Icon name="Download" size={16} />
            <span>{isExporting ? t('exportingImage') : t('saveImage')}</span>
          </motion.button>
        </div>
      </div>
    </Modal>
  )
}

export default KeepsakeExportModal
