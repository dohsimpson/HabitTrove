import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { DateTime, DateTimeFormatOptions } from "luxon"
import { datetime, RRule } from 'rrule'
import { Freq, Habit, CoinTransaction, Permission, ParsedFrequencyResult, ParsedResultType, User } from '@/lib/types'
import { DUE_MAP, INITIAL_DUE, RECURRENCE_RULE_MAP } from "./constants"
import * as chrono from 'chrono-node'
import _ from "lodash"
import { v4 as uuidv4 } from 'uuid'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// get today's date string for timezone
export function getTodayInTimezone(timezone: string): string {
  const now = getNow({ timezone });
  return getISODate({ dateTime: now, timezone });
}

export function getISODate({ dateTime, timezone }: { dateTime: DateTime, timezone: string }): string {
  return dateTime.setZone(timezone).toISODate()!;
}

// get datetime object of now
export function getNow({ timezone = 'utc', keepLocalTime }: { timezone?: string, keepLocalTime?: boolean }) {
  return DateTime.now().setZone(timezone, { keepLocalTime });
}

// get current time in epoch milliseconds
export function getNowInMilliseconds() {
  const now = getNow({});
  return d2n({ dateTime: now });
}

// iso timestamp to datetime object, most for storage read
export function t2d({ timestamp, timezone }: { timestamp: string; timezone: string }) {
  return DateTime.fromISO(timestamp).setZone(timezone);
}

// convert datetime object to iso timestamp, mostly for storage write (be sure to use default utc timezone when writing)
export function d2t({ dateTime, timezone = 'utc' }: { dateTime: DateTime, timezone?: string }) {
  return dateTime.setZone(timezone).toISO()!;
}

// convert datetime object to string, mostly for display
export function d2s({ dateTime, format, timezone }: { dateTime: DateTime, format?: string | DateTimeFormatOptions, timezone: string }) {
  if (format) {
    if (typeof format === 'string') {
      return dateTime.setZone(timezone).toFormat(format);
    } else {
      return dateTime.setZone(timezone).toLocaleString(format);
    }
  }
  return dateTime.setZone(timezone).toLocaleString(DateTime.DATETIME_MED);
}

// convert datetime object to date string, mostly for display
export function d2sDate({ dateTime }: { dateTime: DateTime }) {
  return dateTime.toLocaleString(DateTime.DATE_MED);
}

// convert datetime object to epoch milliseconds string, mostly for storage write
export function d2n({ dateTime }: { dateTime: DateTime }) {
  return dateTime.toMillis().toString();
}

// compare the date portion of two datetime objects (i.e. same year, month, day)
export function isSameDate(a: DateTime, b: DateTime) {
  return a.hasSame(b, 'day');
}

export function normalizeCompletionDate(date: string, timezone: string): string {
  // If already in ISO format, return as is
  if (date.includes('T')) {
    return date;
  }
  // Convert from yyyy-MM-dd to ISO format
  return DateTime.fromFormat(date, 'yyyy-MM-dd', { zone: timezone }).toUTC().toISO()!;
}

export function getCompletionsForDate({
  habit,
  date,
  timezone
}: {
  habit: Habit,
  date: DateTime | string,
  timezone: string
}): number {
  const dateObj = typeof date === 'string' ? DateTime.fromISO(date) : date
  return habit.completions.filter((completion: string) =>
    isSameDate(t2d({ timestamp: completion, timezone }), dateObj)
  ).length
}

export function getCompletionsForToday({
  habit,
  timezone
}: {
  habit: Habit,
  timezone: string
}): number {
  return getCompletionsForDate({ habit, date: getTodayInTimezone(timezone), timezone })
}

export function getCompletedHabitsForDate({
  habits,
  date,
  timezone
}: {
  habits: Habit[],
  date: DateTime | string,
  timezone: string
}): Habit[] {
  return habits.filter(habit => {
    const completionsToday = getCompletionsForDate({ habit, date, timezone })
    const target = habit.targetCompletions || 1
    return completionsToday >= target
  })
}

