// 誕生日データの型定義
export interface Birthday {
  id: number
  name: string
  month: number
  day: number
  year?: number
  message?: string
  created_at?: string
  updated_at?: string
}

// カスタムメッセージの型定義
export interface CustomMessage {
  id: number
  sender: string
  message: string
  birthday_person?: string
  media_url?: string
  music_track_id?: string
  created_at: string
}

// 音声メッセージの型定義
export interface AudioMessage {
  id: number
  sender: string
  audio_data: string
  birthday_person?: string
  duration?: number
  file_size?: number
  created_at: string
}

// ビデオメッセージの型定義
export interface VideoMessage {
  id: number
  sender: string
  video_name?: string
  video_url: string
  birthday_person?: string
  duration?: number
  file_size?: number
  thumbnail_url?: string
  created_at: string
}

// メディアファイルの型定義
export interface MediaFile {
  id: number
  file_name: string
  file_path: string
  file_type: 'image' | 'video' | 'audio'
  file_size: number
  width?: number
  height?: number
  duration?: number
  thumbnail_url?: string
  tags?: string[]
  description?: string
  uploaded_by?: string
  created_at: string
  updated_at?: string
}

// メディアタグの型定義
export interface MediaTag {
  id: number
  media_path: string
  tags: string[]
  created_at: string
  updated_at: string
}

// メディア統計の型定義
export interface MediaStats {
  totalFiles: number
  totalImages: number
  totalVideos: number
  totalSize: number
  recentUploads: MediaFile[]
}

// バーチャルギフトの型定義
export interface VirtualGift {
  id: number
  sender: string
  gift_emoji: string
  gift_name: string
  birthday_person?: string
  created_at: string
}

// 掲示板投稿の型定義
export interface BulletinPost {
  id: number
  author: string
  content: string
  image_url?: string
  likes: number
  birthday_person?: string
  created_at: string
  replies?: BulletinReply[]
}

// 掲示板返信の型定義
export interface BulletinReply {
  id: number
  post_id: number
  author: string
  content: string
  created_at: string
}

export type ThemeName =
  | 'spring'
  | 'summer'
  | 'autumn'
  | 'winter'
  | 'christmas'
  | 'halloween'
  | 'hanami'
  | 'obon'
  | 'tsukimi'
  | 'tanabata'
  | 'shogatsu'
  | 'kodomo'
  | 'bunka'

export interface Theme {
  name: ThemeName
  displayName: string
  colors: {
    primary: string
    secondary: string
    background: string
    text: string
  }
  videoUrl?: string
  effects?: string[]
}

// 言語の型定義
export type Language = 'en' | 'ja'

// 次の誕生日情報の型定義
export interface NextBirthday {
  person: Birthday
  date: Date
  daysUntil: number
}
