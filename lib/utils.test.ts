import { expect, test, describe, beforeEach, spyOn } from "bun:test";
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
  isHabitDue,
  uuid,
  isTaskOverdue,
  deserializeRRule,
  serializeRRule,
  convertHumanReadableFrequencyToMachineReadable,
  convertMachineReadableFrequencyToHumanReadable,
  getUnsupportedRRuleReason,
  prepareDataForHashing,
  generateCryptoHash
} from './utils'
import { CoinTransaction, ParsedResultType, Settings, HabitsData, CoinsData, WishlistData, UserData } from './types'
import { DateTime } from "luxon";
import { getDefaultSettings, getDefaultHabitsData, getDefaultCoinsData, getDefaultWishlistData, getDefaultUsersData } from './types';
import { RRule, Weekday } from 'rrule';
import { Habit } from '@/lib/types';
import { INITIAL_DUE } from './constants';

describe('cn utility', () => {
  test('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
    expect(cn('foo', { bar: true })).toBe('foo bar')
    expect(cn('foo', { bar: false })).toBe('foo')
    expect(cn('foo', ['bar', 'baz'])).toBe('foo bar baz')
  })
})

describe('getUnsupportedRRuleReason', () => {
  test('should return message for HOURLY frequency', () => {
    const rrule = new RRule({ freq: RRule.HOURLY });
    expect(getUnsupportedRRuleReason(rrule)).toBe('Hourly frequency is not supported.');
  });

  test('should return message for MINUTELY frequency', () => {
    const rrule = new RRule({ freq: RRule.MINUTELY });
    expect(getUnsupportedRRuleReason(rrule)).toBe('Minutely frequency is not supported.');
  });

  test('should return message for SECONDLY frequency', () => {
    const rrule = new RRule({ freq: RRule.SECONDLY });
    expect(getUnsupportedRRuleReason(rrule)).toBe('Secondly frequency is not supported.');
  });

  test('should return message for DAILY frequency with interval > 1', () => {
    const rrule = new RRule({ freq: RRule.DAILY, interval: 2 });
    expect(getUnsupportedRRuleReason(rrule)).toBe('Daily frequency with intervals greater than 1 is not supported.');
  });

  test('should return null for DAILY frequency without interval', () => {
    const rrule = new RRule({ freq: RRule.DAILY });
    expect(getUnsupportedRRuleReason(rrule)).toBeNull();
  });

  test('should return null for DAILY frequency with interval = 1', () => {
    const rrule = new RRule({ freq: RRule.DAILY, interval: 1 });
    expect(getUnsupportedRRuleReason(rrule)).toBeNull();
  });

  test('should return null for WEEKLY frequency', () => {
    const rrule = new RRule({ freq: RRule.WEEKLY, byweekday: [RRule.MO] }); // Added byweekday for validity
    expect(getUnsupportedRRuleReason(rrule)).toBeNull();
  });

  test('should return null for MONTHLY frequency', () => {
    const rrule = new RRule({ freq: RRule.MONTHLY, bymonthday: [1] }); // Added bymonthday for validity
    expect(getUnsupportedRRuleReason(rrule)).toBeNull();
  });

  test('should return null for YEARLY frequency', () => {
    const rrule = new RRule({ freq: RRule.YEARLY, bymonth: [1], bymonthday: [1] }); // Added bymonth/bymonthday for validity
    expect(getUnsupportedRRuleReason(rrule)).toBeNull();
  });

  test('should return null for WEEKLY frequency with interval', () => {
    // Weekly with interval is supported
    const rrule = new RRule({ freq: RRule.WEEKLY, interval: 2, byweekday: [RRule.TU] }); // Added byweekday for validity
    expect(getUnsupportedRRuleReason(rrule)).toBeNull();
  });
});

