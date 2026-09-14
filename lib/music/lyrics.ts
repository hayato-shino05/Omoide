export interface LyricLine {
  time: number // 秒単位のタイムスタンプ
  text: string
  translation?: string
}

export interface TrackLyricsInfo {
  isInstrumental?: boolean
  lines: LyricLine[]
}

// 楽曲別プリセット歌詞データ（Spotify形式のタイムスタンプ同期歌詞）
export const PRESET_LYRICS: Record<string, TrackLyricsInfo> = {
  // お誕生日ソング・共通セレブレーション
  default_birthday: {
    lines: [
      { time: 0.0, text: 'Happy Birthday to you', translation: 'あなたに、心からのお誕生日おめでとう' },
      { time: 4.5, text: 'Happy Birthday to you', translation: '大切な今日という日に祝福を' },
      { time: 9.0, text: 'Happy Birthday, Dear friend', translation: 'かけがえのないあなたへ' },
      { time: 14.2, text: 'Happy Birthday to you', translation: 'たくさんの幸せが訪れますように' },
      { time: 19.5, text: 'May your days be full of laughter', translation: 'あなたの毎日が笑顔で満たされますように' },
      { time: 25.0, text: 'And your dreams come true today', translation: '思い描いたすべての夢が叶いますように' },
      { time: 31.2, text: 'Together we celebrate your journey', translation: '共に歩んだ日々と、これからの未来をお祝いしよう' },
      { time: 38.0, text: 'Happy Birthday to you', translation: 'お誕生日おめでとう' },
    ],
  },
  // 1503376: Music For The Distant Distances
  '1503376': {
    lines: [
      { time: 0.0, text: '遠い記憶の彼方から、静かに響く調べ' },
      { time: 18.5, text: '木漏れ日の揺らめきが、想い出の輪郭を描き出す' },
      { time: 42.0, text: '歩んできた道のりと、交わした言葉たち' },
      { time: 70.5, text: '風が運ぶ懐かしい温もり' },
      { time: 105.0, text: '時を越えて、心は今ここにある' },
      { time: 145.2, text: '遠く離れた場所でも、同じ空を見上げている' },
      { time: 190.0, text: '静寂の中に宿る、変わらない祈り' },
      { time: 240.0, text: 'また巡り逢うその日まで' },
    ],
  },
  // 1531766: Music For Nowhere
  '1531766': {
    lines: [
      { time: 0.0, text: '何処でもない場所で、耳を澄ませる' },
      { time: 22.0, text: '漂う音の波に身をゆだねて' },
      { time: 55.4, text: '過ぎ去った日々の光と影' },
      { time: 92.0, text: '静かに灯る、小さな想い出の灯火' },
      { time: 138.5, text: '夜が深まり、心は穏やかな海へ' },
      { time: 195.0, text: '言葉にならない感情が、メロディとなって溶けていく' },
      { time: 260.0, text: '呼吸を合わせて、未来へ紡ぐ' },
      { time: 330.0, text: 'ここから始まる、新しい物語' },
    ],
  },
  // 1531767: Music For Dreaming of Dreaming Dreams
  '1531767': {
    lines: [
      { time: 0.0, text: '夢のまた夢を、私たちは見ている' },
      { time: 28.0, text: '淡い光の粒が、夜空に舞い上がる' },
      { time: 64.5, text: 'あの日交わした約束のぬくもり' },
      { time: 110.0, text: '時を紡ぎ、想いを重ねて' },
      { time: 165.2, text: 'たとえ季節が巡り去っても' },
      { time: 228.0, text: '胸の奥に灯る光は消えない' },
      { time: 300.0, text: '夢の深淵で響き合う、私たちの旋律' },
      { time: 380.0, text: '永遠に続く、優しい想い出' },
    ],
  },
  // 1531765: Music For Eternally Repeating Rehearsals
  '1531765': {
    lines: [
      { time: 0.0, text: '永遠に繰り返されるリハーサルのように' },
      { time: 24.0, text: '一歩ずつ、丁寧に刻む足跡' },
      { time: 58.0, text: '失敗も迷いも、すべてが美しい調べ' },
      { time: 102.5, text: '今日という日の幕が上がる' },
      { time: 154.0, text: '最高の笑顔で、祝福を届けよう' },
      { time: 215.0, text: '何度でも繰り返す、ありがとうの言葉' },
      { time: 285.0, text: '響き渡るハーモニーとともに' },
    ],
  },
  // 1496915: Music For Calling You
  '1496915': {
    lines: [
      { time: 0.0, text: 'あなたを呼ぶ声が、風に乗って届く' },
      { time: 20.0, text: '遠く離れていても、心は繋がっている' },
      { time: 50.0, text: '生まれてきてくれて、ありがとう' },
      { time: 88.0, text: 'この特別な日に、ありったけの愛を込めて' },
      { time: 135.0, text: 'あなたの笑顔が、世界を明るく照らす' },
      { time: 190.0, text: 'これからもずっと、輝く日々を' },
    ],
  },
}

/**
 * 標準的な LRC 形式の歌詞テキストをパースする
 * 例: [00:12.50]歌詞テキスト
 */
export function parseLrc(lrcText: string): LyricLine[] {
  const lines = lrcText.split('\n')
  const result: LyricLine[] = []
  const timeRegex = /\[(\d{2}):(\d{2}(?:\.\d{1,3})?)\](.*)/

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const match = trimmed.match(timeRegex)
    if (match) {
      const minutes = Number.parseInt(match[1], 10)
      const seconds = Number.parseFloat(match[2])
      const text = match[3].trim()
      if (text) {
        result.push({
          time: minutes * 60 + seconds,
          text,
        })
      }
    }
  }

  return result.sort((a, b) => a.time - b.time)
}

/**
 * 楽曲 ID、楽曲名、または LRC テキストから対応する同期歌詞を取得
 */
export function getTrackLyrics(
  trackId?: string | null,
  trackName?: string | null,
  lyricsLrc?: string | null
): TrackLyricsInfo | null {
  if (lyricsLrc && typeof lyricsLrc === 'string' && lyricsLrc.trim().length > 0) {
    const lines = parseLrc(lyricsLrc)
    if (lines.length > 0) {
      return { lines }
    }
  }

  if (trackId && PRESET_LYRICS[trackId]) {
    return PRESET_LYRICS[trackId]
  }

  if (trackName) {
    const lowerName = trackName.toLowerCase()
    if (lowerName.includes('birthday') || lowerName.includes('お誕生日') || lowerName.includes('バースデー')) {
      return PRESET_LYRICS.default_birthday
    }
    for (const [id, info] of Object.entries(PRESET_LYRICS)) {
      if (id !== 'default_birthday' && (lowerName.includes(id) || trackName.includes(id))) {
        return info
      }
    }
  }

  return null
}

/**
 * 現在の再生時間 (currentTime) に基づいて、アクティブな歌詞行のインデックスを算出
 */
export function getActiveLyricIndex(lyrics: LyricLine[], currentTime: number): number {
  if (!lyrics || lyrics.length === 0) return -1
  let activeIndex = -1

  for (let i = 0; i < lyrics.length; i++) {
    if (currentTime >= lyrics[i].time) {
      activeIndex = i
    } else {
      break
    }
  }

  return activeIndex
}
