import fs from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
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

const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME
const R2_PUBLIC_DOMAIN = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY

if (!R2_BUCKET || !R2_PUBLIC_DOMAIN || !R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error('❌ Cloudflare R2 の環境変数が不足しています (.env を確認してください)')
  process.exit(1)
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Supabase の環境変数が不足しています (.env を確認してください)')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true })
}

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

async function convertFlacToMp3(flacPath, mp3Path) {
  if (fs.existsSync(mp3Path)) {
    const stat = fs.statSync(mp3Path)
    if (stat.size > 1000) {
      return
    }
  }

  await execFileAsync('ffmpeg', [
    '-y',
    '-i', flacPath,
    '-vn',
    '-c:a', 'libmp3lame',
    '-b:a', '320k',
    '-map_metadata', '0',
    mp3Path,
  ])
}

async function uploadToR2(key, body, contentType) {
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )
}

async function main() {
  console.log('🎵 音楽フォルダのスキャンを開始:', MUSIC_DIR)
  const files = fs.readdirSync(MUSIC_DIR)
  const flacFiles = files.filter((f) => f.endsWith('.flac'))
  console.log(`${flacFiles.length} 件の .flac ファイルを検出しました`)

  const tracksToSync = []

  for (let i = 0; i < flacFiles.length; i++) {
    const flacFile = flacFiles[i]
    const baseName = flacFile.replace(/\.flac$/, '')

    // "Artist - Title" を解析
    let artist = 'Unknown Artist'
    let title = baseName
    if (baseName.includes(' - ')) {
      const parts = baseName.split(' - ')
      artist = parts[0].trim()
      title = parts.slice(1).join(' - ').trim()
    }

    const flacPath = path.join(MUSIC_DIR, flacFile)
    const lrcPath = path.join(MUSIC_DIR, `${baseName}.lrc`)
    const coverPath = path.join(COVERS_DIR, `${baseName}.jpg`)

    const slug = `${i + 1}_${sanitizeSlug(baseName)}`
    const mp3Path = path.join(TEMP_DIR, `${slug}.mp3`)

    tracksToSync.push({
      index: i + 1,
      baseName,
      artist,
      title,
      flacPath,
      lrcPath: fs.existsSync(lrcPath) ? lrcPath : null,
      coverPath: fs.existsSync(coverPath) ? coverPath : null,
      mp3Path,
      slug,
    })
  }

  console.log(`\n⏳ ${tracksToSync.length} 曲の変換・R2/Supabase同期を実行中...`)

  // 4件ずつ並行処理
  const CONCURRENCY = 4
  let completed = 0

  async function processTrack(track) {
    try {
      // 1. FLAC から MP3 (320kbps) への変換
      await convertFlacToMp3(track.flacPath, track.mp3Path)
      const duration = await getAudioDuration(track.mp3Path)
      const mp3Stat = fs.statSync(track.mp3Path)

      // 2. MP3 ファイルを R2 へアップロード
      const mp3Key = `audio/${track.slug}.mp3`
      const mp3Buffer = fs.readFileSync(track.mp3Path)
      await uploadToR2(mp3Key, mp3Buffer, 'audio/mpeg')
      const audioUrl = `${R2_PUBLIC_DOMAIN}/${mp3Key}`

      // 3. カバー画像を R2 へアップロード
      let coverUrl = null
      if (track.coverPath) {
        const coverKey = `covers/${track.slug}.jpg`
        const coverBuffer = fs.readFileSync(track.coverPath)
        await uploadToR2(coverKey, coverBuffer, 'image/jpeg')
        coverUrl = `${R2_PUBLIC_DOMAIN}/${coverKey}`
      }

      // 4. LRC 歌詞ファイルを R2 へアップロード
      let lyricsUrl = null
      let lyricsLrc = null
      if (track.lrcPath) {
        lyricsLrc = fs.readFileSync(track.lrcPath, 'utf-8')
        const lrcKey = `lyrics/${track.slug}.lrc`
        await uploadToR2(lrcKey, Buffer.from(lyricsLrc, 'utf-8'), 'text/plain; charset=utf-8')
        lyricsUrl = `${R2_PUBLIC_DOMAIN}/${lrcKey}`
      }

      // 5. Supabase public.music_tracks へ登録 / 更新
      const trackPayload = {
        name: `${track.artist} - ${track.title}`,
        title: track.title,
        artist: track.artist,
        duration: duration || 0,
        url: audioUrl,
        file_name: `${track.slug}.mp3`,
        file_size: mp3Stat.size,
        cover_url: coverUrl,
        lyrics_url: lyricsUrl,
        lyrics_lrc: lyricsLrc,
        is_preset: true,
      }

      const { data: existing } = await supabase
        .from('music_tracks')
        .select('id')
        .eq('name', trackPayload.name)
        .limit(1)

      if (existing && existing.length > 0) {
        await supabase
          .from('music_tracks')
          .update(trackPayload)
          .eq('id', existing[0].id)
      } else {
        await supabase.from('music_tracks').insert(trackPayload)
      }

      completed++
      if (completed % 10 === 0 || completed === tracksToSync.length) {
        console.log(`✅ [${completed}/${tracksToSync.length}] 処理完了: ${track.artist} - ${track.title}`)
      }
    } catch (err) {
      console.error(`❌ エラー (${track.baseName}):`, err.message)
    }
  }

  for (let i = 0; i < tracksToSync.length; i += CONCURRENCY) {
    const chunk = tracksToSync.slice(i, i + CONCURRENCY)
    await Promise.all(chunk.map((t) => processTrack(t)))
  }

  console.log('\n🎉 全曲の Cloudflare R2 / Supabase 同期が完了しました')
}

main().catch(console.error)
