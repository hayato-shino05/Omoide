
export interface PhotoStripConfig {
  id: string
  name: string
  category: 'trending' | 'classic' | 'cute' | 'elegant'
  photoCount: 3 | 4
  bgColor: string
  borderColor: string
  bgImage?: string
  title: string
  titleColor: string
  decorations: Decoration[]
  width: number
  height: number
}

export interface Decoration {
  type: 'image' | 'emoji' | 'text'
  src?: string
  content?: string
  x: number
  y: number
  width?: number
  height?: number
  fontSize?: number
  color?: string
  rotation?: number
}

const FRAMES_PATH = '/images/frames'

export const photoStrips: PhotoStripConfig[] = [
  // === トレンド ===
  {
    id: 'zootopia2',
    name: 'Zootopia 2 🦊🐰',
    category: 'trending',
    photoCount: 4,
    width: 400,
    height: 1200,
    bgColor: '#FFE4EC',
    bgImage: `${FRAMES_PATH}/zootopia2/background.jpg`,
    borderColor: '#FF69B4',
    title: '🦊 TRY EVERYTHING! 🐰',
    titleColor: '#FF1493',
    decorations: [
      { type: 'image', src: `${FRAMES_PATH}/zootopia2/nick.png`, x: 0.02, y: 0.08, width: 80, height: 100 },
      { type: 'image', src: `${FRAMES_PATH}/zootopia2/judy.png`, x: 0.78, y: 0.08, width: 80, height: 100 },
      { type: 'text', content: 'ZOOTOPIA 2', x: 0.5, y: 0.42, fontSize: 18, color: '#2E8B57' },
      { type: 'image', src: `${FRAMES_PATH}/zootopia2/nick.png`, x: 0.02, y: 0.58, width: 70, height: 90 },
      { type: 'image', src: `${FRAMES_PATH}/zootopia2/judy.png`, x: 0.80, y: 0.58, width: 70, height: 90 },
      { type: 'emoji', content: '🎂', x: 0.15, y: 0.95, fontSize: 30 },
      { type: 'emoji', content: '🎂', x: 0.85, y: 0.95, fontSize: 30 },
    ]
  },
  {
    id: 'moana2',
    name: 'Moana 2 🌊🌺',
    category: 'trending',
    photoCount: 4,
    width: 400,
    height: 1200,
    bgColor: '#E0F7FA',
    bgImage: `${FRAMES_PATH}/moana2/background.jpg`,
    borderColor: '#00BCD4',
    title: '🌺 ALOHA BIRTHDAY! 🌺',
    titleColor: '#006064',
    decorations: [
      { type: 'image', src: `${FRAMES_PATH}/moana2/moana.png`, x: 0.02, y: 0.03, width: 90, height: 110 },
      { type: 'image', src: `${FRAMES_PATH}/moana2/maui.png`, x: 0.75, y: 0.03, width: 90, height: 110 },
      { type: 'emoji', content: '🌊', x: 0.08, y: 0.25, fontSize: 30 },
      { type: 'emoji', content: '⛵', x: 0.92, y: 0.25, fontSize: 30 },
      { type: 'text', content: 'MOANA 2', x: 0.5, y: 0.42, fontSize: 20, color: '#00796B' },
      { type: 'image', src: `${FRAMES_PATH}/moana2/heihei.png`, x: 0.02, y: 0.68, width: 60, height: 70 },
      { type: 'image', src: `${FRAMES_PATH}/moana2/pua.png`, x: 0.82, y: 0.68, width: 60, height: 70 },
      { type: 'text', content: '✨ The Ocean Chose You ✨', x: 0.5, y: 0.96, fontSize: 14, color: '#004D40' },
    ]
  },
  {
    id: 'insideout2',
    name: 'Inside Out 2 💜',
    category: 'trending',
    photoCount: 4,
    width: 400,
    height: 1200,
    bgColor: '#F3E5F5',
    bgImage: `${FRAMES_PATH}/insideout2/background.jpg`,
    borderColor: '#9C27B0',
    title: '💜 FEELING HAPPY! 💜',
    titleColor: '#6A1B9A',
    decorations: [
      { type: 'image', src: `${FRAMES_PATH}/insideout2/joy.png`, x: 0.02, y: 0.02, width: 50, height: 60 },
      { type: 'image', src: `${FRAMES_PATH}/insideout2/sadness.png`, x: 0.20, y: 0.01, width: 45, height: 55 },
      { type: 'image', src: `${FRAMES_PATH}/insideout2/anger.png`, x: 0.40, y: 0.02, width: 45, height: 55 },
      { type: 'image', src: `${FRAMES_PATH}/insideout2/fear.png`, x: 0.60, y: 0.01, width: 45, height: 55 },
      { type: 'image', src: `${FRAMES_PATH}/insideout2/disgust.png`, x: 0.78, y: 0.02, width: 45, height: 55 },
      { type: 'text', content: 'INSIDE OUT 2', x: 0.5, y: 0.42, fontSize: 18, color: '#7B1FA2' },
      { type: 'emoji', content: '😰', x: 0.08, y: 0.72, fontSize: 40 },
      { type: 'emoji', content: '💚', x: 0.92, y: 0.72, fontSize: 40 },
      { type: 'text', content: '✨ All Emotions Welcome ✨', x: 0.5, y: 0.96, fontSize: 14, color: '#4A148C' },
    ]
  },
  {
    id: 'wicked',
    name: 'Wicked 💚🩷',
    category: 'trending',
    photoCount: 4,
    width: 400,
    height: 1200,
    bgColor: '#E8F5E9',
    bgImage: `${FRAMES_PATH}/wicked/background.jpg`,
    borderColor: '#4CAF50',
    title: '✨ DEFY GRAVITY ✨',
    titleColor: '#1B5E20',
    decorations: [
      { type: 'image', src: `${FRAMES_PATH}/wicked/elphaba.png`, x: 0.02, y: 0.02, width: 80, height: 100 },
      { type: 'image', src: `${FRAMES_PATH}/wicked/glinda.png`, x: 0.78, y: 0.02, width: 80, height: 100 },
      { type: 'text', content: 'WICKED', x: 0.5, y: 0.42, fontSize: 24, color: '#2E7D32' },
      { type: 'emoji', content: '💚', x: 0.15, y: 0.55, fontSize: 30 },
      { type: 'emoji', content: '🩷', x: 0.85, y: 0.55, fontSize: 30 },
      { type: 'emoji', content: '🌟', x: 0.1, y: 0.75, fontSize: 28 },
      { type: 'emoji', content: '🌟', x: 0.9, y: 0.75, fontSize: 28 },
      { type: 'text', content: '💫 Popular & Defying 💫', x: 0.5, y: 0.96, fontSize: 14, color: '#388E3C' },
    ]
  },
  {
    id: 'frozen',
    name: 'Frozen ❄️👸',
    category: 'trending',
    photoCount: 4,
    width: 400,
    height: 1200,
    bgColor: '#E3F2FD',
    bgImage: `${FRAMES_PATH}/frozen/background.jpg`,
    borderColor: '#2196F3',
    title: '❄️ LET IT GO! ❄️',
    titleColor: '#0D47A1',
    decorations: [
      { type: 'image', src: `${FRAMES_PATH}/frozen/elsa.png`, x: 0.02, y: 0.02, width: 85, height: 105 },
      { type: 'image', src: `${FRAMES_PATH}/frozen/anna.png`, x: 0.75, y: 0.02, width: 85, height: 105 },
      { type: 'image', src: `${FRAMES_PATH}/frozen/olaf.png`, x: 0.02, y: 0.20, width: 60, height: 75 },
      { type: 'image', src: `${FRAMES_PATH}/frozen/sven.png`, x: 0.82, y: 0.20, width: 60, height: 75 },
      { type: 'text', content: 'FROZEN', x: 0.5, y: 0.42, fontSize: 22, color: '#1565C0' },
      { type: 'emoji', content: '💎', x: 0.1, y: 0.55, fontSize: 25 },
      { type: 'emoji', content: '💎', x: 0.9, y: 0.55, fontSize: 25 },
      { type: 'emoji', content: '❄️', x: 0.5, y: 0.75, fontSize: 35 },
      { type: 'text', content: '✨ The Cold Never Bothered Me ✨', x: 0.5, y: 0.96, fontSize: 12, color: '#1976D2' },
    ]
  },

  // === クラシック ===
  {
    id: 'classic-pink',
    name: 'Pink Cute 💕',
    category: 'cute',
    photoCount: 4,
    width: 400,
    height: 1200,
    bgColor: '#FCE4EC',
    bgImage: `${FRAMES_PATH}/backgrounds/pink-hearts.jpg`,
    borderColor: '#E91E63',
    title: '💕 HAPPY BIRTHDAY 💕',
    titleColor: '#AD1457',
    decorations: [
      { type: 'emoji', content: '🎀', x: 0.1, y: 0.05, fontSize: 35 },
      { type: 'emoji', content: '🎀', x: 0.9, y: 0.05, fontSize: 35 },
      { type: 'emoji', content: '💝', x: 0.08, y: 0.35, fontSize: 28 },
      { type: 'emoji', content: '💝', x: 0.92, y: 0.35, fontSize: 28 },
      { type: 'emoji', content: '🧁', x: 0.1, y: 0.55, fontSize: 30 },
      { type: 'emoji', content: '🧁', x: 0.9, y: 0.55, fontSize: 30 },
      { type: 'emoji', content: '🌸', x: 0.08, y: 0.75, fontSize: 28 },
      { type: 'emoji', content: '🌸', x: 0.92, y: 0.75, fontSize: 28 },
      { type: 'text', content: '✨ Happy Birthday ✨', x: 0.5, y: 0.96, fontSize: 16, color: '#C2185B' },
    ]
  },
  {
    id: 'balloon-party',
    name: 'Balloon Party 🎈',
    category: 'classic',
    photoCount: 4,
    width: 400,
    height: 1200,
    bgColor: '#FFF8E1',
    bgImage: `${FRAMES_PATH}/backgrounds/balloons.jpg`,
    borderColor: '#FF9800',
    title: '🎈 PARTY TIME! 🎈',
    titleColor: '#E65100',
    decorations: [
      { type: 'emoji', content: '🎈', x: 0.08, y: 0.08, fontSize: 40, rotation: -15 },
      { type: 'emoji', content: '🎈', x: 0.92, y: 0.1, fontSize: 40, rotation: 15 },
      { type: 'emoji', content: '🎉', x: 0.1, y: 0.35, fontSize: 30 },
      { type: 'emoji', content: '🎊', x: 0.9, y: 0.35, fontSize: 30 },
      { type: 'emoji', content: '🎁', x: 0.08, y: 0.55, fontSize: 32 },
      { type: 'emoji', content: '🎁', x: 0.92, y: 0.55, fontSize: 32 },
      { type: 'emoji', content: '🎂', x: 0.5, y: 0.75, fontSize: 45 },
      { type: 'text', content: '🌟 Happy Birthday 🌟', x: 0.5, y: 0.96, fontSize: 14, color: '#EF6C00' },
    ]
  },
  {
    id: 'unicorn',
    name: 'Unicorn 🦄',
    category: 'cute',
    photoCount: 4,
    width: 400,
    height: 1200,
    bgColor: '#F3E5F5',
    bgImage: `${FRAMES_PATH}/backgrounds/unicorn-rainbow.jpg`,
    borderColor: '#AB47BC',
    title: '🦄 MAGICAL DAY! 🦄',
    titleColor: '#7B1FA2',
    decorations: [
      { type: 'emoji', content: '🦄', x: 0.1, y: 0.05, fontSize: 38 },
      { type: 'emoji', content: '🦄', x: 0.9, y: 0.05, fontSize: 38 },
      { type: 'emoji', content: '🌈', x: 0.5, y: 0.35, fontSize: 35 },
      { type: 'emoji', content: '⭐', x: 0.08, y: 0.55, fontSize: 28 },
      { type: 'emoji', content: '⭐', x: 0.92, y: 0.55, fontSize: 28 },
      { type: 'emoji', content: '✨', x: 0.1, y: 0.75, fontSize: 25 },
      { type: 'emoji', content: '💫', x: 0.5, y: 0.76, fontSize: 28 },
      { type: 'emoji', content: '✨', x: 0.9, y: 0.75, fontSize: 25 },
      { type: 'text', content: '🌟 Magical Birthday 🌟', x: 0.5, y: 0.96, fontSize: 14, color: '#8E24AA' },
    ]
  },
  {
    id: 'gold-elegant',
    name: 'Elegant Gold ✨',
    category: 'elegant',
    photoCount: 4,
    width: 400,
    height: 1200,
    bgColor: '#1a1a2e',
    bgImage: `${FRAMES_PATH}/backgrounds/gold-elegant.jpg`,
    borderColor: '#FFD700',
    title: '✨ HAPPY BIRTHDAY ✨',
    titleColor: '#FFD700',
    decorations: [
      { type: 'emoji', content: '👑', x: 0.5, y: 0.04, fontSize: 40 },
      { type: 'emoji', content: '✨', x: 0.1, y: 0.06, fontSize: 25 },
      { type: 'emoji', content: '✨', x: 0.9, y: 0.06, fontSize: 25 },
      { type: 'emoji', content: '🌟', x: 0.08, y: 0.35, fontSize: 28 },
      { type: 'emoji', content: '🌟', x: 0.92, y: 0.35, fontSize: 28 },
      { type: 'emoji', content: '💫', x: 0.1, y: 0.55, fontSize: 25 },
      { type: 'emoji', content: '💫', x: 0.9, y: 0.55, fontSize: 25 },
      { type: 'emoji', content: '🎂', x: 0.5, y: 0.75, fontSize: 40 },
      { type: 'text', content: '🌟 Happy Birthday 🌟', x: 0.5, y: 0.96, fontSize: 14, color: '#FFD700' },
    ]
  },
  {
    id: 'hello-kitty',
    name: 'Hello Kitty 🎀',
    category: 'cute',
    photoCount: 4,
    width: 400,
    height: 1200,
    bgColor: '#FFEBEE',
    bgImage: `${FRAMES_PATH}/backgrounds/hello-kitty.jpg`,
    borderColor: '#F44336',
    title: '🎀 KAWAII BIRTHDAY 🎀',
    titleColor: '#C62828',
    decorations: [
      { type: 'image', src: `${FRAMES_PATH}/hello-kitty/kitty1.png`, x: 0.02, y: 0.02, width: 70, height: 80 },
      { type: 'emoji', content: '🎀', x: 0.5, y: 0.04, fontSize: 30 },
      { type: 'image', src: `${FRAMES_PATH}/hello-kitty/kitty2.png`, x: 0.80, y: 0.02, width: 70, height: 80 },
      { type: 'emoji', content: '💕', x: 0.08, y: 0.35, fontSize: 28 },
      { type: 'emoji', content: '💕', x: 0.92, y: 0.35, fontSize: 28 },
      { type: 'emoji', content: '🌸', x: 0.1, y: 0.55, fontSize: 28 },
      { type: 'emoji', content: '🌸', x: 0.9, y: 0.55, fontSize: 28 },
      { type: 'emoji', content: '🍰', x: 0.5, y: 0.75, fontSize: 38 },
      { type: 'text', content: '💖 Cute Birthday 💖', x: 0.5, y: 0.96, fontSize: 13, color: '#D32F2F' },
    ]
  },
]

