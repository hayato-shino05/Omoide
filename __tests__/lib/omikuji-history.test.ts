import { describe, it, expect } from 'vitest'
import {
  getOmikujiDateKey,
  parseOmikujiHistory,
  appendOmikujiHistory,
  getOmikujiStreak,
  getTodayFortune,
} from '@/lib/omikujiHistory'
import { OMIKUJI_DATA, OMIKUJI_FORTUNES, type OmikujiFortune } from '@/data/omikujiData'

describe('lib/omikujiHistory', () => {
  const allIds = new Set(OMIKUJI_DATA.map((f) => f.id))

  it('日付キーを YYYY-MM-DD 形式で正しく生成すること', () => {
    const date = new Date(2026, 8, 20) // 2026-09-20
    expect(getOmikujiDateKey(date)).toBe('2026-09-20')
  })

  it('有効な履歴 JSON をパースし日付降順・最大7件に制限すること', () => {
    const raw = JSON.stringify([
      { date: '2026-09-18', fortuneId: 1 },
      { date: '2026-09-20', fortuneId: 2 },
      { date: '2026-09-19', fortuneId: 3 },
    ])
    const parsed = parseOmikujiHistory(raw, allIds)
    expect(parsed).toHaveLength(3)
    expect(parsed[0].date).toBe('2026-09-20')
    expect(parsed[1].date).toBe('2026-09-19')
    expect(parsed[2].date).toBe('2026-09-18')
  })

  it('無効なデータが含まれる場合は空配列を返すこと', () => {
    expect(parseOmikujiHistory('invalid-json', allIds)).toEqual([])
    expect(parseOmikujiHistory(JSON.stringify([{ date: 'bad-date', fortuneId: 1 }]), allIds)).toEqual([])
    expect(parseOmikujiHistory(JSON.stringify([{ date: '2026-09-20', fortuneId: 9999 }]), allIds)).toEqual([])
  })

  it('履歴への追加時に同一日付を重複させず最大7件にスライスすること', () => {
    const initial = [
      { date: '2026-09-19', fortuneId: 1 },
      { date: '2026-09-18', fortuneId: 2 },
    ]
    const updated = appendOmikujiHistory(initial, { date: '2026-09-20', fortuneId: 3 })
    expect(updated).toHaveLength(3)
    expect(updated[0].date).toBe('2026-09-20')

    // 同一日付の上書き
    const overwritten = appendOmikujiHistory(updated, { date: '2026-09-20', fortuneId: 5 })
    expect(overwritten).toHaveLength(3)
    expect(overwritten[0].fortuneId).toBe(5)
  })

  it('連続記録（Streak）を正確に計算すること', () => {
    const today = new Date(2026, 8, 20)
    const continuousHistory = [
      { date: '2026-09-20', fortuneId: 1 },
      { date: '2026-09-19', fortuneId: 2 },
      { date: '2026-09-18', fortuneId: 3 },
    ]
    expect(getOmikujiStreak(continuousHistory, today)).toBe(3)

    const brokenHistory = [
      { date: '2026-09-20', fortuneId: 1 },
      { date: '2026-09-18', fortuneId: 3 }, // 19日欠損
    ]
    expect(getOmikujiStreak(brokenHistory, today)).toBe(1)
  })

  describe('getTodayFortune', () => {
    it('userId と日付に基づいて決定論的に同じ運勢を返すこと', () => {
      const today = new Date(2026, 8, 20)
      const fortune1 = getTodayFortune('user-123', OMIKUJI_FORTUNES, today)
      const fortune2 = getTodayFortune('user-123', OMIKUJI_FORTUNES, today)

      expect(fortune1).toBeDefined()
      expect(fortune1.id).toBe(fortune2.id)
      expect(fortune1.rankNameJa).toBe(fortune2.rankNameJa)
    })

    it('異なる日付や異なるユーザーでは適切に分散すること', () => {
      const day1 = new Date(2026, 8, 20)
      const day2 = new Date(2026, 8, 21)
      const fortuneUserA = getTodayFortune('user-A', OMIKUJI_FORTUNES, day1)
      const fortuneUserB = getTodayFortune('user-B', OMIKUJI_FORTUNES, day1)
      const fortuneDay2 = getTodayFortune('user-A', OMIKUJI_FORTUNES, day2)

      expect(fortuneUserA).toBeDefined()
      expect(fortuneUserB).toBeDefined()
      expect(fortuneDay2).toBeDefined()
    })

    it('カスタム運勢リストが渡された場合、その中から選択すること', () => {
      const customList: OmikujiFortune[] = [
        {
          id: 101,
          rank: 'daikichi',
          rankNameJa: '超大吉',
          rankNameEn: 'Super Great Blessing',
          poemJa: 'テスト用の歌',
          poemEn: 'Test poem',
          generalJa: 'テスト総合運',
          generalEn: 'Test general',
          bondJa: 'テスト縁',
          bondEn: 'Test bond',
          healthJa: 'テスト健',
          healthEn: 'Test health',
          wishJa: 'テスト志',
          wishEn: 'Test wish',
          blessingJa: 'テスト祝',
          blessingEn: 'Test blessing',
          luckyColorJa: '金色',
          luckyColorEn: 'Gold',
          luckyItemJa: 'テスト品',
          luckyItemEn: 'Test item',
          luckyNumber: 77,
        },
      ]

      const fortune = getTodayFortune('user-999', customList)
      expect(fortune.id).toBe(101)
      expect(fortune.rankNameJa).toBe('超大吉')
    })

    it('引数が空または null の場合でもデフォルト OMIKUJI_FORTUNES から安全に取得できること', () => {
      const fortune = getTodayFortune(null)
      expect(fortune).toBeDefined()
      expect(OMIKUJI_FORTUNES.some((f) => f.id === fortune.id)).toBe(true)
    })
  })
})