export function getHabitProgress({
  habit,
  timezone
}: {
  habit: Habit,
  timezone: string
}): number {
  const today = getTodayInTimezone(timezone)
  const completionsToday = getCompletionsForDate({ habit, date: today, timezone })
  const target = habit.targetCompletions || 1
  return Math.min(100, (completionsToday / target) * 100)
}

export function calculateCoinsEarnedToday(transactions: CoinTransaction[], timezone: string): number {
  const today = getTodayInTimezone(timezone);
  return transactions
    .filter(transaction =>
      isSameDate(t2d({ timestamp: transaction.timestamp, timezone }),
        t2d({ timestamp: today, timezone })) &&
      (transaction.amount > 0 || transaction.type === 'HABIT_UNDO')
    )
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

export function calculateTotalEarned(transactions: CoinTransaction[]): number {
  return transactions
    .filter(transaction =>
      transaction.amount > 0 || transaction.type === 'HABIT_UNDO'
    )
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

export function calculateTotalSpent(transactions: CoinTransaction[]): number {
  return Math.abs(
    transactions
      .filter(transaction =>
        transaction.amount < 0 &&
        transaction.type !== 'HABIT_UNDO'
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0)
  );
}

export function calculateCoinsSpentToday(transactions: CoinTransaction[], timezone: string): number {
  const today = getTodayInTimezone(timezone);
  return Math.abs(
    transactions
      .filter(transaction =>
        isSameDate(t2d({ timestamp: transaction.timestamp, timezone }),
          t2d({ timestamp: today, timezone })) &&
        transaction.amount < 0 &&
        transaction.type !== 'HABIT_UNDO'
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0)
  );
}

export function calculateTransactionsToday(transactions: CoinTransaction[], timezone: string): number {
  const today = getTodayInTimezone(timezone);
  return transactions.filter(t =>
    isSameDate(t2d({ timestamp: t.timestamp, timezone }),
      t2d({ timestamp: today, timezone }))
  ).length;
}

// Enhanced validation for weekly/monthly rules
function validateRecurrenceRule(rrule: RRule | null): ParsedFrequencyResult {
  if (!rrule) {
    return { result: null, message: 'Invalid recurrence rule.' };
  }

  const unsupportedReason = getUnsupportedRRuleReason(rrule);
  if (unsupportedReason) {
    return { result: rrule, message: unsupportedReason };
  }

  const options = rrule.origOptions;

  if (options.freq === RRule.WEEKLY && (!options.byweekday || !Array.isArray(options.byweekday) || options.byweekday.length === 0)) {
    return { result: null, message: 'Please specify day(s) of the week (e.g., "every week on Mon, Wed").' };
  }

  if (options.freq === RRule.MONTHLY &&
    (!options.bymonthday || !Array.isArray(options.bymonthday) || options.bymonthday.length === 0) &&
    (!options.bysetpos || !Array.isArray(options.bysetpos) || options.bysetpos.length === 0) && // Need to check bysetpos for rules like "last Friday"
    (!options.byweekday || !Array.isArray(options.byweekday) || options.byweekday.length === 0)) { // Need byweekday with bysetpos
    return { result: null, message: 'Please specify day of the month (e.g., "every month on the 15th") or position (e.g., "every month on the last Friday").' };
  }

  return { result: rrule, message: null };
}

// Convert a human-readable frequency (recurring or non-recurring) into a machine-readable one
export function convertHumanReadableFrequencyToMachineReadable({ text, timezone, isRecurring = false }: { text: string, timezone: string, isRecurring?: boolean }): ParsedFrequencyResult {
  text = text.trim()

  if (!isRecurring) {
    if (DUE_MAP[text]) {
      text = DUE_MAP[text]
    }
    const now = getNow({ timezone })
    const due = chrono.parseDate(text, { instant: now.toJSDate(), timezone })
    if (!due) return { result: null, message: 'Invalid due date.' }
    const result = due ? DateTime.fromJSDate(due).setZone(timezone) : null
    return { message: null, result: result ? (result.isValid ? result : null) : null }
  }

  let rrule: RRule | null
  if (RECURRENCE_RULE_MAP[text]) {
    rrule = deserializeRRule(RECURRENCE_RULE_MAP[text])
  } else if (text.toLowerCase() === 'weekdays') {
    // Handle 'weekdays' specifically if not in the map
    rrule = new RRule({
      freq: RRule.WEEKLY,
      byweekday: [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR]
    });
  } else {
    try {
      rrule = RRule.fromText(text)
    } catch (error) {
      rrule = null
    }
  }
  return validateRecurrenceRule(rrule);
}

// convert a machine-readable rrule **string** to an rrule object
export function deserializeRRule(rruleStr: string): RRule | null {
  try {
    return RRule.fromString(rruleStr);
  } catch (error) {
    return null;
  }
}

// convert a machine-readable rrule **object** to an rrule string
export function serializeRRule(rrule: RRule | null): string {
  if (!rrule) return 'invalid'; // Handle null case explicitly
  return rrule.toString()
}

// Convert a machine-readable frequency (recurring or non-recurring) into a human-readable one
export function convertMachineReadableFrequencyToHumanReadable({
  frequency,
  isRecurRule,
  timezone
}: {
  frequency: ParsedResultType,
  isRecurRule: boolean,
  timezone: string
}): string {
  if (isRecurRule) {
    if (!frequency) {
      return 'invalid'; // Handle null/undefined for recurring rules
    }
    if (frequency instanceof RRule) {
      return frequency.toText();
    } else if (typeof frequency === "string") {
      const parsedResult = deserializeRRule(frequency);
      return parsedResult?.toText() || 'invalid';
    } else {
      return 'invalid';
    }
  } else {
    // Handle non-recurring frequency
    if (!frequency) {
      // Use the imported constant for initial due date text
      return INITIAL_DUE;
    }
    if (typeof frequency === 'string') {
      return d2s({
        dateTime: t2d({ timestamp: frequency, timezone: timezone }),
        timezone: timezone,
        format: DateTime.DATE_MED_WITH_WEEKDAY
      });
    } else if (frequency instanceof DateTime) {
      return d2s({
        dateTime: frequency,
        timezone: timezone,
        format: DateTime.DATE_MED_WITH_WEEKDAY
      });
    } else {
      return 'invalid';
    }
  }
}

export function isHabitDue({
  habit,
  timezone,
  date
}: {
  habit: Habit
  timezone: string
  date: DateTime
}): boolean {
  // handle task
  if (habit.isTask) {
    // For tasks, frequency is stored as a UTC ISO timestamp
    const taskDueDate = t2d({ timestamp: habit.frequency, timezone })
    return isSameDate(taskDueDate, date);
  }

  // handle habit
  if (habit.archived) {
    return false
  }

  const startOfDay = date.setZone(timezone).startOf('day')
  const endOfDay = date.setZone(timezone).endOf('day')

  const ruleText = habit.frequency
  const rrule = deserializeRRule(ruleText)
  if (!rrule) return false
  rrule.origOptions.tzid = timezone
  rrule.options.tzid = rrule.origOptions.tzid
  rrule.origOptions.dtstart = datetime(startOfDay.year, startOfDay.month, startOfDay.day, startOfDay.hour, startOfDay.minute, startOfDay.second)
  rrule.options.dtstart = rrule.origOptions.dtstart
  rrule.origOptions.count = 1
  rrule.options.count = rrule.origOptions.count

  const matches = rrule.all()
  if (!matches.length) return false
  const t = DateTime.fromJSDate(matches[0]).toUTC().setZone('local', { keepLocalTime: true }).setZone(timezone)
  return startOfDay <= t && t <= endOfDay
}

export function isHabitCompleted(habit: Habit, timezone: string): boolean {
  return getCompletionsForToday({ habit, timezone: timezone }) >= (habit.targetCompletions || 1)
}

export function isTaskOverdue(habit: Habit, timezone: string): boolean {
  if (!habit.isTask || habit.archived) return false
  const dueDate = t2d({ timestamp: habit.frequency, timezone }).startOf('day')
  const now = getNow({ timezone }).startOf('day')
  return dueDate < now && !isHabitCompleted(habit, timezone)
}

export function isHabitDueToday({
  habit,
  timezone
}: {
  habit: Habit
  timezone: string
}): boolean {
  const today = getNow({ timezone })
  return isHabitDue({ habit, timezone, date: today })
}

export function getHabitFreq(habit: Habit): Freq {
  if (habit.isTask) {
    // don't support recurring task yet
    return 'daily'
  }
  const rrule = RRule.fromString(habit.frequency)
  const freq = rrule.origOptions.freq
  switch (freq) {
    case RRule.DAILY: return 'daily'
    case RRule.WEEKLY: return 'weekly'
    case RRule.MONTHLY: return 'monthly'
    case RRule.YEARLY: return 'yearly'

    default:
      console.error(`Invalid frequency: ${freq} (habit: ${habit.id} ${habit.name}) (rrule: ${rrule.toString()}). Defaulting to daily`)
      return 'daily'
  }
}

/**
 * Checks if an RRule is unsupported and returns the reason.
 * @param rrule The RRule object to check.
 * @returns A string message explaining why the rule is unsupported, or null if it's supported.
 */
export function getUnsupportedRRuleReason(rrule: RRule): string | null {
  const freq = rrule.origOptions.freq;
  const interval = rrule.origOptions.interval || 1; // RRule defaults interval to 1

  if (freq === RRule.HOURLY) {
    return 'Hourly frequency is not supported.';
  }
  if (freq === RRule.MINUTELY) {
    return 'Minutely frequency is not supported.';
  }
  if (freq === RRule.SECONDLY) {
    return 'Secondly frequency is not supported.';
  }
  if (freq === RRule.DAILY && interval > 1) {
    return 'Daily frequency with intervals greater than 1 is not supported.';
  }

  return null; // Rule is supported
}


// play sound (client side only, must be run in browser)
export const playSound = (soundPath: string = '/sounds/timer-end.wav') => {
  const audio = new Audio(soundPath)
  audio.play().catch(error => {
    console.error('Error playing sound:', error)
  })
}

// open a new window (client side only, must be run in browser)
export const openWindow = (url: string): boolean => {
  const newWindow = window.open(url, '_blank')
  if (newWindow === null) {
    // Popup was blocked
    return false
  }
  return true
}

export function deepMerge<T>(a: T, b: T) {
  return _.merge(a, b, (x: unknown, y: unknown) => {
    if (_.isArray(a)) {
      return a.concat(b)
    }
  })
}

export function checkPermission(
  permissions: Permission[] | undefined,
  resource: 'habit' | 'wishlist' | 'coins',
  action: 'write' | 'interact'
): boolean {
  if (!permissions) return false

  return permissions.some(permission => {
    switch (resource) {
      case 'habit':
        return permission.habit[action]
      case 'wishlist':
        return permission.wishlist[action]
      case 'coins':
        return permission.coins[action]
      default:
        return false
    }
  })
}

export function uuid() {
  return uuidv4()
}

export function hasPermission(
  currentUser: User | undefined,
  resource: 'habit' | 'wishlist' | 'coins',
  action: 'write' | 'interact'
): boolean {
  // If no current user, no permissions.
  if (!currentUser) {
    return false;
  }
  // If user is admin, they have all permissions.
  if (currentUser.isAdmin) {
    return true;
  }
  // Otherwise, check specific permissions.
  return checkPermission(currentUser.permissions, resource, action);
}
