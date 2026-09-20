'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { Icon } from '@/components/ui/Icon'
import { OMIKUJI_DATA, OMIKUJI_FORTUNES, type OmikujiFortune } from '@/data/omikujiData'
import { useDailyFortunes } from '@/lib/hooks/useDailyFortunes'
import { LANGUAGE_COOKIE_NAME } from '@/lib/i18n/cookie'
import { DEFAULT_LOCALE, translate } from '@/lib/i18n/resolveLocale'
import type { Locale } from '@/lib/i18n/types'
import {
  appendOmikujiHistory,
  getOmikujiDateKey,
  getOmikujiStreak,
  OMIKUJI_HISTORY_STORAGE_KEY,
  parseOmikujiHistory,
  type OmikujiHistoryEntry,
} from '@/lib/omikujiHistory'

function readCookieLocale(): Locale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE
  const match = document.cookie.match(new RegExp(`${LANGUAGE_COOKIE_NAME}=([^;]+)`))
  return match?.[1] === 'en' ? 'en' : DEFAULT_LOCALE
}

function Omikuji3dLoading() {
  const locale = readCookieLocale()
  return (
    <div className="w-full h-64 flex flex-col items-center justify-center gap-2">
      <div className="w-8 h-8 border-3 border-[#D4B08C]/30 border-t-[#854D27] rounded-full animate-spin" />
      <span className="text-xs text-[#854D27]/70">{translate(locale, 'omikuji3dLoading', DEFAULT_LOCALE)}</span>
    </div>
  )
}

// 3D おみくじ筒を SSR 回避でダイナミックインポート
const OmikujiCylinder3D = dynamic(
  () => import('@/components/3d/OmikujiCylinder3D').then((mod) => mod.OmikujiCylinder3D),
  {
    ssr: false,
    loading: () => <Omikuji3dLoading />,
  }
)

export interface DailyOmikujiProps {
  onClose?: () => void
  fortunes?: OmikujiFortune[]
}

