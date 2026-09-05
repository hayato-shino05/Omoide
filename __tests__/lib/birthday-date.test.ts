import { describe, expect, it } from 'vitest'
import { formatBirthdayDate, getBusinessDate } from '@/lib/birthday/date'

describe('birthday business date (Asia/Tokyo)', () => {
  it('keeps the business date at the Asia/Tokyo day boundary', () => {
    // 2026-01-01T14:59:59Z は日本では 2026-01-01 23:59 なので、ビジネス日は 01-01
    const before = getBusinessDate(new Date('2026-01-01T14:59:59Z'))
    expect(before.isoDate).toBe('2026-01-01')
    // 2026-01-01T15:00:00Z は日本では 2026-01-02 00:00 なので、ビジネス日は 01-02
    const after = getBusinessDate(new Date('2026-01-01T15:00:00Z'))
    expect(after.isoDate).toBe('2026-01-02')
    expect(after.timeZoneLabel).toBe('Asia/Tokyo')
  })

  it('returns the year, month, day components', () => {
    const date = getBusinessDate(new Date('2026-09-05T00:00:00Z'))
    expect(date).toMatchObject({ year: 2026, month: 9, day: 5 })
    expect(date.isoDate).toBe('2026-09-05')
  })

  it('formats a Japanese display date without timezone drift', () => {
    const formatted = formatBirthdayDate({ year: 2026, month: 9, day: 5 })
    expect(formatted).toContain('9月')
    expect(formatted).toContain('5日')
    expect(formatted).toContain('2026')
  })
})
