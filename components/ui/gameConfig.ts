import { IconName } from './Icon'
import type { TranslationKey } from '@/lib/i18n/types'

// ミニゲームの共通設定アイテム定義
export interface GameMenuItem {
  id: 'memoryGame' | 'puzzleGame' | 'calendar' | 'quiz' | 'omikuji' | 'flashback'
  icon: IconName
  i18nKey: TranslationKey
}

export const GAME_MENU_ITEMS: GameMenuItem[] = [
  { id: 'omikuji', icon: 'Sparkles', i18nKey: 'omikujiTitle' },
  { id: 'flashback', icon: 'Calendar', i18nKey: 'flashbackTitle' },
  { id: 'memoryGame', icon: 'Brain', i18nKey: 'memoryGame' },
  { id: 'puzzleGame', icon: 'Puzzle', i18nKey: 'puzzleGame' },
  { id: 'calendar', icon: 'Calendar', i18nKey: 'birthdayCalendar' },
  { id: 'quiz', icon: 'HelpCircle', i18nKey: 'birthdayQuiz' },
]
