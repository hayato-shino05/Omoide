'use client'

import { DailyOmikuji, type DailyOmikujiProps } from '@/components/features/DailyOmikuji'
import Modal from '@/components/ui/Modal'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export interface OmikujiModalProps extends DailyOmikujiProps {
  isOpen?: boolean
}

/**
 * おみくじモーダルラッパーコンポーネント
 */
export function OmikujiModal({ isOpen = true, onClose, fortunes }: OmikujiModalProps) {
  const { t } = useLanguage()

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose || (() => {})} title={t('omikujiTitle')} size="md">
      <DailyOmikuji onClose={onClose} fortunes={fortunes} />
    </Modal>
  )
}

export { DailyOmikuji }
export default OmikujiModal
