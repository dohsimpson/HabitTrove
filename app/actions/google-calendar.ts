'use server'

import { getAuthUrl, isGoogleCalendarEnabled } from '@/lib/google-calendar'
import { loadSettingsRaw, loadHabitsDataRaw, saveSettings } from './data'
import type { Settings } from '@/lib/types'

/**
 * Returns the Google OAuth auth URL for the user to visit.
 * Returns null if GCal integration is not configured.
 */
export async function connectGoogleCalendar(): Promise<string | null> {
  if (!isGoogleCalendarEnabled()) return null
  return getAuthUrl()
}

/**
 * Clears Google Calendar tokens from settings and sets connected: false.
 * Returns updated settings.
 */
export async function disconnectGoogleCalendar(
  currentSettings: Settings
): Promise<Settings> {
  const newSettings: Settings = {
    ...currentSettings,
    googleCalendar: {
      connected: false,
      syncEnabled: false,
    },
  }
  await saveSettings(newSettings)
  return newSettings
}

/**
 * Syncs all eligible habits to Google Calendar.
 * Returns counts of synced habits and errors.
 */
export async function triggerSync(
  currentSettings: Settings
): Promise<{ synced: number; errors: number }> {
  if (!isGoogleCalendarEnabled()) return { synced: 0, errors: 0 }
  if (!currentSettings.googleCalendar?.connected) return { synced: 0, errors: 0 }

  const { syncHabitToCalendar } = await import('@/lib/google-calendar-sync')
  const habitsData = await loadHabitsDataRaw()

  const eligibleHabits = habitsData.habits.filter(
    (h) => h.notificationsEnabled || currentSettings.googleCalendar?.syncEnabled
  )

  let synced = 0
  let errors = 0

  // We need fresh settings to potentially pick up calendarId after first sync
  const settings = await loadSettingsRaw()

  for (const habit of eligibleHabits) {
    try {
      const result = await syncHabitToCalendar(habit, settings)
      if (result) {
        synced++
        // If we got a new event ID, persist it to the habit (handled by caller or hook)
      } else {
        errors++
      }
    } catch {
      errors++
    }
  }

  // Update lastSyncAt
  const updatedSettings: Settings = {
    ...settings,
    googleCalendar: {
      ...settings.googleCalendar!,
      lastSyncAt: new Date().toISOString(),
    },
  }
  await saveSettings(updatedSettings)

  return { synced, errors }
}

/**
 * Returns Google Calendar status for the current settings.
 */
export async function getGoogleCalendarStatus(
  currentSettings: Settings
): Promise<{ enabled: boolean; connected: boolean; lastSyncAt?: string }> {
  return {
    enabled: isGoogleCalendarEnabled(),
    connected: currentSettings.googleCalendar?.connected ?? false,
    lastSyncAt: currentSettings.googleCalendar?.lastSyncAt,
  }
}

/**
 * Server action to sync a single habit to Google Calendar by ID.
 * Called from client hooks after saving a habit.
 */
export async function syncGCalHabit(habitId: string): Promise<void> {
  if (!isGoogleCalendarEnabled()) return

  const [settings, habitsData] = await Promise.all([
    loadSettingsRaw(),
    loadHabitsDataRaw(),
  ])

  if (!settings.googleCalendar?.connected || !settings.googleCalendar.syncEnabled) return

  const habit = habitsData.habits.find((h) => h.id === habitId)
  if (!habit) return

  try {
    const { syncHabitToCalendar } = await import('@/lib/google-calendar-sync')
    const result = await syncHabitToCalendar(habit, settings)

    if (result && result.googleCalendarEventId !== habit.googleCalendarEventId) {
      // Persist new event ID back to the habit
      const { saveHabitsData } = await import('./data')
      const updatedHabits = habitsData.habits.map((h) =>
        h.id === habitId
          ? { ...h, googleCalendarEventId: result.googleCalendarEventId }
          : h
      )
      await saveHabitsData({ habits: updatedHabits })
    }
  } catch (err) {
    console.error(`[GCal] syncGCalHabit failed for habit ${habitId}:`, err)
  }
}

/**
 * Server action to remove a habit from Google Calendar by ID.
 * Called from client hooks before deleting a habit.
 */
export async function removeGCalHabit(habitId: string): Promise<void> {
  if (!isGoogleCalendarEnabled()) return

  const [settings, habitsData] = await Promise.all([
    loadSettingsRaw(),
    loadHabitsDataRaw(),
  ])

  if (!settings.googleCalendar?.connected) return

  const habit = habitsData.habits.find((h) => h.id === habitId)
  if (!habit?.googleCalendarEventId) return

  try {
    const { removeHabitFromCalendar } = await import('@/lib/google-calendar-sync')
    await removeHabitFromCalendar(habit, settings)
  } catch (err) {
    console.error(`[GCal] removeGCalHabit failed for habit ${habitId}:`, err)
  }
}
