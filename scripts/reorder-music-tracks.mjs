import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

// Load .env if present
const envPath = path.resolve('.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const [key, ...rest] = trimmed.split('=')
    const val = rest.join('=').trim()
    if (!process.env[key.trim()]) {
      process.env[key.trim()] = val
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Supabase の環境変数が不足しています (.env を確認してください)')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ユーザー指定の順序リスト
const REQUESTED_ORDER = [
  '(how could i be)honest',
  'favorite song',
  'UNITY',
  'Vaundy - しわあわせ',
  'モスキート',
  '置き手紙',
  'リコンティニュー',
  'FAQ',
  'バースデイ',
  'Bad Girl',
  'Blue Jeans',
  'Cold Night',
  '片っぽ',
  'ROMANTICIZE',
  'BOY',
  'JANE DOE',
  'Missing - Amazon Original',
  'イデアが溢れて眠れない',
  'Not Bad Days',
  'inside you',
  'Last Virgin',
  '世界の秘密',
  'Obsessed',
  'セプテンバーさん',
  'クスノキ', // クスシキ
  'サマーライズ',
  'AMANO-JAKU?',
  'Suki',
  '好きでいて',
  'life hack',
  '火星人',
  'ひかりのうた',
  'Pastoral',
  'Sweet Detour',
  'soup',
  'ふわ輪',
  'midnight',
  'ギューアグ',
  'HOWL',
  '分かってないよ',
  'MONSTER',
  'HAPPY BIRTHDAY',
  '最低界隈',
  'Loa',
  'Ginger',
  'Voices of the Chord',
  '東京フラッシュ',
  '風と町',
  'napori',
  'Honto',
  'Where Do We Go!',
  'セレナーデ',
  'レコード',
  '地球儀',
  'おもかげ',
  'Mine or Yours',
  'ケセラセラ',
  'Never Fear',
  'Ms. Phenomenal',
  'Iron Feather',
  'MAKAFUKA',
  '美しい鯨', // 美しい鰭
  'Love, lala ~Koi no Yukue~',
  'ダンス・ダンス・ダダ'
]

// エイリアス / 表記揺れマッピング
const ALIAS_MAP = {
  'クスノキ': 'クスシキ',
  '美しい鯨': '美しい鰭',
  'AMANO-JAKU?': 'AMANO-JAKU',
  'ひかりのうた': 'ひかりのうた - Hikari no uta',
  '最低界隈': '最低界隈 - Saitei Kaiwai',
  'おもかげ': 'おもかげ (produced by Vaundy)',
}

function normalize(str) {
  return (str || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[~～\-－_()[\]!?？]/g, '')
}

async function main() {
  console.log('🎵 全楽曲データを Supabase から取得中...')
  const { data: allTracks, error } = await supabase
    .from('music_tracks')
    .select('*')
    .order('id', { ascending: true })

  if (error || !allTracks) {
    console.error('❌ 楽曲データの取得に失敗しました:', error)
    process.exit(1)
  }

  console.log(`取得件数: ${allTracks.length} 曲`)

  const matchedTrackIds = new Set()
  const orderedTracks = []

  for (const rawQuery of REQUESTED_ORDER) {
    const query = ALIAS_MAP[rawQuery] || rawQuery
    const normQuery = normalize(query)

    // 1. 完全一致 (タイトル)
    let match = allTracks.find((t) => !matchedTrackIds.has(t.id) && normalize(t.title) === normQuery)
    // 2. 完全一致 (name: "Artist - Title")
    if (!match) {
      match = allTracks.find((t) => !matchedTrackIds.has(t.id) && normalize(t.name) === normQuery)
    }
    // 3. タイトルが query から始まる、または query がタイトルから始まる
    if (!match && normQuery.length >= 3) {
      match = allTracks.find((t) => !matchedTrackIds.has(t.id) && (
        normalize(t.title).startsWith(normQuery) ||
        normQuery.startsWith(normalize(t.title))
      ))
    }
    // 4. タイトルに部分一致
    if (!match && normQuery.length >= 3) {
      match = allTracks.find((t) => !matchedTrackIds.has(t.id) && normalize(t.title).includes(normQuery))
    }

    if (match) {
      matchedTrackIds.add(match.id)
      orderedTracks.push({
        track: match,
        query: rawQuery,
      })
      console.log(`[優先 ${orderedTracks.length}] 一致: "${rawQuery}" -> ${match.artist} - ${match.title} (ID: ${match.id})`)
    } else {
      console.warn(`⚠️ スキップ / 未検出: "${rawQuery}"`)
    }
  }

  // 残りの曲を取得
  const remainingTracks = allTracks.filter((t) => !matchedTrackIds.has(t.id))
  console.log(`\n指定順序の一致: ${orderedTracks.length} 曲 / 残り曲: ${remainingTracks.length} 曲`)

  // 残り曲をランダムシャッフル
  for (let i = remainingTracks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [remainingTracks[i], remainingTracks[j]] = [remainingTracks[j], remainingTracks[i]]
  }

  // sort_order の更新リスト作成
  const updates = []
  let sortOrder = 1

  for (const item of orderedTracks) {
    updates.push({
      id: item.track.id,
      sort_order: sortOrder++,
      name: item.track.name,
    })
  }

  for (const track of remainingTracks) {
    updates.push({
      id: track.id,
      sort_order: sortOrder++,
      name: track.name,
    })
  }

  console.log(`\n🔄 ${updates.length} 曲の sort_order を Supabase に保存中...`)

  // バッチで更新
  const BATCH_SIZE = 25
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE)
    await Promise.all(
      batch.map((u) =>
        supabase
          .from('music_tracks')
          .update({ sort_order: u.sort_order })
          .eq('id', u.id)
      )
    )
    console.log(`進捗: ${Math.min(i + BATCH_SIZE, updates.length)}/${updates.length} 件`)
  }

  console.log('\n🎉 楽曲順序の並び替えが正常に完了しました！')
}

main().catch(console.error)
