export const MAX_COMMUNITY_MEDIA_SIZE = 50 * 1024 * 1024
export const MAX_MULTIPART_UPLOAD_SIZE = 4 * 1024 * 1024

export type CommunityMediaMime =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/gif'
  | 'video/mp4'
  | 'video/webm'

const COMMUNITY_MEDIA_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
])

// 実内容の種別から拡張子を決める。宣言された MIME やファイル名は信頼しない
export const MEDIA_EXTENSIONS: Record<CommunityMediaMime, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
}

export type CommunityMediaKind = 'image' | 'video'

export function normalizeMediaFile(file: File): File {
  const mimeType = file.type.split(';', 1)[0].trim().toLowerCase()
  if (mimeType === file.type) return file
  return new File([file], file.name, { type: mimeType, lastModified: file.lastModified })
}

export function isCommunityMediaMimeType(mimeType: string): boolean {
  return COMMUNITY_MEDIA_TYPES.has(mimeType)
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff]
const WEBP_SIGNATURE = [0x52, 0x49, 0x46, 0x46] // 'RIFF' + 4 byte size + 'WEBP'
const GIF87_SIGNATURE = [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] // 'GIF87a'
const GIF89_SIGNATURE = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] // 'GIF89a'

// 宣言された MIME を信用せず、先頭バイトで実内容を検証する
function matchesSignature(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false
  return signature.every((value, index) => bytes[offset + index] === value)
}

// バイト列からシーケンスを探す（範囲指定つき）
function indexOfSequence(bytes: Uint8Array, needle: number[], from = 0, to = bytes.length): number {
  const limit = Math.min(to, bytes.length - needle.length + 1)
  outer: for (let index = Math.max(from, 0); index < limit; index++) {
    for (let offset = 0; offset < needle.length; offset++) {
      if (bytes[index + offset] !== needle[offset]) continue outer
    }
    return index
  }
  return -1
}

function isPng(bytes: Uint8Array): boolean {
  // 先頭シグネチャに加え、IHDR チャンクと末尾の IEND チャンクの存在を確認する
  if (!matchesSignature(bytes, PNG_SIGNATURE) || bytes.length < 41) return false
  if (indexOfSequence(bytes, [0x49, 0x48, 0x44, 0x52], 8, 32) === -1) return false // 'IHDR'
  return indexOfSequence(bytes, [0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82], bytes.length - 12) !== -1 // 'IEND' + CRC
}

function isJpeg(bytes: Uint8Array): boolean {
  // SOI（FF D8 FF）と末尾の EOI（FF D9）を確認する
  return bytes.length >= 4 && matchesSignature(bytes, JPEG_SIGNATURE)
    && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9
}

function isWebp(bytes: Uint8Array): boolean {
  // RIFF....WEBP + チャンクサイズ + 先頭の VP8 / VP8L / VP8X を確認する
  if (!matchesSignature(bytes, WEBP_SIGNATURE) || bytes.length < 20) return false
  if (bytes[8] !== 0x57 || bytes[9] !== 0x45 || bytes[10] !== 0x42 || bytes[11] !== 0x50) return false // 'WEBP'
  const riffSize = bytes[4] | (bytes[5] << 8) | (bytes[6] << 16) | (bytes[7] << 24)
  if (bytes.length < riffSize + 8) return false
  return indexOfSequence(bytes, [0x56, 0x50, 0x38], 12, 32) !== -1 // 'VP8' / 'VP8L' / 'VP8X'
}

function isGif(bytes: Uint8Array): boolean {
  // GIF87a / GIF89a のシグネチャと末尾のトレーラー（0x3B）を確認する
  return (matchesSignature(bytes, GIF87_SIGNATURE) || matchesSignature(bytes, GIF89_SIGNATURE))
    && bytes.length >= 14 && bytes[bytes.length - 1] === 0x3b
}

// ISO BMFF のトップレベルボックスを順に走査し、サイズ整合と ftyp / moov / mdat の存在を確認する
function isIsoBmff(bytes: Uint8Array): boolean {
  let offset = 0
  let ftypSeen = false
  let mediaSeen = false
  while (offset + 8 <= bytes.length) {
    const size = (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]
    const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7])
    if (size === 0) {
      // 末尾まで続く最終ボックス（末尾 mdat 等）
      offset = bytes.length
      break
    }
    // 50MB 上限内では 64bit extended size は現れないため不正として扱う
    if (size === 1 || size < 8 || offset + size > bytes.length) return false
    if (type === 'ftyp') ftypSeen = true
    else if (type === 'moov' || type === 'mdat') mediaSeen = true
    offset += size
  }
  return offset === bytes.length && ftypSeen && mediaSeen
}

function isMp4(bytes: Uint8Array): boolean {
  // マーカーだけではなく、トップレベルボックスのサイズ整合も検証する
  return isIsoBmff(bytes)
}

function isWebm(bytes: Uint8Array): boolean {
  // EBML マジック 1A 45 DF A3 に加え、DocType 'webm' が先頭付近にあることを確認する
  if (!matchesSignature(bytes, [0x1a, 0x45, 0xdf, 0xa3])) return false
  return indexOfSequence(bytes, [0x77, 0x65, 0x62, 0x6d], 0, 256) !== -1 // 'webm'
}

// ファイル全体の構造（先頭シグネチャ + 必須チャンク + 末尾マーカー）で実内容を検証する
export function inspectMediaContent(bytes: Uint8Array): CommunityMediaMime | null {
  if (isPng(bytes)) return 'image/png'
  if (isJpeg(bytes)) return 'image/jpeg'
  if (isWebp(bytes)) return 'image/webp'
  if (isGif(bytes)) return 'image/gif'
  if (isMp4(bytes)) return 'video/mp4'
  if (isWebm(bytes)) return 'video/webm'
  return null
}

// jsdom の File は arrayBuffer() を持たないため FileReader で読むフォールバックを用意する
async function readMediaBytes(blob: Blob): Promise<Uint8Array> {
  if (typeof blob.arrayBuffer === 'function') {
    return new Uint8Array(await blob.arrayBuffer())
  }
  const text = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error('media read failed'))
    reader.readAsBinaryString(blob)
  })
  const bytes = new Uint8Array(text.length)
  for (let index = 0; index < text.length; index++) bytes[index] = text.charCodeAt(index) & 0xff
  return bytes
}

// File 全体を読み取って実内容を検証する（先頭 32 バイトだけでは偽装を防げないため）
export async function inspectMediaFile(file: File): Promise<CommunityMediaMime | null> {
  return inspectMediaBlob(file)
}

// Blob 全体を読み取って実内容を検証する（node/jsdom 両対応）
export async function inspectMediaBlob(blob: Blob): Promise<CommunityMediaMime | null> {
  return inspectMediaContent(await readMediaBytes(blob))
}

export function getMediaKind(mimeType: string): CommunityMediaKind | null {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  return null
}

export function validateCommunityMediaFile(file: File): { valid: true } | { valid: false; error: string } {
  if (file.size <= 0 || file.size > MAX_COMMUNITY_MEDIA_SIZE) {
    return { valid: false, error: 'ファイルサイズは50MB以下にしてください' }
  }

  if (!COMMUNITY_MEDIA_TYPES.has(file.type) || !getMediaKind(file.type)) {
    return { valid: false, error: 'サポートされていないファイル形式です' }
  }

  return { valid: true }
}
