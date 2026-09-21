import type { OmikujiFortune } from '@/data/omikujiData'
import { OMIKUJI_DATA } from '@/data/omikujiData'
import { getServiceSupabase, isServerSupabaseConfigured } from '@/lib/supabase/server'

interface DailyFortuneRow {
  id: number
  rank: OmikujiFortune['rank']
  rank_name_ja: string
  rank_name_en: string
  poem_ja: string
  poem_en: string
  general_ja: string
  general_en: string
  bond_ja: string
  bond_en: string
  health_ja: string
  health_en: string
  wish_ja: string
  wish_en: string
  blessing_ja: string
  blessing_en: string
  lucky_color_ja: string
  lucky_color_en: string
  lucky_item_ja: string
  lucky_item_en: string
  lucky_number: number
  sort_order: number
}

function rowToFortune(row: DailyFortuneRow): OmikujiFortune {
  return {
    id: row.id,
    rank: row.rank,
    rankNameJa: row.rank_name_ja,
    rankNameEn: row.rank_name_en,
    poemJa: row.poem_ja,
    poemEn: row.poem_en,
    generalJa: row.general_ja,
    generalEn: row.general_en,
    bondJa: row.bond_ja,
    bondEn: row.bond_en,
    healthJa: row.health_ja,
    healthEn: row.health_en,
    wishJa: row.wish_ja,
    wishEn: row.wish_en,
    blessingJa: row.blessing_ja,
    blessingEn: row.blessing_en,
    luckyColorJa: row.lucky_color_ja,
    luckyColorEn: row.lucky_color_en,
    luckyItemJa: row.lucky_item_ja,
    luckyItemEn: row.lucky_item_en,
    luckyNumber: row.lucky_number,
  }
}

export async function getDailyFortunes(): Promise<OmikujiFortune[]> {
  if (!isServerSupabaseConfigured()) {
    return OMIKUJI_DATA
  }

  const supabase = getServiceSupabase()
  const { data, error } = await supabase
    .from('daily_fortunes')
    .select('*')
    .order('sort_order')

  if (error || !data || data.length === 0) {
    console.error('daily_fortunesの取得エラー、フォールバックを使用:', error)
    return OMIKUJI_DATA
  }

  return (data as DailyFortuneRow[]).map(rowToFortune)
}
