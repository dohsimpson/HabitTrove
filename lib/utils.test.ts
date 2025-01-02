import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { cn, getDateInTimezone, getTodayInTimezone } from './utils'

describe('cn utility', () => {
  test('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
    expect(cn('foo', { bar: true })).toBe('foo bar')
    expect(cn('foo', { bar: false })).toBe('foo')
    expect(cn('foo', ['bar', 'baz'])).toBe('foo bar baz')
  })
})

describe('timezone utilities', () => {
  describe('getDateInTimezone', () => {
    test('should convert date to specified timezone', () => {
      const date = new Date('2024-01-01T00:00:00Z')
      
      // Test with specific timezones
      const nyDate = getDateInTimezone(date, 'America/New_York')
      expect(nyDate.toISOString()).toBe('2023-12-31T19:00:00.000Z') // NY is UTC-5

      const tokyoDate = getDateInTimezone(date, 'Asia/Tokyo')
      expect(tokyoDate.toISOString()).toBe('2024-01-01T09:00:00.000Z') // Tokyo is UTC+9
    })

    test('should handle string dates', () => {
      const dateStr = '2024-01-01T00:00:00Z'
      const nyDate = getDateInTimezone(dateStr, 'America/New_York')
      expect(nyDate.toISOString()).toBe('2023-12-31T19:00:00.000Z')
    })
  })

  describe('getTodayInTimezone', () => {
    let originalDate: Date;

    beforeAll(() => {
      originalDate = new Date();
      globalThis.Date.now = () => new Date('2024-01-01T00:00:00Z').getTime();
    })

    afterAll(() => {
      globalThis.Date.now = () => originalDate.getTime();
    })

    test('should return today in YYYY-MM-DD format for timezone', () => {
      expect(getTodayInTimezone('America/New_York')).toBe('2023-12-31')
      expect(getTodayInTimezone('Asia/Tokyo')).toBe('2024-01-01')
    })
  })
})
