'use client'

import { useQuery } from '@tanstack/react-query'

export type FestivalPackClient = {
  id: string
  season: string
  month_range: string
  name_ja: string
  name_en: string
  greeting_ja: string
  greeting_en: string
  icon: string
  theme_keys: string[]
  metadata: Record<string, unknown>
}

const STATIC_PACKS: FestivalPackClient[] = [
  { id: 'shogatsu',   season: '冬', month_range: '1/1〜1/7',    name_ja: '正月',      name_en: 'Shogatsu',       greeting_ja: '新年おめでとうございます',     greeting_en: 'Happy New Year',                     icon: '🎍', theme_keys: ['shogatsu'],   metadata: {} },
  { id: 'setsubun',   season: '冬', month_range: '2/3',          name_ja: '節分',      name_en: 'Setsubun',       greeting_ja: '鬼は外、福は内',               greeting_en: 'Drive away evil, welcome luck',      icon: '👹', theme_keys: ['setsubun'],   metadata: {} },
  { id: 'hinamatsuri',season: '春', month_range: '3/3',          name_ja: 'ひな祭り',  name_en: 'Hinamatsuri',    greeting_ja: 'お雛様に願いを込めて',         greeting_en: 'Wishing on Hina Dolls',              icon: '🎎', theme_keys: ['hinamatsuri'],metadata: {} },
  { id: 'hanami',     season: '春', month_range: '3/20〜5/10',   name_ja: '花見',      name_en: 'Hanami',         greeting_ja: '桜の花の下でお祝いを',         greeting_en: 'Celebrate under the cherry blossoms', icon: '🌸', theme_keys: ['hanami'],    metadata: {} },
  { id: 'kodomo',     season: '春', month_range: '5/1〜5/5',     name_ja: 'こどもの日',name_en: "Children's Day", greeting_ja: '子どもの健やかな成長を願って', greeting_en: "Wishing for children's healthy growth", icon: '🎏', theme_keys: ['kodomo'],   metadata: {} },
  { id: 'tanabata',   season: '夏', month_range: '7/1〜7/7',     name_ja: '七夕',      name_en: 'Tanabata',       greeting_ja: '願いが星に届きますように',     greeting_en: 'May your wishes reach the stars',    icon: '🎋', theme_keys: ['tanabata'],  metadata: {} },
  { id: 'obon',       season: '夏', month_range: '8/13〜8/16',   name_ja: 'お盆',      name_en: 'Obon',           greeting_ja: 'ご先祖様への感謝を込めて',     greeting_en: 'With gratitude to our ancestors',    icon: '🏮', theme_keys: ['obon'],      metadata: {} },
  { id: 'tsukimi',    season: '秋', month_range: '9月中旬',      name_ja: '月見',      name_en: 'Tsukimi',        greeting_ja: '美しい月をご覧ください',       greeting_en: 'Enjoy the beautiful moon',           icon: '🌕', theme_keys: ['tsukimi'],   metadata: {} },
  { id: 'halloween',  season: '秋', month_range: '10/28〜10/31', name_ja: 'ハロウィン',name_en: 'Halloween',      greeting_ja: 'Trick or Treat！',             greeting_en: 'Trick or Treat!',                    icon: '🎃', theme_keys: ['halloween'],  metadata: {} },
  { id: 'bunka',      season: '秋', month_range: '11/1〜11/7',   name_ja: '文化の日',  name_en: 'Culture Day',    greeting_ja: '文化と平和を祝いましょう',     greeting_en: 'Celebrate culture and peace',        icon: '🎨', theme_keys: ['bunka'],     metadata: {} },
  { id: 'shichigosan',season: '秋', month_range: '11/15',        name_ja: '七五三',    name_en: 'Shichi-Go-San',  greeting_ja: '健やかな成長をお祝いします',   greeting_en: 'Celebrating healthy growth',         icon: '👘', theme_keys: ['shichigosan'],metadata: {} },
  { id: 'christmas',  season: '冬', month_range: '12/20〜12/25', name_ja: 'クリスマス',name_en: 'Christmas',      greeting_ja: 'メリークリスマス！',           greeting_en: 'Merry Christmas!',                   icon: '🎄', theme_keys: ['christmas'],  metadata: {} },
  { id: 'omisoka',    season: '冬', month_range: '12/31',        name_ja: '大晦日',    name_en: "New Year's Eve", greeting_ja: '良いお年をお迎えください',     greeting_en: 'Wishing you a Happy New Year',       icon: '🔔', theme_keys: ['omisoka'],   metadata: {} },
]

export interface UseFestivalPacksResult {
  packs: FestivalPackClient[]
  isLoading: boolean
  isFallback: boolean
  isError: boolean
}

export function useFestivalPacks(): UseFestivalPacksResult {
  const query = useQuery<FestivalPackClient[], Error>({
    queryKey: ['festival-packs'],
    queryFn: async () => {
      const res = await fetch('/api/festivals')
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`)
      const data = (await res.json()) as FestivalPackClient[]
      if (Array.isArray(data) && data.length > 0) return data
      throw new Error('Empty festival packs')
    },
    staleTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
    retry: false,
  })

  return {
    packs: query.data ?? STATIC_PACKS,
    isLoading: query.isLoading,
    isFallback: query.isError || !query.data,
    isError: query.isError,
  }
}
