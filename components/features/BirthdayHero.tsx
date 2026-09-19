'use client'

import { motion } from 'framer-motion'
import type { Birthday } from '@/types'
import { formatBirthdayMessage } from '@/lib/utils/birthday'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { BirthdayMessage } from './BirthdayMessage'
import { BirthdayCake } from './BirthdayCake'

interface BirthdayHeroProps {
  person: Birthday
}

// 誕生日ヒーローセクション
export function BirthdayHero({ person }: BirthdayHeroProps) {
  const { language, t } = useLanguage()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center min-h-[80vh] px-4 gap-12"
    >
      <motion.h1
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-5xl md:text-7xl font-extrabold text-center text-[#D95D39] dark:text-[#E76F51] tracking-tight"
      >
        {t('happyBirthday')}
      </motion.h1>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="text-center"
      >
        <BirthdayMessage message={formatBirthdayMessage(person, language)} />
      </motion.div>

      {/* ケーキセクション */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        <BirthdayCake candleCount={5} />
      </motion.div>
    </motion.div>
  )
}
