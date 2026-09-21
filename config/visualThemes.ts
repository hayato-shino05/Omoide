import { THEMES } from './themes'

export const VISUAL_THEME_KEYS = [
  'spring',
  'summer',
  'autumn',
  'winter',
  'christmas',
  'halloween',
  'hanami',
  'obon',
  'tsukimi',
  'tanabata',
  'shogatsu',
  'kodomo',
  'bunka',
] as const

export const VISUAL_THEMES = Object.fromEntries(
  VISUAL_THEME_KEYS.map((key) => [key, THEMES[key]]),
) as Pick<typeof THEMES, (typeof VISUAL_THEME_KEYS)[number]>
