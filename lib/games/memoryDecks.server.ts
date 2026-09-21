import { getServiceSupabase, isServerSupabaseConfigured } from '@/lib/supabase/server'

const STATIC_MEMORY_DECKS = [
  {
    id: 'birthday-classic',
    title: '誕生日クラシック',
    theme: 'birthday',
    cards: ['🎂', '🎁', '🎈', '🎉', '🎊', '🎀', '🧁', '🍰'] as string[],
    is_default: true,
  },
  {
    id: 'seasons-japan',
    title: '四季の日本',
    theme: 'seasons',
    cards: ['🌸', '⛄', '🎆', '🍂', '🌺', '❄️', '🎇', '🍁'] as string[],
    is_default: false,
  },
  {
    id: 'animals-cute',
    title: 'かわいい動物',
    theme: 'animals',
    cards: ['🐱', '🐶', '🐰', '🐻', '🐼', '🦊', '🐸', '🐨'] as string[],
    is_default: false,
  },
]

export type MemoryDeckRow = typeof STATIC_MEMORY_DECKS[number]

export async function getMemoryDecks(): Promise<MemoryDeckRow[]> {
  if (!isServerSupabaseConfigured()) {
    return STATIC_MEMORY_DECKS
  }

  const supabase = getServiceSupabase()
  const { data, error } = await supabase
    .from('memory_card_decks')
    .select('*')
    .order('created_at')

  if (error || !data || data.length === 0) {
    console.error('memory_card_decksの取得エラー、フォールバックを使用:', error)
    return STATIC_MEMORY_DECKS
  }

  return (data as Array<{ id: string; title: string; theme: string; cards: string[]; is_default: boolean }>)
}

