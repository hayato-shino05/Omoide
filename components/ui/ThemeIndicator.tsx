'use client'

import React from 'react'
import { useThemeContext } from '@/lib/providers/ThemeProvider'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { getThemeDisplayName } from '@/lib/utils/theme'
import type { ThemeName } from '@/types'
import {
  Flower2,
  Flower,
  Sun,
  Leaf,
  Snowflake,
  TreePine,
  Ghost,
  Flame,
  Moon,
  Star,
  Sparkles,
  Flag,
  Palette,
  type LucideIcon,
} from 'lucide-react'

// 13種類のテーマ＆祝祭日用のSVGアイコン定義
const themeIcons: Record<ThemeName, LucideIcon> = {
  spring: Flower2, // 春（開花）
  summer: Sun, // 夏（太陽）
  autumn: Leaf, // 秋（紅葉）
  winter: Snowflake, // 冬（雪の結晶）
  christmas: TreePine, // クリスマス（もみの木）
  halloween: Ghost, // ハロウィン（お化け）
  hanami: Flower, // 花見（桜の花びら）
  obon: Flame, // お盆（迎え火・灯篭）
  tsukimi: Moon, // お月見（満月）
  tanabata: Star, // 七夕（願い星）
  shogatsu: Sparkles, // お正月（新年の輝き）
  kodomo: Flag, // こどもの日（鯉のぼり）
  bunka: Palette, // 文化の日（アートパレット）
}

// 13種類のテーマに対応する鮮やかなアイコンカラー定義
const themeIconColors: Record<ThemeName, string> = {
  spring: '#E91E63', // 春のピンク
  summer: '#FF9800', // 夏のアンバーゴールド
  autumn: '#E2571E', // 秋の紅葉オレンジ
  winter: '#0288D1', // 冬のアイスブルー
  christmas: '#2E7D32', // クリスマスのエメラルドグリーン
  halloween: '#F57C00', // ハロウィンのパンプキンオレンジ
  hanami: '#EC407A', // 桜のピンク
  obon: '#D84315', // お盆の灯火レッド
  tsukimi: '#FBC02D', // 中秋の名月のゴールド
  tanabata: '#8E24AA', // 七夕の天の川パープル
  shogatsu: '#C62828', // お正月の祝い赤
  kodomo: '#0288D1', // 鯉のぼりのオーシャンブルー
  bunka: '#EF6C00', // 文化の日のクリエイティブオレンジ
}

export const ThemeIndicator = React.memo(function ThemeIndicator() {
  const { currentTheme } = useThemeContext()
  const { language, t } = useLanguage()

  const displayName = getThemeDisplayName(currentTheme, language)
  const IconComponent = themeIcons[currentTheme] || Palette
  const iconColor = themeIconColors[currentTheme] || '#FF9800'

  return (
    <div
      className="theme-indicator"
      suppressHydrationWarning
      style={{
        padding: '6px 14px 6px 10px',
        border: '2px solid #D4B08C',
        borderRadius: '22px',
        background: '#854D27',
        color: '#FFF9F3',
        fontFamily: 'var(--font-accent)',
        fontSize: '0.88em',
        fontWeight: 600,
        boxShadow: '0 3px 10px rgba(133, 77, 39, 0.35)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        minHeight: '44px',
      }}
    >
      <span
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '50%',
          width: '26px',
          height: '26px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: iconColor,
          flexShrink: 0,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
        }}
      >
        <IconComponent size={16} strokeWidth={2.8} aria-hidden="true" />
      </span>
      <span style={{ color: '#FBE8D3', fontSize: '0.9em', opacity: 0.95 }}>{t('themeLabel')}</span>
      <span style={{ color: '#FFF9F3', fontWeight: 700 }}>{displayName}</span>
    </div>
  )
})
