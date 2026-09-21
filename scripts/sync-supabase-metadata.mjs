import fs from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createClient } from '@supabase/supabase-js'

const execFileAsync = promisify(execFile)

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

const MUSIC_DIR = process.env.LOCAL_MUSIC_DIR || 'D:\\Music\\shino.hayato05'
const COVERS_DIR = path.join(MUSIC_DIR, 'covers')
const TEMP_DIR = path.resolve('.cache', 'converted_mp3')
const R2_PUBLIC_DOMAIN = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY || !R2_PUBLIC_DOMAIN) {
  console.error('❌ 環境変数が不足しています (.env を確認してください)')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

function sanitizeSlug(str) {
  return Buffer.from(str).toString('hex').slice(0, 32)
}

async function getAudioDuration(filePath) {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath,
    ])
    const sec = parseFloat(stdout.trim())
    return isNaN(sec) ? 0 : Math.round(sec)
  } catch {
    return 0
  }
}

async function main() {
  console.log('🔄 楽曲メタデータを Supabase へ同期中...')
  const files = fs.readdirSync(MUSIC_DIR)
  const flacFiles = files.filter((f) => f.endsWith('.flac'))

  const records = []

  for (let i = 0; i < flacFiles.length; i++) {
    const flacFile = flacFiles[i]
    const baseName = flacFile.replace(/\.flac$/, '')

    let artist = 'Unknown Artist'
    let title = baseName
    if (baseName.includes(' - ')) {
      const parts = baseName.split(' - ')
      artist = parts[0].trim()
      title = parts.slice(1).join(' - ').trim()
    }

    const lrcPath = path.join(MUSIC_DIR, `${baseName}.lrc`)
    const coverPath = path.join(COVERS_DIR, `${baseName}.jpg`)

    const slug = `${i + 1}_${sanitizeSlug(baseName)}`
    const mp3Path = path.join(TEMP_DIR, `${slug}.mp3`)

    let duration = 0
    let fileSize = 0
    if (fs.existsSync(mp3Path)) {
      const stat = fs.statSync(mp3Path)
      fileSize = stat.size
      duration = await getAudioDuration(mp3Path)
    }

    let lyricsLrc = null
    if (fs.existsSync(lrcPath)) {
      lyricsLrc = fs.readFileSync(lrcPath, 'utf-8')
    }

    records.push({
      name: `${artist} - ${title}`,
      title,
      artist,
      duration: duration || 0,
      url: `${R2_PUBLIC_DOMAIN}/audio/${slug}.mp3`,
      file_name: `${slug}.mp3`,
      file_size: fileSize,
      cover_url: fs.existsSync(coverPath) ? `${R2_PUBLIC_DOMAIN}/covers/${slug}.jpg` : null,
      lyrics_url: fs.existsSync(lrcPath) ? `${R2_PUBLIC_DOMAIN}/lyrics/${slug}.lrc` : null,
      lyrics_lrc: lyricsLrc,
      is_preset: true,
    })
  }

  console.log(`${records.length} 件のレコードを Supabase へ登録中...`)

  // 50件ずつバッチ処理
  const BATCH_SIZE = 50
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('music_tracks').upsert(batch, { onConflict: 'name', ignoreDuplicates: false })
    if (error) {
      for (const item of batch) {
        const { data: existing } = await supabase.from('music_tracks').select('id').eq('name', item.name).limit(1)
        if (existing && existing.length > 0) {
          await supabase.from('music_tracks').update(item).eq('id', existing[0].id)
        } else {
          await supabase.from('music_tracks').insert(item)
        }
      }
    }
    console.log(`進捗: ${Math.min(i + BATCH_SIZE, records.length)}/${records.length} 件`)
  }

  const { count } = await supabase.from('music_tracks').select('*', { count: 'exact', head: true })
  console.log(`\n🎉 完了: Supabase 内の総楽曲数: ${count}`)
}

main().catch(console.error)
