import type { AmbientSoundConfig } from '@/types/study'

export const AMBIENT_SOUNDS: AmbientSoundConfig[] = [
  {
    id: 'rain',
    nameKey: 'ambientRain',
    defaultName: 'Rain / 雨音',
    icon: 'CloudRain',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/1254/1254-preview.mp3',
    defaultVolume: 0.5,
  },
  {
    id: 'cafe',
    nameKey: 'ambientCafe',
    defaultName: 'Tokyo Cafe / 喫茶店',
    icon: 'Coffee',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/247/247-preview.mp3',
    defaultVolume: 0.4,
  },
  {
    id: 'wind_chime',
    nameKey: 'ambientWindChime',
    defaultName: 'Wind Chime / 風鈴',
    icon: 'Wind',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/1126/1126-preview.mp3',
    defaultVolume: 0.3,
  },
  {
    id: 'fireplace',
    nameKey: 'ambientFireplace',
    defaultName: 'Fireplace / 暖炉',
    icon: 'Flame',
    audioUrl: 'https://assets.mixkit.co/active_storage/sfx/2477/2477-preview.mp3',
    defaultVolume: 0.4,
  },
]

export const AMBIENT_PRESETS = [
  {
    id: 'tokyo_night_rain',
    name: 'Tokyo Night Rain',
    volumes: { rain: 0.7, cafe: 0.2, wind_chime: 0.3, fireplace: 0.0 },
  },
  {
    id: 'kyoto_tea_house',
    name: 'Kyoto Tea House',
    volumes: { rain: 0.0, cafe: 0.5, wind_chime: 0.6, fireplace: 0.0 },
  },
  {
    id: 'winter_fireplace',
    name: 'Winter Hearth',
    volumes: { rain: 0.2, cafe: 0.0, wind_chime: 0.0, fireplace: 0.8 },
  },
]