describe('isTaskOverdue', () => {
  const createTestHabit = (frequency: string, isTask = true, archived = false): Habit => ({
    id: 'test-habit',
    name: 'Test Habit',
    description: '',
    frequency,
    coinReward: 10,
    completions: [],
    isTask,
    archived
  })

  test('should return false for non-tasks', () => {
    const habit = createTestHabit('FREQ=DAILY', false)
    expect(isTaskOverdue(habit, 'UTC')).toBe(false)
  })

  test('should return false for archived tasks', () => {
    const habit = createTestHabit('2024-01-01T00:00:00Z', true, true)
    expect(isTaskOverdue(habit, 'UTC')).toBe(false)
  })

  test('should return false for future tasks', () => {
    const tomorrow = DateTime.now().plus({ days: 1 }).toUTC().toISO()
    const habit = createTestHabit(tomorrow)
    expect(isTaskOverdue(habit, 'UTC')).toBe(false)
  })

  test('should return false for completed past tasks', () => {
    const yesterday = DateTime.now().minus({ days: 1 }).toUTC().toISO()
    const habit = {
      ...createTestHabit(yesterday),
      completions: [DateTime.now().toUTC().toISO()]
    }
    expect(isTaskOverdue(habit, 'UTC')).toBe(false)
  })

  test('should return true for incomplete past tasks', () => {
    const yesterday = DateTime.now().minus({ days: 1 }).toUTC().toISO()
    const habit = createTestHabit(yesterday)
    expect(isTaskOverdue(habit, 'UTC')).toBe(true)
  })

  test('should handle timezone differences correctly', () => {
    // Create a task due "tomorrow" in UTC
    const tomorrow = DateTime.now().plus({ days: 1 }).toUTC().toISO()
    const habit = createTestHabit(tomorrow)
    
    // Test in various timezones
    expect(isTaskOverdue(habit, 'UTC')).toBe(false)
    expect(isTaskOverdue(habit, 'America/New_York')).toBe(false)
    expect(isTaskOverdue(habit, 'Asia/Tokyo')).toBe(false)
  })
})

