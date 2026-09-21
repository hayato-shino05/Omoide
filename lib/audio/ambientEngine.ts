/**
 * Web Audio API に基づくプロシージャル環境音合成エンジン
 * 外部音声ファイルやCDN依存・CORS障害・ループ切れ目を排除し、100%オフラインかつシームレスにリアルタイム生成
 */

import type { AmbientSoundType } from '@/types/study'

// 風鈴の音階（日本の伝統的な陰音階・ペンタトニックスケールに基づく周波数）
const WIND_CHIME_FREQUENCIES = [
  1046.5, // C6
  1174.66, // D6
  1318.51, // E6
  1567.98, // G6
  1760.0, // A6
  2093.0, // C7
  2349.32, // D7
]

class AmbientAudioEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private channelGains: Map<AmbientSoundType, GainNode> = new Map()
  private cleanupFns: Map<AmbientSoundType, () => void> = new Map()

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return null

      this.ctx = new AudioCtx()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime)
      this.masterGain.connect(this.ctx.destination)

      const channels: AmbientSoundType[] = ['rain', 'cafe', 'wind_chime', 'fireplace']
      channels.forEach((type) => {
        if (!this.ctx || !this.masterGain) return
        const gain = this.ctx.createGain()
        gain.gain.setValueAtTime(0, this.ctx.currentTime)
        gain.connect(this.masterGain)
        this.channelGains.set(type, gain)
      })
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }

    return this.ctx
  }

  /**
   * ピンクノイズバッファの生成（5秒ループ）
   */
  private createPinkNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = ctx.sampleRate * 5
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.969 * b2 + white * 0.153852
      b3 = 0.8665 * b3 + white * 0.3104856
      b4 = 0.55 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.016898
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
      b6 = white * 0.115926
    }
    return buffer
  }

  /**
   * ブラウンノイズバッファの生成（低域の温かみと重厚感）
   */
  private createBrownNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = ctx.sampleRate * 5
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    let lastOut = 0.0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      data[i] = (lastOut + 0.02 * white) / 1.02
      lastOut = data[i]
      data[i] *= 3.5 // ゲイン補正
    }
    return buffer
  }

  /**
   * 雨音ジェネレーター
   */
  private startRain(ctx: AudioContext, targetNode: GainNode): () => void {
    const pinkNoise = this.createPinkNoiseBuffer(ctx)
    const source = ctx.createBufferSource()
    source.buffer = pinkNoise
    source.loop = true

    // 雨の滴りと広がりを表現するフィルター構成
    const lowpass = ctx.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.setValueAtTime(1100, ctx.currentTime)

    const highpass = ctx.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.setValueAtTime(180, ctx.currentTime)

    source.connect(highpass)
    highpass.connect(lowpass)
    lowpass.connect(targetNode)

    source.start(0)

    return () => {
      try {
        source.stop()
        source.disconnect()
      } catch {}
    }
  }

  /**
   * 喫茶店の穏やかなざわめきジェネレーター
   */
  private startCafe(ctx: AudioContext, targetNode: GainNode): () => void {
    const pinkNoise = this.createPinkNoiseBuffer(ctx)
    const source = ctx.createBufferSource()
    source.buffer = pinkNoise
    source.loop = true

    // 人の声の帯域に合わせたバンドパスフィルター
    const bandpass = ctx.createBiquadFilter()
    bandpass.type = 'bandpass'
    bandpass.frequency.setValueAtTime(650, ctx.currentTime)
    bandpass.Q.setValueAtTime(0.8, ctx.currentTime)

    // 店内の温かい低周波反響
    const lowHum = ctx.createOscillator()
    lowHum.type = 'sine'
    lowHum.frequency.setValueAtTime(82, ctx.currentTime)
    const lowHumGain = ctx.createGain()
    lowHumGain.gain.setValueAtTime(0.08, ctx.currentTime)

    lowHum.connect(lowHumGain)
    lowHumGain.connect(targetNode)
    lowHum.start(0)

    source.connect(bandpass)
    bandpass.connect(targetNode)
    source.start(0)

    return () => {
      try {
        source.stop()
        source.disconnect()
        lowHum.stop()
        lowHum.disconnect()
      } catch {}
    }
  }

  /**
   * 風鈴ジェネレーター（そよ風のノイズ背景＋ランダムな風鈴ベル）
   */
  private startWindChime(ctx: AudioContext, targetNode: GainNode): () => void {
    // 穏やかなそよ風
    const pinkNoise = this.createPinkNoiseBuffer(ctx)
    const windSource = ctx.createBufferSource()
    windSource.buffer = pinkNoise
    windSource.loop = true

    const windFilter = ctx.createBiquadFilter()
    windFilter.type = 'bandpass'
    windFilter.frequency.setValueAtTime(320, ctx.currentTime)
    windFilter.Q.setValueAtTime(1.2, ctx.currentTime)

    const windGain = ctx.createGain()
    windGain.gain.setValueAtTime(0.15, ctx.currentTime)

    windSource.connect(windFilter)
    windFilter.connect(windGain)
    windGain.connect(targetNode)
    windSource.start(0)

    let timer: NodeJS.Timeout | null = null
    let isRunning = true

    const playBell = () => {
      if (!isRunning || ctx.state === 'closed') return

      const freq = WIND_CHIME_FREQUENCIES[Math.floor(Math.random() * WIND_CHIME_FREQUENCIES.length)]
      const now = ctx.currentTime

      const osc = ctx.createOscillator()
      const bellGain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)

      // 金属的な倍音
      const overtone = ctx.createOscillator()
      const overtoneGain = ctx.createGain()
      overtone.type = 'sine'
      overtone.frequency.setValueAtTime(freq * 2.76, now)

      bellGain.gain.setValueAtTime(0.0001, now)
      bellGain.gain.exponentialRampToValueAtTime(0.35, now + 0.008)
      bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2)

      overtoneGain.gain.setValueAtTime(0.0001, now)
      overtoneGain.gain.exponentialRampToValueAtTime(0.08, now + 0.005)
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9)

      osc.connect(bellGain)
      bellGain.connect(targetNode)

      overtone.connect(overtoneGain)
      overtoneGain.connect(targetNode)

      osc.start(now)
      overtone.start(now)

      osc.stop(now + 2.3)
      overtone.stop(now + 1.0)

      // 次の風鈴をランダムな間隔（1.5秒〜3.8秒）で鳴らす
      const nextDelay = 1500 + Math.random() * 2300
      timer = setTimeout(playBell, nextDelay)
    }

    timer = setTimeout(playBell, 800)

    return () => {
      isRunning = false
      if (timer) clearTimeout(timer)
      try {
        windSource.stop()
        windSource.disconnect()
      } catch {}
    }
  }

  /**
   * 暖炉ジェネレーター（薪のパチパチ音と低域の炎の唸り）
   */
  private startFireplace(ctx: AudioContext, targetNode: GainNode): () => void {
    // 炎の温かい唸り
    const brownNoise = this.createBrownNoiseBuffer(ctx)
    const fireSource = ctx.createBufferSource()
    fireSource.buffer = brownNoise
    fireSource.loop = true

    const fireFilter = ctx.createBiquadFilter()
    fireFilter.type = 'lowpass'
    fireFilter.frequency.setValueAtTime(240, ctx.currentTime)

    fireSource.connect(fireFilter)
    fireFilter.connect(targetNode)
    fireSource.start(0)

    let timer: NodeJS.Timeout | null = null
    let isRunning = true

    // 薪がはぜるクラックル（パチパチ音）
    const playCrackle = () => {
      if (!isRunning || ctx.state === 'closed') return

      const now = ctx.currentTime
      const bufferSize = Math.floor(ctx.sampleRate * 0.035)
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = noiseBuffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.005))
      }

      const noiseSource = ctx.createBufferSource()
      noiseSource.buffer = noiseBuffer

      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(1800 + Math.random() * 1200, now)
      filter.Q.setValueAtTime(2.5, now)

      const crackleGain = ctx.createGain()
      crackleGain.gain.setValueAtTime(0.25 + Math.random() * 0.35, now)

      noiseSource.connect(filter)
      filter.connect(crackleGain)
      crackleGain.connect(targetNode)

      noiseSource.start(now)

      const nextDelay = 80 + Math.random() * 450
      timer = setTimeout(playCrackle, nextDelay)
    }

    timer = setTimeout(playCrackle, 200)

    return () => {
      isRunning = false
      if (timer) clearTimeout(timer)
      try {
        fireSource.stop()
        fireSource.disconnect()
      } catch {}
    }
  }

  /**
   * 各チャンネルおよびマスター音量の同期
   */
  public update(volumes: Record<AmbientSoundType, number>, isPlaying: boolean, masterVolume: number) {
    const ctx = this.initContext()
    if (!ctx || !this.masterGain) return

    const now = ctx.currentTime

    // マスター音量のスムーズな適用
    const effectiveMaster = isPlaying ? Math.max(0, Math.min(1, masterVolume)) : 0
    this.masterGain.gain.cancelScheduledValues(now)
    this.masterGain.gain.linearRampToValueAtTime(effectiveMaster, now + 0.05)

    const channels: AmbientSoundType[] = ['rain', 'cafe', 'wind_chime', 'fireplace']

    channels.forEach((channel) => {
      const targetGain = this.channelGains.get(channel)
      if (!targetGain) return

      const vol = volumes[channel] ?? 0
      const active = isPlaying && vol > 0

      // チャンネル音量の適用
      targetGain.gain.cancelScheduledValues(now)
      targetGain.gain.linearRampToValueAtTime(active ? vol : 0, now + 0.05)

      // ジェネレーターの開始・停止ライフサイクル
      if (active && !this.cleanupFns.has(channel)) {
        let cleanup: (() => void) | null = null
        if (channel === 'rain') cleanup = this.startRain(ctx, targetGain)
        else if (channel === 'cafe') cleanup = this.startCafe(ctx, targetGain)
        else if (channel === 'wind_chime') cleanup = this.startWindChime(ctx, targetGain)
        else if (channel === 'fireplace') cleanup = this.startFireplace(ctx, targetGain)

        if (cleanup) {
          this.cleanupFns.set(channel, cleanup)
        }
      } else if (!active && this.cleanupFns.has(channel)) {
        const cleanup = this.cleanupFns.get(channel)
        cleanup?.()
        this.cleanupFns.delete(channel)
      }
    })
  }

  /**
   * エンジンのリソース破棄
   */
  public destroy() {
    this.cleanupFns.forEach((cleanup) => cleanup())
    this.cleanupFns.clear()
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {})
      this.ctx = null
    }
  }
}

export const ambientEngine = new AmbientAudioEngine()
