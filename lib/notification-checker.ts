import fs from 'fs/promises'
import path from 'path'
import { DateTime } from 'luxon'
import { HabitsData, Settings, UserData, NotificationStateData } from '@/lib/types'

const DATA_DIR = path.join(process.cwd(), 'data')

async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  try {
    const data = await fs.readFile(path.join(DATA_DIR, filename), 'utf8')
    return JSON.parse(data) as T
  } catch {
    return fallback
  }
}

async function writeJsonFile(filename: string, data: unknown): Promise<void> {
  await fs.writeFile(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2))
}

function countCompletionsOnDate(completions: string[], dateKey: string, timezone: string): number {
  return completions.filter((ts) => {
    const dt = DateTime.fromISO(ts, { zone: 'utc' }).setZone(timezone)
    return dt.toFormat('yyyy-MM-dd') === dateKey
  }).length
}

function isWithinFiveMinutes(now: DateTime, targetHHmm: string): boolean {
  const [hour, minute] = targetHHmm.split(':').map(Number)
  const target = now.set({ hour, minute, second: 0, millisecond: 0 })
  const diffMinutes = Math.abs(now.diff(target, 'minutes').minutes)
  return diffMinutes <= 5
}

export async function checkAndSendNotifications(): Promise<void> {
  // Load all required data files
  const habitsData = await readJsonFile<HabitsData>('habits.json', { habits: [] })
  const settingsData = await readJsonFile<Settings>('settings.json', {
    ui: { useNumberFormatting: true, useGrouping: true },
    system: { timezone: 'UTC', weekStartDay: 1, autoBackupEnabled: true, language: 'en' },
    profile: {},
  })
  const authData = await readJsonFile<UserData>('auth.json', { users: [] })
  const notificationState = await readJsonFile<NotificationStateData>('notificationState.json', {})

  const { sendNotificationToUser } = await import('@/app/actions/push')

  const timezone = settingsData.system?.timezone || 'UTC'
  const now = DateTime.now().setZone(timezone)
  const todayKey = now.toFormat('yyyy-MM-dd')

  // Default reminder times for all-day habits
  const reminderTimes =
    settingsData.notifications?.reminderTimes ?? ['08:00', '12:00', '18:00']

  const allUserIds = authData.users.map((u) => u.id)

  for (const habit of habitsData.habits) {
    if (!habit.notificationsEnabled) continue

    // Determine which users should receive this notification
    const targetUserIds =
      habit.userIds && habit.userIds.length > 0 ? habit.userIds : allUserIds

    const isTimeBlocked =
      habit.scheduleType === 'time-blocked' && !!habit.startTime

    if (isTimeBlocked && habit.startTime) {
      // Time-blocked habit: notify within ±5 min of startTime
      const stateKey = `${todayKey}:${habit.id}:start`

      if (notificationState[stateKey]) continue
      if (!isWithinFiveMinutes(now, habit.startTime)) continue

      for (const userId of targetUserIds) {
        const target = habit.targetCompletions ?? 1
        const completedToday = countCompletionsOnDate(habit.completions, todayKey, timezone)

        if (completedToday >= target) continue

        await sendNotificationToUser(userId, {
          title: `Time for: ${habit.name}`,
          body: habit.description || `It's time to complete your habit.`,
          tag: `habit-start-${habit.id}-${todayKey}`,
          habitId: habit.id,
          url: '/',
        })
      }

      notificationState[stateKey] = true
    } else {
      // All-day habit: check each reminder time
      for (const reminderTime of reminderTimes) {
        const stateKey = `${todayKey}:${habit.id}:${reminderTime}`

        if (notificationState[stateKey]) continue
        if (!isWithinFiveMinutes(now, reminderTime)) continue

        for (const userId of targetUserIds) {
          const target = habit.targetCompletions ?? 1
          const completedToday = countCompletionsOnDate(habit.completions, todayKey, timezone)

          if (completedToday >= target) continue

          await sendNotificationToUser(userId, {
            title: habit.name,
            body: `${completedToday} of ${target} done`,
            tag: `habit-reminder-${habit.id}-${todayKey}-${reminderTime}`,
            habitId: habit.id,
            url: '/',
          })
        }

        notificationState[stateKey] = true
      }
    }
  }

  // Prune keys with a date prefix earlier than today
  for (const key of Object.keys(notificationState)) {
    const datePrefix = key.split(':')[0]
    if (datePrefix < todayKey) {
      delete notificationState[key]
    }
  }

  await writeJsonFile('notificationState.json', notificationState)
}