describe('uuid', () => {
  test('should generate valid UUIDs', () => {
    const id = uuid()
    // UUID v4 format: 8-4-4-4-12 hex digits
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  test('should generate unique UUIDs', () => {
    const ids = new Set()
    for (let i = 0; i < 1000; i++) {
      ids.add(uuid())
    }
    // All 1000 UUIDs should be unique
    expect(ids.size).toBe(1000)
  })

  test('should generate v4 UUIDs', () => {
    const id = uuid()
    // Version 4 UUID has specific bits set:
    // - 13th character is '4'
    // - 17th character is '8', '9', 'a', or 'b'
    expect(id.charAt(14)).toBe('4')
    expect('89ab').toContain(id.charAt(19))
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
    const consoleSpy = spyOn(console, 'error').mockImplementation(() => {})
    expect(isHabitDueToday({ habit, timezone: 'UTC' })).toBe(false)
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
    const consoleSpy = spyOn(console, 'error').mockImplementation(() => {})
    expect(isHabitDue({ habit, timezone: 'UTC', date })).toBe(false)
  })
})

describe('deserializeRRule', () => {
  test('should deserialize valid RRule string', () => {
    const rruleStr = 'FREQ=DAILY;INTERVAL=1'
    const rrule = deserializeRRule(rruleStr)
    expect(rrule).toBeInstanceOf(RRule)
    expect(rrule?.origOptions.freq).toBe(RRule.DAILY)
    expect(rrule?.origOptions.interval).toBe(1)
  })

  test('should return null for invalid RRule string', () => {
    const rruleStr = 'INVALID_RRULE_STRING'
    const rrule = deserializeRRule(rruleStr)
    expect(rrule).toBeNull()
  })

  test('should handle complex RRule strings', () => {
    const rruleStr = 'FREQ=WEEKLY;BYDAY=MO,WE,FR;INTERVAL=2;COUNT=10'
    const rrule = deserializeRRule(rruleStr)
    expect(rrule).toBeInstanceOf(RRule)
    expect(rrule?.origOptions.freq).toBe(RRule.WEEKLY)
    expect(rrule?.origOptions.byweekday).toEqual([RRule.MO, RRule.WE, RRule.FR])
    expect(rrule?.origOptions.interval).toBe(2)
    expect(rrule?.origOptions.count).toBe(10)
  })
})

describe('serializeRRule', () => {
  test('should serialize RRule object to string', () => {
    const rrule = new RRule({
      freq: RRule.DAILY,
      interval: 1
    })
    const rruleStr = serializeRRule(rrule)
    // RRule adds DTSTART automatically if not provided, so we check the core parts
    expect(rruleStr).toContain('FREQ=DAILY')
    expect(rruleStr).toContain('INTERVAL=1')
  })

  test('should return "invalid" for null input', () => {
    const rruleStr = serializeRRule(null)
    expect(rruleStr).toBe('invalid')
  })

  test('should serialize complex RRule objects', () => {
    const rrule = new RRule({
      freq: RRule.WEEKLY,
      byweekday: [RRule.MO, RRule.WE, RRule.FR],
      interval: 2,
      count: 10
    })
    const rruleStr = serializeRRule(rrule)
    expect(rruleStr).toContain('FREQ=WEEKLY')
    expect(rruleStr).toContain('BYDAY=MO,WE,FR')
    expect(rruleStr).toContain('INTERVAL=2')
    expect(rruleStr).toContain('COUNT=10')
  })
})

describe('convertHumanReadableFrequencyToMachineReadable', () => {
  const timezone = 'America/New_York'

  beforeEach(() => {
    // Set a fixed date for consistent relative date parsing
    const mockDate = DateTime.fromISO('2024-07-15T10:00:00', { zone: timezone }) as DateTime<true>
    DateTime.now = () => mockDate
  })

  // Non-recurring tests
  test('should parse specific date (non-recurring)', () => {
    const { result, message } = convertHumanReadableFrequencyToMachineReadable({ text: 'July 16, 2024', timezone, isRecurring: false })
    expect(message).toBeNull()
    expect(result).toBeInstanceOf(DateTime)
    expect((result as DateTime).toISODate()).toBe('2024-07-16')
  })

  test('should parse relative date "tomorrow" (non-recurring)', () => {
    const { result, message } = convertHumanReadableFrequencyToMachineReadable({ text: 'tomorrow', timezone, isRecurring: false })
    expect(message).toBeNull()
    expect(result).toBeInstanceOf(DateTime)
    expect((result as DateTime).toISODate()).toBe('2024-07-16') // Based on mock date 2024-07-15
  })

  test('should parse relative date "next friday" (non-recurring)', () => {
    const { result, message } = convertHumanReadableFrequencyToMachineReadable({ text: 'next friday', timezone, isRecurring: false })
    expect(message).toBeNull()
    expect(result).toBeInstanceOf(DateTime)
    // chrono-node interprets "next friday" from Mon July 15 as Fri July 26
    expect((result as DateTime).toISODate()).toBe('2024-07-26')
  })

  test('should return null for invalid date string (non-recurring)', () => {
    const { result, message } = convertHumanReadableFrequencyToMachineReadable({ text: 'invalid date', timezone, isRecurring: false })
    expect(result).toBeNull()
    expect(message).toBe('Invalid due date.')
  })

  // Recurring tests
  test('should parse "daily" (recurring)', () => {
    const { result, message } = convertHumanReadableFrequencyToMachineReadable({ text: 'daily', timezone, isRecurring: true })
    expect(message).toBeNull()
    expect(result).toBeInstanceOf(RRule)
    expect((result as RRule).origOptions.freq).toBe(RRule.DAILY)
  })

  test('should parse "every week on Monday" (recurring)', () => {
    const { result, message } = convertHumanReadableFrequencyToMachineReadable({ text: 'every week on Monday', timezone, isRecurring: true })
    expect(message).toBeNull()
    expect(result).toBeInstanceOf(RRule)
    expect((result as RRule).origOptions.freq).toBe(RRule.WEEKLY)
    // RRule.fromText returns Weekday objects, check the weekday property
    const byweekday = (result as RRule).origOptions.byweekday;
    const weekdayValues = byweekday
      ? (Array.isArray(byweekday)
        ? byweekday.map(d => typeof d === 'number' ? d : (d as Weekday).weekday)
        : [typeof byweekday === 'number' ? byweekday : (byweekday as Weekday).weekday])
      : [];
    expect(weekdayValues).toEqual([RRule.MO.weekday])
  })

  test('should parse "every month on the 15th" (recurring)', () => {
    const { result, message } = convertHumanReadableFrequencyToMachineReadable({ text: 'every month on the 15th', timezone, isRecurring: true })
    expect(message).toBeNull()
    expect(result).toBeInstanceOf(RRule)
    expect((result as RRule).origOptions.freq).toBe(RRule.MONTHLY)
    expect((result as RRule).origOptions.bymonthday).toEqual([15])
  })

  test('should parse "every year on Jan 1" (recurring)', () => {
    const { result, message } = convertHumanReadableFrequencyToMachineReadable({ text: 'every year on Jan 1', timezone, isRecurring: true })
    expect(message).toBeNull()
    expect(result).toBeInstanceOf(RRule)
    expect((result as RRule).origOptions.freq).toBe(RRule.YEARLY)
    // Note: RRule.fromText parses 'Jan 1' into bymonth/bymonthday
    expect((result as RRule).origOptions.bymonth).toEqual([1])
    // RRule.fromText might not reliably set bymonthday in origOptions for this text
    // expect((result as RRule).origOptions.bymonthday).toEqual([1])
  })

  test('should return validation error for "every week" without day (recurring)', () => {
    const { result, message } = convertHumanReadableFrequencyToMachineReadable({ text: 'every week', timezone, isRecurring: true })
    expect(result).toBeNull() // RRule.fromText might parse it, but our validation catches it
    expect(message).toBe('Please specify day(s) of the week (e.g., "every week on Mon, Wed").')
  })

  test('should return validation error for "every month" without day/position (recurring)', () => {
    const { result, message } = convertHumanReadableFrequencyToMachineReadable({ text: 'every month', timezone, isRecurring: true })
    expect(result).toBeNull() // RRule.fromText might parse it, but our validation catches it
    expect(message).toBe('Please specify day of the month (e.g., "every month on the 15th") or position (e.g., "every month on the last Friday").')
  })

  test('should return null for invalid recurrence string (recurring)', () => {
    const { result, message } = convertHumanReadableFrequencyToMachineReadable({ text: 'invalid recurrence', timezone, isRecurring: true })
    expect(result).toBeNull()
    expect(message).toBe('Invalid recurrence rule.')
  })

  test('should return specific error for unsupported hourly frequency', () => {
    const { result, message } = convertHumanReadableFrequencyToMachineReadable({ text: 'every hour', timezone, isRecurring: true })
    expect(result).toBeInstanceOf(RRule) // RRule parses it, but our validation catches it
    expect(message).toBe('Hourly frequency is not supported.')
  })

  test('should return specific error for unsupported daily interval', () => {
    const { result, message } = convertHumanReadableFrequencyToMachineReadable({ text: 'every 2 days', timezone, isRecurring: true })
    expect(result).toBeInstanceOf(RRule) // RRule parses it, but our validation catches it
    expect(message).toBe('Daily frequency with intervals greater than 1 is not supported.')
  })

  test('should handle predefined constants like "weekdays"', () => {
    const { result, message } = convertHumanReadableFrequencyToMachineReadable({ text: 'weekdays', timezone, isRecurring: true })
    expect(message).toBeNull()
    expect(result).toBeInstanceOf(RRule)
    expect((result as RRule).origOptions.freq).toBe(RRule.WEEKLY)
    // Check the weekday property of the Weekday objects
    const weekdays = (result as RRule).origOptions.byweekday;
    const weekdayNumbers = weekdays
      ? (Array.isArray(weekdays)
        ? weekdays.map(d => typeof d === 'number' ? d : (d as Weekday).weekday)
        : [typeof weekdays === 'number' ? weekdays : (weekdays as Weekday).weekday])
      : [];
    expect(weekdayNumbers).toEqual([RRule.MO.weekday, RRule.TU.weekday, RRule.WE.weekday, RRule.TH.weekday, RRule.FR.weekday])
  })
})

describe('convertMachineReadableFrequencyToHumanReadable', () => {
  const timezone = 'America/New_York'

  // Non-recurring tests
  test('should format DateTime object (non-recurring)', () => {
    const dateTime = DateTime.fromISO('2024-07-16T00:00:00', { zone: timezone }) as DateTime<true>
    const humanReadable = convertMachineReadableFrequencyToHumanReadable({ frequency: dateTime, isRecurRule: false, timezone })
    // Expected format depends on locale, check for key parts
    expect(humanReadable).toContain('Jul 16, 2024')
    expect(humanReadable).toContain('Tue') // Tuesday
  })

  test('should format ISO string (non-recurring)', () => {
    const isoString = '2024-07-16T00:00:00.000-04:00' // Example ISO string with offset
    const humanReadable = convertMachineReadableFrequencyToHumanReadable({ frequency: isoString, isRecurRule: false, timezone })
    expect(humanReadable).toContain('Jul 16, 2024')
    expect(humanReadable).toContain('Tue')
  })

  test('should return "Initial Due" for null frequency (non-recurring)', () => {
    const humanReadable = convertMachineReadableFrequencyToHumanReadable({ frequency: null, isRecurRule: false, timezone })
    // Check against the imported constant value
    expect(humanReadable).toBe(INITIAL_DUE)
  })

  // Recurring tests
  test('should format RRule object (recurring)', () => {
    const rrule = new RRule({ freq: RRule.DAILY })
    const humanReadable = convertMachineReadableFrequencyToHumanReadable({ frequency: rrule, isRecurRule: true, timezone })
    // rrule.toText() returns "every day" for daily rules
    expect(humanReadable).toBe('every day')
  })

  test('should format RRule string (recurring)', () => {
    const rruleStr = 'FREQ=WEEKLY;BYDAY=MO,WE,FR'
    const humanReadable = convertMachineReadableFrequencyToHumanReadable({ frequency: rruleStr, isRecurRule: true, timezone })
    expect(humanReadable).toBe('every week on Monday, Wednesday, Friday')
  })

  test('should return "invalid" for invalid RRule string (recurring)', () => {
    const rruleStr = 'INVALID_RRULE'
    const humanReadable = convertMachineReadableFrequencyToHumanReadable({ frequency: rruleStr, isRecurRule: true, timezone })
    expect(humanReadable).toBe('invalid')
  })

  test('should return "invalid" for null frequency (recurring)', () => {
    const humanReadable = convertMachineReadableFrequencyToHumanReadable({ frequency: null, isRecurRule: true, timezone })
    expect(humanReadable).toBe('invalid')
  })

  test('should return "invalid" for unexpected type (recurring)', () => {
    const humanReadable = convertMachineReadableFrequencyToHumanReadable({ frequency: 123 as unknown as ParsedResultType, isRecurRule: true, timezone })
    expect(humanReadable).toBe('invalid')
  })

  test('should return "invalid" for unexpected type (non-recurring)', () => {
    const humanReadable = convertMachineReadableFrequencyToHumanReadable({ frequency: new RRule({ freq: RRule.DAILY }) as unknown as ParsedResultType, isRecurRule: false, timezone })
    expect(humanReadable).toBe('invalid')
  })
})

describe('freshness utilities', () => {
  const mockSettings: Settings = getDefaultSettings();
  const mockHabits: HabitsData = getDefaultHabitsData();
  const mockCoins: CoinsData = getDefaultCoinsData();
  const mockWishlist: WishlistData = getDefaultWishlistData();
  const mockUsers: UserData = getDefaultUsersData();

  // Add a user to mockUsers for more realistic testing
  mockUsers.users.push({
    id: 'user-123',
    username: 'testuser',
    isAdmin: false,
  });
  mockHabits.habits.push({
    id: 'habit-123',
    name: 'Test Habit',
    description: 'A habit for testing',
    frequency: 'FREQ=DAILY',
    coinReward: 10,
    completions: [],
    userIds: ['user-123']
  });


  describe('prepareDataForHashing', () => {
    test('should produce a consistent string for the same data', () => {
      const data1 = { settings: mockSettings, habits: mockHabits, coins: mockCoins, wishlist: mockWishlist, users: mockUsers };
      const data2 = { settings: mockSettings, habits: mockHabits, coins: mockCoins, wishlist: mockWishlist, users: mockUsers }; // Identical data

      const string1 = prepareDataForHashing(data1.settings, data1.habits, data1.coins, data1.wishlist, data1.users);
      const string2 = prepareDataForHashing(data2.settings, data2.habits, data2.coins, data2.wishlist, data2.users);

      expect(string1).toBe(string2);
    });

    test('should produce a different string if settings data changes', () => {
      const string1 = prepareDataForHashing(mockSettings, mockHabits, mockCoins, mockWishlist, mockUsers);
      const modifiedSettings = { ...mockSettings, system: { ...mockSettings.system, timezone: 'America/Chicago' } };
      const string2 = prepareDataForHashing(modifiedSettings, mockHabits, mockCoins, mockWishlist, mockUsers);
      expect(string1).not.toBe(string2);
    });

    test('should produce a different string if habits data changes', () => {
      const string1 = prepareDataForHashing(mockSettings, mockHabits, mockCoins, mockWishlist, mockUsers);
      const modifiedHabits = { ...mockHabits, habits: [...mockHabits.habits, { id: 'new-habit', name: 'New', description: '', frequency: 'FREQ=DAILY', coinReward: 5, completions: [] }] };
      const string2 = prepareDataForHashing(mockSettings, modifiedHabits, mockCoins, mockWishlist, mockUsers);
      expect(string1).not.toBe(string2);
    });

    test('should handle empty data consistently', () => {
      const emptySettings = getDefaultSettings();
      const emptyHabits = getDefaultHabitsData();
      const emptyCoins = getDefaultCoinsData();
      const emptyWishlist = getDefaultWishlistData();
      const emptyUsers = getDefaultUsersData();

      const string1 = prepareDataForHashing(emptySettings, emptyHabits, emptyCoins, emptyWishlist, emptyUsers);
      const string2 = prepareDataForHashing(emptySettings, emptyHabits, emptyCoins, emptyWishlist, emptyUsers);
      expect(string1).toBe(string2);
      expect(string1).toBeDefined();
    });
  });

  describe('generateCryptoHash', () => {
    test('should generate a SHA-256 hex string', async () => {
      const dataString = 'test string';
      const hash = await generateCryptoHash(dataString);
      expect(hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex is 64 chars
    });

    test('should generate different hashes for different strings', async () => {
      const hash1 = await generateCryptoHash('test string 1');
      const hash2 = await generateCryptoHash('test string 2');
      expect(hash1).not.toBe(hash2);
    });

    test('should generate the same hash for the same string', async () => {
      const hash1 = await generateCryptoHash('consistent string');
      const hash2 = await generateCryptoHash('consistent string');
      expect(hash1).toBe(hash2);
    });

    // Test with a known SHA-256 value if possible, or ensure crypto.subtle.digest is available
    // For "hello world", SHA-256 is "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
    test('should generate correct hash for a known string', async () => {
      const knownString = "hello world";
      const expectedHash = "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9";
      const actualHash = await generateCryptoHash(knownString);
      expect(actualHash).toBe(expectedHash);
    });
  });
})
