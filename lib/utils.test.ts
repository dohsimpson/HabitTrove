import { expect, test, describe, beforeAll, beforeEach, afterAll, spyOn } from "bun:test";
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
  isHabitDueToday,
  isHabitDue
} from './utils'
import { CoinTransaction } from './types'
import { DateTime } from "luxon";
import { RRule } from 'rrule';
import { Habit } from '@/lib/types';

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
  let currentDateIndex = 0;
  const testDates = [
    '2024-01-01T00:00:00Z', // Monday
    '2024-02-14T12:00:00Z', // Valentine's Day
    '2024-07-04T18:00:00Z', // Independence Day
    '2024-12-25T00:00:00Z', // Christmas
    '2024-06-21T12:00:00Z', // Summer Solstice
  ];

  beforeEach(() => {
    // Set fixed date for each test
    const date = DateTime.fromISO(testDates[currentDateIndex]) as DateTime<true>;
    DateTime.now = () => date;
    currentDateIndex = (currentDateIndex + 1) % testDates.length;
  })
})

describe('getTodayInTimezone', () => {
  test('should return today in YYYY-MM-DD format for timezone', () => {
    // Get the current test date in UTC
    const utcNow = DateTime.now().setZone('UTC')

    // Test New York timezone
    const nyDate = utcNow.setZone('America/New_York').toFormat('yyyy-MM-dd')
    expect(getTodayInTimezone('America/New_York')).toBe(nyDate)

    // Test Tokyo timezone
    const tokyoDate = utcNow.setZone('Asia/Tokyo').toFormat('yyyy-MM-dd')
    expect(getTodayInTimezone('Asia/Tokyo')).toBe(tokyoDate)
  })

  test('should handle timezone transitions correctly', () => {
    // Test a date that crosses midnight in different timezones
    const testDate = DateTime.fromISO('2024-01-01T23:30:00Z') as DateTime<true>
    DateTime.now = () => testDate

    // In New York (UTC-5), this is still Jan 1st
    expect(getTodayInTimezone('America/New_York')).toBe('2024-01-01')

    // In Tokyo (UTC+9), this is already Jan 2nd
    expect(getTodayInTimezone('Asia/Tokyo')).toBe('2024-01-02')
  })

  test('should handle daylight saving time transitions', () => {
    // Test a date during DST transition
    const dstDate = DateTime.fromISO('2024-03-10T02:30:00Z') as DateTime<true>
    DateTime.now = () => dstDate

    // In New York (UTC-4 during DST)
    expect(getTodayInTimezone('America/New_York')).toBe('2024-03-09')

    // In London (UTC+0/BST+1)
    expect(getTodayInTimezone('Europe/London')).toBe('2024-03-10')
  })

  test('should handle edge cases around midnight', () => {
    // Test just before and after midnight in different timezones
    const justBeforeMidnight = DateTime.fromISO('2024-01-01T23:59:59Z') as DateTime<true>
    const justAfterMidnight = DateTime.fromISO('2024-01-02T00:00:01Z') as DateTime<true>

    // Test New York timezone (UTC-5)
    DateTime.now = () => justBeforeMidnight
    expect(getTodayInTimezone('America/New_York')).toBe('2024-01-01')

    DateTime.now = () => justAfterMidnight
    expect(getTodayInTimezone('America/New_York')).toBe('2024-01-01')

    // Test Tokyo timezone (UTC+9)
    DateTime.now = () => justBeforeMidnight
    expect(getTodayInTimezone('Asia/Tokyo')).toBe('2024-01-02')

    DateTime.now = () => justAfterMidnight
    expect(getTodayInTimezone('Asia/Tokyo')).toBe('2024-01-02')
  })

  test('should handle all timezones correctly', () => {
    const testZones = [
      'Pacific/Honolulu', // UTC-10
      'America/Los_Angeles', // UTC-8/-7
      'America/New_York', // UTC-5/-4
      'Europe/London', // UTC+0/+1
      'Europe/Paris', // UTC+1/+2
      'Asia/Kolkata', // UTC+5:30
      'Asia/Tokyo', // UTC+9
      'Pacific/Auckland' // UTC+12/+13
    ]

    const testDate = DateTime.fromISO('2024-01-01T12:00:00Z') as DateTime<true>
    DateTime.now = () => testDate

    testZones.forEach(zone => {
      const expected = testDate.setZone(zone).toFormat('yyyy-MM-dd')
      expect(getTodayInTimezone(zone)).toBe(expected)
    })
  })
})

