import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import moment from "moment-timezone"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDateInTimezone(date: Date | string, timezone: string): Date {
  const m = moment.tz(date, timezone);
  return new Date(m.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'));
}

export function getTodayInTimezone(timezone: string): string {
  return moment.tz(timezone).format('YYYY-MM-DD');
}
