import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import {
  cn,
  getTodayInTimezone,
  getNow,
  getNowInMilliseconds,
  t2d,
  d2t,
  d2s,
  d2sDate,
  d2n,
  isSameDate,
  calculateCoinsEarnedToday,
  calculateTotalEarned,
  calculateTotalSpent,
  calculateCoinsSpentToday,
} from './utils'
import { CoinTransaction } from './types'
import { DateTime } from "luxon";

describe('cn utility', () => {
  test('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
    expect(cn('foo', { bar: true })).toBe('foo bar')
    expect(cn('foo', { bar: false })).toBe('foo')
    expect(cn('foo', ['bar', 'baz'])).toBe('foo bar baz')
  })
})

describe('datetime utilities', () => {
  let fixedNow: DateTime;

  beforeAll(() => {
    // Fix the current time to 2024-01-01T00:00:00Z
    fixedNow = DateTime.fromISO('2024-01-01T00:00:00Z');
    DateTime.now = () => fixedNow;
  })

  describe('getTodayInTimezone', () => {
    test('should return today in YYYY-MM-DD format for timezone', () => {
      expect(getTodayInTimezone('America/New_York')).toBe('2023-12-31')
      expect(getTodayInTimezone('Asia/Tokyo')).toBe('2024-01-01')
    })
  })

  describe('getNow', () => {
    test('should return current datetime in specified timezone', () => {
      const nyNow = getNow({ timezone: 'America/New_York' });
      expect(nyNow.zoneName).toBe('America/New_York')
      expect(nyNow.year).toBe(2023)
      expect(nyNow.month).toBe(12)
      expect(nyNow.day).toBe(31)
    })

    test('should default to UTC', () => {
      const utcNow = getNow({});
      expect(utcNow.zoneName).toBe('UTC')
    })
  })

  describe('getNowInMilliseconds', () => {
    test('should return current time in milliseconds', () => {
      expect(getNowInMilliseconds()).toBe('1704067200000')
    })
  })

  describe('timestamp conversion utilities', () => {
    const testTimestamp = '2024-01-01T00:00:00.000Z';
    const testDateTime = DateTime.fromISO(testTimestamp);

    test('t2d should convert ISO timestamp to DateTime', () => {
      const result = t2d({ timestamp: testTimestamp, timezone: 'utc' });
      // Normalize both timestamps to handle different UTC offset formats (Z vs +00:00)
      expect(DateTime.fromISO(result.toISO()!).toMillis())
        .toBe(DateTime.fromISO(testTimestamp).toMillis())
    })

    test('d2t should convert DateTime to ISO timestamp', () => {
      const result = d2t({ dateTime: testDateTime });
      expect(result).toBe(testTimestamp)
    })

    test('d2s should format DateTime for display', () => {
      const result = d2s({ dateTime: testDateTime, timezone: 'utc' });
      expect(result).toBeString()

      const customFormat = d2s({ dateTime: testDateTime, format: 'yyyy-MM-dd', timezone: 'utc' });
      expect(customFormat).toBe('2024-01-01')
    })

    test('d2sDate should format DateTime as date string', () => {
      const result = d2sDate({ dateTime: testDateTime });
      expect(result).toBeString()
    })

    test('d2n should convert DateTime to milliseconds string', () => {
      const result = d2n({ dateTime: testDateTime });
      expect(result).toBe('1704067200000')
    })
  })

  describe('isSameDate', () => {
    test('should compare dates correctly', () => {
      const date1 = DateTime.fromISO('2024-01-01T12:00:00Z');
      const date2 = DateTime.fromISO('2024-01-01T15:00:00Z');
      const date3 = DateTime.fromISO('2024-01-02T12:00:00Z');

      expect(isSameDate(date1, date2)).toBe(true)
      expect(isSameDate(date1, date3)).toBe(false)
    })
  })

  describe('transaction calculations', () => {
    const testTransactions: CoinTransaction[] = [
      {
        id: '1',
        amount: 10,
        type: 'HABIT_COMPLETION',
        description: 'Test habit',
        timestamp: '2024-01-01T12:00:00Z'
      },
      {
        id: '2',
        amount: -5,
        type: 'HABIT_UNDO',
        description: 'Undo test habit',
        timestamp: '2024-01-01T13:00:00Z',
        relatedItemId: '1'
      },
      {
        id: '3',
        amount: 20,
        type: 'HABIT_COMPLETION',
        description: 'Another habit',
        timestamp: '2024-01-01T14:00:00Z'
      },
      {
        id: '4',
        amount: -15,
        type: 'WISH_REDEMPTION',
        description: 'Redeemed wish',
        timestamp: '2024-01-01T15:00:00Z'
      },
      {
        id: '5',
        amount: 5,
        type: 'HABIT_COMPLETION',
        description: 'Yesterday habit',
        timestamp: '2023-12-31T23:00:00Z'
      }
    ]

    test('calculateCoinsEarnedToday should calculate today\'s earnings including undos', () => {
      const result = calculateCoinsEarnedToday(testTransactions, 'UTC')
      expect(result).toBe(25) // 10 + 20 - 5 (including the -5 undo)
    })

    test('calculateTotalEarned should calculate lifetime earnings including undos', () => {
      const result = calculateTotalEarned(testTransactions)
      expect(result).toBe(30) // 10 + 20 + 5 - 5 (including the -5 undo)
    })

    test('calculateTotalSpent should calculate total spent excluding undos', () => {
      const result = calculateTotalSpent(testTransactions)
      expect(result).toBe(15) // Only the 15 wish redemption (excluding the 5 undo)
    })

    test('calculateCoinsSpentToday should calculate today\'s spending excluding undos', () => {
      const result = calculateCoinsSpentToday(testTransactions, 'UTC')
      expect(result).toBe(15) // Only the 15 wish redemption (excluding the 5 undo)
    })

  })
})