describe('getNow', () => {
  test('should return current datetime in specified timezone', () => {
    const nyNow = getNow({ timezone: 'America/New_York' });
    expect(nyNow.zoneName).toBe('America/New_York')

    // Get the expected values from the fixed test date
    const expected = DateTime.now().setZone('America/New_York')
    expect(nyNow.year).toBe(expected.year)
    expect(nyNow.month).toBe(expected.month)
    expect(nyNow.day).toBe(expected.day)
  })

  test('should default to UTC', () => {
    const utcNow = getNow({});
    expect(utcNow.zoneName).toBe('UTC')
  })
})

describe('getNowInMilliseconds', () => {
  test('should return current time in milliseconds', () => {
    const now = DateTime.now().setZone('UTC')
    expect(getNowInMilliseconds()).toBe(now.toMillis().toString())
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

describe('isHabitDueToday', () => {
  const testHabit = (frequency: string): Habit => ({
    id: 'test-habit',
    name: 'Test Habit',
    description: '',
    frequency,
    coinReward: 10,
    completions: []
  })

  test('should return true for daily habit', () => {
    // Set specific date for this test
    const mockDate = DateTime.fromISO('2024-01-01T12:34:56Z') as DateTime<true>
    DateTime.now = () => mockDate

    const habit = testHabit('FREQ=DAILY')
    expect(isHabitDueToday({ habit, timezone: 'UTC' })).toBe(true)
  })

  test('should return true for weekly habit on correct day', () => {
    const habit = testHabit('FREQ=WEEKLY;BYDAY=MO') // Monday
    const mockDate = DateTime.fromISO('2024-01-01T00:00:00Z') as DateTime<true> // Monday
    DateTime.now = () => mockDate
    expect(isHabitDueToday({ habit, timezone: 'UTC' })).toBe(true)
  })

  test('should return false for weekly habit on wrong day', () => {
    const habit = testHabit('FREQ=WEEKLY;BYDAY=MO') // Monday
    const mockDate = DateTime.fromISO('2024-01-02T00:00:00Z') as DateTime<true> // Tuesday
    DateTime.now = () => mockDate
    expect(isHabitDueToday({ habit, timezone: 'UTC' })).toBe(false)
  })

  test('should handle timezones correctly', () => {
    const habit = testHabit('FREQ=DAILY')

    // Test across multiple timezones with different UTC offsets
    const testCases = [
      {
        time: '2024-01-01T04:00:00Z', // UTC time that's still previous day in New York
        timezone: 'America/New_York',
        expected: true
      },
      {
        time: '2024-01-01T04:00:00Z',
        timezone: 'UTC',
        expected: true
      },
      {
        time: '2024-01-01T23:00:00Z', // Just before midnight in UTC
        timezone: 'Asia/Tokyo', // Already next day in Tokyo
        expected: true
      },
      {
        time: '2024-01-01T01:00:00Z', // Just after midnight in UTC
        timezone: 'Pacific/Honolulu', // Still previous day in Hawaii
        expected: true // Changed from false to true since it's a daily habit
      },
      {
        time: '2024-01-01T12:00:00Z', // Midday UTC
        timezone: 'Australia/Sydney', // Evening in Sydney
        expected: true
      },
      {
        time: '2024-01-01T23:59:59Z', // Just before midnight UTC
        timezone: 'Europe/London', // Same day in London
        expected: true
      },
      {
        time: '2024-01-01T00:00:01Z', // Just after midnight UTC
        timezone: 'Asia/Kolkata', // Same day in India
        expected: true
      }
    ]

    testCases.forEach(({ time, timezone, expected }) => {
      const mockDate = DateTime.fromISO(time) as DateTime<true>
      DateTime.now = () => mockDate
      expect(isHabitDueToday({ habit, timezone })).toBe(expected)
    })
  })

  test('should handle daylight saving time transitions', () => {
    const habit = testHabit('FREQ=DAILY')

    // Test DST transitions in different timezones
    const testCases = [
      {
        time: '2024-03-10T02:30:00Z', // During DST transition in US
        timezone: 'America/New_York',
        expected: true
      },
      {
        time: '2024-10-27T01:30:00Z', // During DST transition in Europe
        timezone: 'Europe/London',
        expected: true
      },
      {
        time: '2024-04-07T02:30:00Z', // During DST transition in Australia
        timezone: 'Australia/Sydney',
        expected: true
      }
    ]

    testCases.forEach(({ time, timezone, expected }) => {
      const mockDate = DateTime.fromISO(time) as DateTime<true>
      DateTime.now = () => mockDate
      expect(isHabitDueToday({ habit, timezone })).toBe(expected)
    })
  })

  test('should handle timezones with half-hour offsets', () => {
    const habit = testHabit('FREQ=DAILY')

    const testCases = [
      {
        time: '2024-01-01T23:30:00Z',
        timezone: 'Asia/Kolkata', // UTC+5:30
        expected: true
      },
      {
        time: '2024-01-01T00:30:00Z',
        timezone: 'Australia/Adelaide', // UTC+9:30/10:30
        expected: true
      },
      {
        time: '2024-01-01T23:59:59Z',
        timezone: 'Asia/Kathmandu', // UTC+5:45
        expected: true
      }
    ]

    testCases.forEach(({ time, timezone, expected }) => {
      const mockDate = DateTime.fromISO(time) as DateTime<true>
      DateTime.now = () => mockDate
      expect(isHabitDueToday({ habit, timezone })).toBe(expected)
    })
  })

  test('should handle timezones that cross the international date line', () => {
    const habit = testHabit('FREQ=DAILY')

    const testCases = [
      {
        time: '2024-01-01T23:00:00Z',
        timezone: 'Pacific/Auckland', // UTC+12/+13
        expected: true
      },
      {
        time: '2024-01-01T01:00:00Z',
        timezone: 'Pacific/Tongatapu', // UTC+13/+14
        expected: true
      },
      {
        time: '2024-01-01T23:59:59Z',
        timezone: 'Pacific/Kiritimati', // UTC+14
        expected: true
      }
    ]

    testCases.forEach(({ time, timezone, expected }) => {
      const mockDate = DateTime.fromISO(time) as DateTime<true>
      DateTime.now = () => mockDate
      expect(isHabitDueToday({ habit, timezone })).toBe(expected)
    })
  })

  test('should handle monthly recurrence', () => {
    const habit = testHabit('FREQ=MONTHLY;BYMONTHDAY=1')
    const mockDate = DateTime.fromISO('2024-01-01T00:00:00Z') as DateTime<true> // 1st of month
    DateTime.now = () => mockDate
    expect(isHabitDueToday({ habit, timezone: 'UTC' })).toBe(true)
  })

  test('should handle yearly recurrence', () => {
    const habit = testHabit('FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1')
    const mockDate = DateTime.fromISO('2024-01-01T00:00:00Z') as DateTime<true> // Jan 1st
    DateTime.now = () => mockDate
    expect(isHabitDueToday({ habit, timezone: 'UTC' })).toBe(true)
  })

  test('should handle complex recurrence rules', () => {
    const habit = testHabit('FREQ=WEEKLY;BYDAY=MO,WE,FR')
    const mockDate = DateTime.fromISO('2024-01-01T00:00:00Z') as DateTime<true> // Monday
    DateTime.now = () => mockDate
    expect(isHabitDueToday({ habit, timezone: 'UTC' })).toBe(true)
  })

  test('should return false for invalid recurrence rule', () => {
    const habit = testHabit('INVALID_RRULE')
    // Mock console.error to prevent test output pollution
    const consoleSpy = spyOn(console, 'error').mockImplementation(() => { })

    // Expect the function to throw an error
    expect(() => isHabitDueToday({ habit, timezone: 'UTC' })).toThrow()

    consoleSpy.mockRestore()
  })
})

describe('isHabitDue', () => {
  const testHabit = (frequency: string): Habit => ({
    id: 'test-habit',
    name: 'Test Habit',
    description: '',
    frequency,
    coinReward: 10,
    completions: []
  })

  test('should return true for daily habit on any date', () => {
    const habit = testHabit('FREQ=DAILY')
    const date = DateTime.fromISO('2024-01-01T12:34:56Z')
    expect(isHabitDue({ habit, timezone: 'UTC', date })).toBe(true)
  })

  test('should return true for weekly habit on correct day', () => {
    const habit = testHabit('FREQ=WEEKLY;BYDAY=MO') // Monday
    const date = DateTime.fromISO('2024-01-01T00:00:00Z') // Monday
    expect(isHabitDue({ habit, timezone: 'UTC', date })).toBe(true)
  })

  test('should return false for weekly habit on wrong day', () => {
    const habit = testHabit('FREQ=WEEKLY;BYDAY=MO') // Monday
    const date = DateTime.fromISO('2024-01-02T00:00:00Z') // Tuesday
    expect(isHabitDue({ habit, timezone: 'UTC', date })).toBe(false)
  })

  test('should handle past dates correctly', () => {
    const habit = testHabit('FREQ=WEEKLY;BYDAY=MO') // Monday
    const pastDate = DateTime.fromISO('2023-12-25T00:00:00Z') // Christmas (Monday)
    expect(isHabitDue({ habit, timezone: 'UTC', date: pastDate })).toBe(true)
  })

  test('should handle future dates correctly', () => {
    const habit = testHabit('FREQ=WEEKLY;BYDAY=MO') // Monday
    const futureDate = DateTime.fromISO('2024-12-30T00:00:00Z') // Monday
    expect(isHabitDue({ habit, timezone: 'UTC', date: futureDate })).toBe(true)
  })

  test('should handle timezone transitions correctly', () => {
    const habit = testHabit('FREQ=DAILY')
    const testCases = [
      {
        date: '2024-01-01T04:00:00Z', // UTC time that's still previous day in New York
        timezone: 'America/New_York',
        expected: true
      },
      {
        date: '2024-01-01T23:00:00Z', // Just before midnight in UTC
        timezone: 'Asia/Tokyo', // Already next day in Tokyo
        expected: true
      },
      {
        date: '2024-01-01T01:00:00Z', // Just after midnight in UTC
        timezone: 'Pacific/Honolulu', // Still previous day in Hawaii
        expected: true
      }
    ]

    testCases.forEach(({ date, timezone, expected }) => {
      const dateObj = DateTime.fromISO(date)
      expect(isHabitDue({ habit, timezone, date: dateObj })).toBe(expected)
    })
  })

  test('should handle daylight saving time transitions', () => {
    const habit = testHabit('FREQ=DAILY')
    const testCases = [
      {
        date: '2024-03-10T02:30:00Z', // During DST transition in US
        timezone: 'America/New_York',
        expected: true
      },
      {
        date: '2024-10-27T01:30:00Z', // During DST transition in Europe
        timezone: 'Europe/London',
        expected: true
      }
    ]

    testCases.forEach(({ date, timezone, expected }) => {
      const dateObj = DateTime.fromISO(date)
      expect(isHabitDue({ habit, timezone, date: dateObj })).toBe(expected)
    })
  })

  test('should handle monthly recurrence', () => {
    const habit = testHabit('FREQ=MONTHLY;BYMONTHDAY=1')
    const date = DateTime.fromISO('2024-01-01T00:00:00Z') // 1st of month
    expect(isHabitDue({ habit, timezone: 'UTC', date })).toBe(true)
  })

  test('should handle yearly recurrence', () => {
    const habit = testHabit('FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1')
    const date = DateTime.fromISO('2024-01-01T00:00:00Z') // Jan 1st
    expect(isHabitDue({ habit, timezone: 'UTC', date })).toBe(true)
  })

  test('should handle complex recurrence rules', () => {
    const habit = testHabit('FREQ=WEEKLY;BYDAY=MO,WE,FR')
    const date = DateTime.fromISO('2024-01-01T00:00:00Z') // Monday
    expect(isHabitDue({ habit, timezone: 'UTC', date })).toBe(true)
  })

  test('should return false for invalid recurrence rule', () => {
    const habit = testHabit('INVALID_RRULE')
    const date = DateTime.fromISO('2024-01-01T00:00:00Z')
    const consoleSpy = spyOn(console, 'error').mockImplementation(() => { })
    expect(() => isHabitDue({ habit, timezone: 'UTC', date })).toThrow()
    consoleSpy.mockRestore()
  })
})