// 和風 3D 想い出みくじコンポーネント
export function DailyOmikuji({ fortunes: propFortunes }: DailyOmikujiProps = {}) {
  const { t, language } = useLanguage()
  const { fortunes: hookFortunes } = useDailyFortunes()
  const fortunes = propFortunes ?? hookFortunes ?? OMIKUJI_FORTUNES
  const [isShaking, setIsShaking] = useState(false)
  const fortuneIds = useMemo(() => new Set(fortunes.map((fortune) => fortune.id)), [fortunes])
  const todayDateKey = useMemo(() => getOmikujiDateKey(), [])
  const todayKey = useMemo(() => `omikuji_${todayDateKey.replaceAll('-', '_')}`, [todayDateKey])
  const [history, setHistory] = useState<OmikujiHistoryEntry[]>(() => {
    if (typeof window === 'undefined') return []
    const saved = window.localStorage.getItem(OMIKUJI_HISTORY_STORAGE_KEY)
    const parsed = parseOmikujiHistory(saved, fortuneIds)
    if (saved && parsed.length === 0) window.localStorage.removeItem(OMIKUJI_HISTORY_STORAGE_KEY)
    return parsed
  })
  const [migrationError, setMigrationError] = useState(false)
  const [migrationAttempt, setMigrationAttempt] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined' || history.some((entry) => entry.date === todayDateKey)) return

    try {
      const legacy = JSON.parse(window.localStorage.getItem(todayKey) || 'null') as { id?: number; rank?: string } | null
      const legacyFortune =
        fortunes.find((fortune) => fortune.id === legacy?.id) ||
        fortunes.find((fortune) => fortune.rank === legacy?.rank) ||
        OMIKUJI_DATA.find((fortune) => fortune.id === legacy?.id) ||
        OMIKUJI_DATA.find((fortune) => fortune.rank === legacy?.rank)
      if (!legacyFortune) return
      const migrated = appendOmikujiHistory(history, { date: todayDateKey, fortuneId: legacyFortune.id })
      window.localStorage.setItem(OMIKUJI_HISTORY_STORAGE_KEY, JSON.stringify(migrated))
      queueMicrotask(() => {
        setHistory(migrated)
        setMigrationError(false)
      })
    } catch {
      queueMicrotask(() => setMigrationError(true))
    }
  }, [history, todayDateKey, todayKey, migrationAttempt, fortunes])

  const [drawnFortune, setDrawnFortune] = useState<OmikujiFortune | null>(null)

  const result = useMemo<OmikujiFortune | null>(() => {
    if (drawnFortune) return drawnFortune

    const savedFortune = history.find((entry) => entry.date === todayDateKey)
    if (savedFortune) {
      return (
        fortunes.find((fortune) => fortune.id === savedFortune.fortuneId) ||
        OMIKUJI_DATA.find((fortune) => fortune.id === savedFortune.fortuneId) ||
        null
      )
    }

    if (typeof window === 'undefined') return null

    try {
      const legacy = JSON.parse(window.localStorage.getItem(todayKey) || 'null') as { id?: number; rank?: string } | null
      return (
        fortunes.find((fortune) => fortune.id === legacy?.id) ||
        fortunes.find((fortune) => fortune.rank === legacy?.rank) ||
        OMIKUJI_DATA.find((fortune) => fortune.id === legacy?.id) ||
        OMIKUJI_DATA.find((fortune) => fortune.rank === legacy?.rank) ||
        null
      )
    } catch {
      return null
    }
  }, [drawnFortune, history, todayDateKey, fortunes, todayKey])

  const streak = useMemo(() => getOmikujiStreak(history), [history])

  // おみくじを引くアニメーション処理
  const handleDraw = () => {
    if (isShaking || result) return
    setIsShaking(true)

    setTimeout(() => {
      const activeList = fortunes && fortunes.length > 0 ? fortunes : OMIKUJI_DATA
      const picked = activeList[Math.floor(Math.random() * activeList.length)] ?? activeList[0]
      const nextHistory = appendOmikujiHistory(history, { date: todayDateKey, fortuneId: picked.id })
      setDrawnFortune(picked)
      setHistory(nextHistory)
      setIsShaking(false)
      try {
        localStorage.setItem(todayKey, JSON.stringify(picked))
        localStorage.setItem(OMIKUJI_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory))
      } catch {
        setHistory(history)
      }
    }, 2200)
  }

  // 運勢に応じたグラデーション・スタイル
  const getRankBadgeStyle = (rank: string) => {
    switch (rank) {
      case 'daikichi':
        return 'from-[#B8860B] via-[#E5A93C] to-[#D4AF37] text-[#2A1208] border-[#FFF8E7]'
      case 'chukichi':
        return 'from-[#854D27] via-[#A05D30] to-[#854D27] text-[#FFF9F3] border-[#D4B08C]'
      case 'shokichi':
        return 'from-[#3E6B48] via-[#4E825A] to-[#3E6B48] text-[#FFF9F3] border-[#A8D5BA]'
      default:
        return 'from-[#854D27] to-[#6D3D1E] text-[#FFF9F3] border-[#D4B08C]'
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-2 max-w-lg mx-auto text-center">
      {/* 3D おみくじ筒エリア */}
      <div className="w-full bg-[#FFF9F3] border-2 border-[#D4B08C] rounded-2xl p-4 shadow-md mb-4 relative overflow-hidden">
        <div className="text-[11px] font-bold text-[#854D27]/80 flex items-center justify-center gap-1.5 mb-1">
          <Icon name="Sparkles" size={16} />
          <span>
            {t('omikujiCylinderHint')}
          </span>
        </div>

        <OmikujiCylinder3D
          isShaking={isShaking}
          isRevealed={Boolean(result)}
          fortuneNumber={result?.id || 1}
          onDraw={handleDraw}
        />

        {!result && (
          <div className="mt-3">
            <p className="text-xs text-[#854D27]/80 mb-3">{t('omikujiSubtitle')}</p>
            <button
              onClick={handleDraw}
              disabled={isShaking}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#854D27] via-[#A05D30] to-[#854D27] hover:brightness-110 disabled:opacity-50 text-[#FFF9F3] font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Icon name="Sparkles" size={20} />
              <span>{isShaking ? t('omikujiDrawing') : t('omikujiDraw')}</span>
            </button>
          </div>
        )}
      </div>

      {migrationError && (
        <div className="w-full mb-4 rounded-xl border border-[#B42318]/40 bg-[#FFF4F2] px-4 py-3 text-left text-xs text-[#8A1C13]" role="alert">
          <p>{t('omikujiMigrationError')}</p>
          <button
            type="button"
            onClick={() => setMigrationAttempt((attempt) => attempt + 1)}
            className="mt-2 min-h-11 rounded-lg border border-[#8A1C13]/40 px-3 font-bold underline underline-offset-2"
          >
            {t('omikujiMigrationRetry')}
          </button>
        </div>
      )}

      {history.length > 0 && (
        <section className="w-full rounded-xl border border-[#D4B08C]/60 bg-[#FFF9F3] px-4 py-3 mb-4 text-left" aria-label={t('omikujiHistory')}>
          <div className="flex items-center justify-between gap-3 text-xs font-bold text-[#854D27]">
            <span>{t('omikujiHistory')}</span>
            <span>{t('omikujiStreak', { count: streak })}</span>
          </div>
          <ol className="mt-2 grid gap-1 text-xs text-[#854D27]/80" aria-label={t('omikujiHistory')}>
            {history.map((entry) => {
              const fortune =
                fortunes.find((item) => item.id === entry.fortuneId) ||
                OMIKUJI_FORTUNES.find((item) => item.id === entry.fortuneId) ||
                OMIKUJI_DATA.find((item) => item.id === entry.fortuneId)
              if (!fortune) return null
              return (
                <li key={entry.date} className="flex justify-between gap-3">
                  <time dateTime={entry.date}>{entry.date}</time>
                  <span>{language === 'ja' ? fortune.rankNameJa : fortune.rankNameEn}</span>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      {/* 結果発表：和紙巻物風デザイン */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full bg-[#FFFDF9] border-2 border-[#D4B08C] rounded-2xl p-5 shadow-xl relative text-left"
            style={{
              backgroundImage: 'radial-gradient(#D4B08C 0.6px, transparent 0.6px)',
              backgroundSize: '16px 16px',
            }}
          >
            {/* 本日の運勢・ヘッダーバッジ */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#D4B08C]/50">
              <span className="text-xs font-bold text-[#854D27]/80 uppercase tracking-widest flex items-center gap-1.5">
                <Icon name="Calendar" size={14} />
                {t('omikujiTodayFortune')}
              </span>
              <span className="text-xs font-bold text-[#854D27]">
                {t('omikujiNumber', { id: result.id })}
              </span>
            </div>

            {/* 運勢大見出し */}
            <div className="text-center mb-5">
              <div
                className={`inline-block px-8 py-2.5 rounded-2xl bg-gradient-to-r ${getRankBadgeStyle(
                  result.rank
                )} font-black text-2xl tracking-widest border-2 shadow-lg`}
              >
                {language === 'ja' ? result.rankNameJa : result.rankNameEn}
              </div>
            </div>

            {/* 祝詠・和歌 / 俳句 */}
            <div className="bg-[#854D27]/5 border-l-4 border-[#854D27] rounded-r-xl p-3.5 mb-4">
              <span className="text-[10px] font-bold text-[#854D27]/80 uppercase block mb-1">
                📜 {t('omikujiPoemLabel')}
              </span>
              <p className="text-sm font-serif text-[#854D27] italic font-semibold leading-relaxed">
                &ldquo;{language === 'ja' ? result.poemJa : result.poemEn}&rdquo;
              </p>
            </div>

            {/* 総合運勢 */}
            <p className="text-xs font-serif text-[#854D27] leading-relaxed mb-5 px-1 font-bold">
              {language === 'ja' ? result.generalJa : result.generalEn}
            </p>

            {/* 4大運勢カテゴリ（縁・健・志・祝） */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-5">
              {/* 1. 縁（絆・人間関係） */}
              <div className="bg-white/80 border border-[#D4B08C]/60 rounded-xl p-3 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#854D27] mb-1">
                  <Icon name="Heart" size={14} />
                  <span>{t('omikujiBondLabel')}</span>
                </div>
                <p className="text-[11px] text-[#854D27] font-semibold leading-snug">
                  {language === 'ja' ? result.bondJa : result.bondEn}
                </p>
              </div>

              {/* 2. 健（健康・心身） */}
              <div className="bg-white/80 border border-[#D4B08C]/60 rounded-xl p-3 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#854D27] mb-1">
                  <Icon name="Sparkles" size={14} />
                  <span>{t('omikujiHealthLabel')}</span>
                </div>
                <p className="text-[11px] text-[#854D27] font-semibold leading-snug">
                  {language === 'ja' ? result.healthJa : result.healthEn}
                </p>
              </div>

              {/* 3. 志（願い事・目標） */}
              <div className="bg-white/80 border border-[#D4B08C]/60 rounded-xl p-3 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#854D27] mb-1">
                  <Icon name="Star" size={14} />
                  <span>{t('omikujiWishLabel')}</span>
                </div>
                <p className="text-[11px] text-[#854D27] font-semibold leading-snug">
                  {language === 'ja' ? result.wishJa : result.wishEn}
                </p>
              </div>

              {/* 4. 祝（誕生日の祝福） */}
              <div className="bg-white/80 border border-[#D4B08C]/60 rounded-xl p-3 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#854D27] mb-1">
                  <Icon name="Cake" size={14} />
                  <span>{t('omikujiBlessingLabel')}</span>
                </div>
                <p className="text-[11px] text-[#854D27] font-semibold leading-snug">
                  {language === 'ja' ? result.blessingJa : result.blessingEn}
                </p>
              </div>
            </div>

            {/* ラッキー情報バー（色・品・数字） */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-[#854D27]/10 border border-[#D4B08C] rounded-xl text-center items-start">
              <div>
                <span className="text-[10px] font-bold text-[#854D27]/70 uppercase block mb-0.5">
                  {t('omikujiLuckyColor')}
                </span>
                <span className="text-xs font-bold text-[#854D27] leading-snug break-words block">
                  {language === 'ja' ? result.luckyColorJa : result.luckyColorEn}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#854D27]/70 uppercase block mb-0.5">
                  {t('omikujiLuckyItem')}
                </span>
                <span className="text-xs font-bold text-[#854D27] leading-snug break-words block">
                  {language === 'ja' ? result.luckyItemJa : result.luckyItemEn}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#854D27]/70 uppercase block mb-0.5">
                  {t('omikujiLuckyNumber')}
                </span>
                <span className="text-xs font-black text-[#854D27] leading-snug block">
                  {result.luckyNumber}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DailyOmikuji
