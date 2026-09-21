'use client'

import { motion } from 'framer-motion'

interface BirthdayMessageProps {
  message: string
}

// 誕生日メッセージコンポーネント
export function BirthdayMessage({ message }: BirthdayMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.8 }}
      className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl max-w-2xl mx-auto border-2 border-white/50"
      style={{
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
      }}
    >
      <p 
        className="text-2xl md:text-3xl text-center leading-relaxed font-bold text-[#2C1810] dark:text-stone-100"
      >
        {message}
      </p>
    </motion.div>
  )
}
