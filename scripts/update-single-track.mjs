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

const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME
const R2_PUBLIC_DOMAIN = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!R2_BUCKET || !R2_PUBLIC_DOMAIN || !R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ 環境変数が不足しています (.env を確認してください)')
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

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

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
  const newSourcePath = 'D:\\Downloads\\VIDA Hollywood - モスキート.mp3'
  if (!fs.existsSync(newSourcePath)) {
    console.error(`❌ ファイルが存在しません: ${newSourcePath}`)
    process.exit(1)
  }

  console.log(`🎵 新しい音源を処理中: ${newSourcePath}`)

  // 320kbps MP3 に最適化（必要な場合）
  const tempTarget = path.resolve('.cache', 'converted_mp3', '186_5649444120486f6c6c79776f6f64202d.mp3')
  fs.mkdirSync(path.dirname(tempTarget), { recursive: true })

  await execFileAsync('ffmpeg', [
    '-y',
    '-i', newSourcePath,
    '-vn',
    '-c:a', 'libmp3lame',
    '-b:a', '320k',
    '-map_metadata', '0',
    tempTarget,
  ])

  const stat = fs.statSync(tempTarget)
  const duration = await getAudioDuration(tempTarget)
  console.log(`📊 変換完了: サイズ=${stat.size} bytes, 長さ=${duration}s`)

  // Cloudflare R2 へアップロード
  const r2Key = 'audio/186_5649444120486f6c6c79776f6f64202d.mp3'
  console.log(`☁️ Cloudflare R2 (${r2Key}) へアップロード中...`)
  const fileBuffer = fs.readFileSync(tempTarget)
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Key,
      Body: fileBuffer,
      ContentType: 'audio/mpeg',
    })
  )

  // Supabase のレコードを更新
  console.log('🗄️ Supabase レコードを更新中...')
  const { data, error } = await supabase
    .from('music_tracks')
    .update({
      file_size: stat.size,
      duration: duration || 195,
    })
    .eq('id', 124)
    .select()

  if (error) {
    console.error('❌ Supabase 更新エラー:', error)
    process.exit(1)
  }

  console.log('🎉 VIDA Hollywood - モスキート の音源差し替えが完了しました:', data)
}

main().catch(console.error)
