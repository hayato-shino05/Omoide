import type { LegacySearchTrack } from './types'

const streamUrl = (trackId: string): string =>
  `https://mp3l.jamendo.com/?trackid=${trackId}&format=mp31&from=app-devsite`

export function getJamendoStreamUrl(trackId: string): string | null {
  return /^\d{1,12}$/.test(trackId) ? streamUrl(trackId) : null
}

const TRACKS: Array<Omit<LegacySearchTrack, 'audioUrl' | 'licenseUrl' | 'provider' | 'trackId' | 'reference' | 'access'>> = [
  { id: '1503376', name: 'Music For The Distant Distances', artistName: 'Ambient Samurai - Ichiro NAKAGAWA', albumName: 'Distant Distances -- 2017/11/19 Part2', duration: 321, sourceUrl: 'https://www.jamendo.com/track/1503376', albumImage: 'https://usercontent.jamendo.com?type=album&id=173627&width=300&trackid=1503376' },
  { id: '1531766', name: 'Music For Nowhere', artistName: 'Ambient Samurai - Ichiro NAKAGAWA', albumName: 'Dreaming Of Dreaming Dreams 2018-2-18 part 3', duration: 547, sourceUrl: 'https://www.jamendo.com/track/1531766', albumImage: 'https://usercontent.jamendo.com?type=album&id=175756&width=300&trackid=1531766' },
  { id: '1531767', name: 'Music For Dreaming of Dreaming Dreams', artistName: 'Ambient Samurai - Ichiro NAKAGAWA', albumName: 'Dreaming Of Dreaming Dreams 2018-2-18 part 3', duration: 678, sourceUrl: 'https://www.jamendo.com/track/1531767', albumImage: 'https://usercontent.jamendo.com?type=album&id=175756&width=300&trackid=1531767' },
  { id: '1531765', name: 'Music For Eternally Repeating Rehearsals', artistName: 'Ambient Samurai - Ichiro NAKAGAWA', albumName: 'Dreaming Of Dreaming Dreams 2018-2-18 part 3', duration: 657, sourceUrl: 'https://www.jamendo.com/track/1531765', albumImage: 'https://usercontent.jamendo.com?type=album&id=175756&width=300&trackid=1531765' },
  { id: '1496915', name: 'Music For Calling You -- 2017-11-19 part3', artistName: 'Ambient Samurai - Ichiro NAKAGAWA', albumName: 'THEY Are Calling You -- 2017-11-19 Part3', duration: 613, sourceUrl: 'https://www.jamendo.com/track/1496915', albumImage: 'https://usercontent.jamendo.com?type=album&id=172587&width=300&trackid=1496915' },
  { id: '1503377', name: 'Music For Distant Distances 171119-2-inst', artistName: 'Ambient Samurai - Ichiro NAKAGAWA', albumName: 'Music For Distant Distances 171119-2-inst', duration: 941, sourceUrl: 'https://www.jamendo.com/track/1503377', albumImage: 'https://usercontent.jamendo.com?type=album&id=366069&width=300&trackid=1503377' },
  { id: '1552716', name: 'Melting Into One -- Instrumental', artistName: 'Ambient Samurai - Ichiro NAKAGAWA', albumName: 'Live at Always You Are Here #1 2018/5/13 - Urawa Comunale', duration: 370, sourceUrl: 'https://www.jamendo.com/track/1552716', albumImage: 'https://usercontent.jamendo.com?type=album&id=177298&width=300&trackid=1552716' },
  { id: '1552714', name: 'Introduction-Improvisation', artistName: 'Ambient Samurai - Ichiro NAKAGAWA', albumName: 'Live at Always You Are Here #1 2018/5/13 - Urawa Comunale', duration: 300, sourceUrl: 'https://www.jamendo.com/track/1552714', albumImage: 'https://usercontent.jamendo.com?type=album&id=177298&trackid=1552714' },
  { id: '1521948', name: 'Music For Flying Moments 180211-3-4', artistName: 'Ambient Samurai - Ichiro NAKAGAWA', albumName: 'Flying Moments Flying Lights 2018-2-11 part3', duration: 130, sourceUrl: 'https://www.jamendo.com/track/1521948', albumImage: 'https://usercontent.jamendo.com?type=album&id=175112&width=300&trackid=1521948' },
  { id: '1529570', name: '180218-2-inst', artistName: 'Ambient Samurai - Ichiro NAKAGAWA', albumName: 'Oblivion Of Oblivion 2018-2-18 Part2', duration: 1194, sourceUrl: 'https://www.jamendo.com/track/1529570', albumImage: 'https://usercontent.jamendo.com?type=album&id=175433&width=300&trackid=1529570' },
]

export const JAPAN_PRESET_TRACKS: LegacySearchTrack[] = TRACKS.map((track) => ({
  ...track,
  provider: 'jamendo',
  trackId: track.id,
  reference: `jamendo:${track.id}`,
  access: 'playable',
  audioUrl: getJamendoStreamUrl(track.id) as string,
  licenseUrl: 'http://creativecommons.org/licenses/by/3.0/',
}))
