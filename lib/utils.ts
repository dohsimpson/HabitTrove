import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { DateTime } from "luxon"
import { Habit } from '@/lib/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// get today's date string for timezone
export function getTodayInTimezone(timezone: string): string {
  const now = getNow({ timezone });
  return d2s({ dateTime: now, format: 'yyyy-MM-dd', timezone });
}

// get datetime object of now
export function getNow({ timezone = 'utc' }: { timezone?: string }) {
  return DateTime.now().setZone(timezone);
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

// convert datetime object to iso timestamp, mostly for storage write
export function d2t({ dateTime, timezone = 'utc' }: { dateTime: DateTime, timezone?: string }) {
  return dateTime.setZone(timezone).toISO()!;
}

// convert datetime object to string, mostly for display
export function d2s({ dateTime, format, timezone }: { dateTime: DateTime, format?: string, timezone: string }) {
  if (format) {
    return dateTime.setZone(timezone).toFormat(format);
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

export function isHabitCompletedToday({ 
  habit, 
  timezone 
}: { 
  habit: Habit, 
  timezone: string 
}): boolean {
  const today = getTodayInTimezone(timezone)
  const completionsToday = getCompletionsForDate({ habit, date: today, timezone })
  return completionsToday >= (habit.targetCompletions || 1)
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