export const frameCategories = [
  { id: 'trending', name: '🔥 Trending', emoji: '🔥' },
  { id: 'classic', name: '🎈 Classic', emoji: '🎈' },
  { id: 'cute', name: '💕 Cute', emoji: '💕' },
  { id: 'elegant', name: '✨ Elegant', emoji: '✨' },
]

export const REQUIRED_IMAGES = {
  zootopia2: {
    folder: 'public/images/frames/zootopia2/',
    files: [
      { name: 'background.jpg', description: 'Pastel pink background with flowers' },
      { name: 'nick.png', description: 'Nick Wilde (fox) - transparent PNG' },
      { name: 'judy.png', description: 'Judy Hopps (rabbit) - transparent PNG' },
    ]
  },
  moana2: {
    folder: 'public/images/frames/moana2/',
    files: [
      { name: 'background.jpg', description: 'Tropical blue ocean background' },
      { name: 'moana.png', description: 'Moana - transparent PNG' },
      { name: 'maui.png', description: 'Maui - transparent PNG' },
      { name: 'heihei.png', description: 'Hei Hei (chicken) - transparent PNG' },
      { name: 'pua.png', description: 'Pua (heo) - transparent PNG' },
    ]
  },
  insideout2: {
    folder: 'public/images/frames/insideout2/',
    files: [
      { name: 'background.jpg', description: 'Pastel purple background with emotions' },
      { name: 'joy.png', description: 'Joy (happy - yellow) - transparent PNG' },
      { name: 'sadness.png', description: 'Sadness (sad - blue) - transparent PNG' },
      { name: 'anger.png', description: 'Anger (angry - red) - transparent PNG' },
      { name: 'fear.png', description: 'Fear (afraid - purple) - transparent PNG' },
      { name: 'disgust.png', description: 'Disgust (green) - transparent PNG' },
    ]
  },
  frozen: {
    folder: 'public/images/frames/frozen/',
    files: [
      { name: 'background.jpg', description: 'Blue icy background' },
      { name: 'elsa.png', description: 'Elsa - transparent PNG' },
      { name: 'anna.png', description: 'Anna - transparent PNG' },
      { name: 'olaf.png', description: 'Olaf (snowman) - transparent PNG' },
      { name: 'sven.png', description: 'Sven (reindeer) - transparent PNG' },
    ]
  },
  wicked: {
    folder: 'public/images/frames/wicked/',
    files: [
      { name: 'background.jpg', description: 'Green background with light' },
      { name: 'elphaba.png', description: 'Elphaba (green witch) - transparent PNG' },
      { name: 'glinda.png', description: 'Glinda (pink witch) - transparent PNG' },
    ]
  },
  backgrounds: {
    folder: 'public/images/frames/backgrounds/',
    files: [
      { name: 'pink-hearts.jpg', description: 'Pink background with hearts' },
      { name: 'balloons.jpg', description: 'Colorful balloon background' },
      { name: 'unicorn-rainbow.jpg', description: 'Rainbow background with unicorn' },
      { name: 'gold-elegant.jpg', description: 'Elegant black and gold background' },
      { name: 'hello-kitty.jpg', description: 'Pink Hello Kitty background' },
    ]
  },
  'hello-kitty': {
    folder: 'public/images/frames/hello-kitty/',
    files: [
      { name: 'kitty1.png', description: 'Hello Kitty pose 1 - transparent PNG' },
      { name: 'kitty2.png', description: 'Hello Kitty pose 2 - transparent PNG' },
    ]
  }
}
