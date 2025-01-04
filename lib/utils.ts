import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { DateTime } from "luxon"

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
