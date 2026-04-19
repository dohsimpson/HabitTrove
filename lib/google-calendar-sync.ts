import { google, calendar_v3 } from 'googleapis'
import { getAuthenticatedClient, isGoogleCalendarEnabled } from './google-calendar'
import type { Habit, Settings } from './types'

const CALENDAR_SUMMARY = 'HabitTrove'

function getCalendarClient(client: ReturnType<typeof getAuthenticatedClient>) {
  return google.calendar({ version: 'v3', auth: client })
}

/**
 * Finds or creates the "HabitTrove" calendar, returns its calendarId.
 */
export async function ensureHabitTroveCalendar(
  client: ReturnType<typeof getAuthenticatedClient>,
  settings: Settings
): Promise<string> {
  const calendar = getCalendarClient(client)

  // If we already have a calendarId stored, return it
  if (settings.googleCalendar?.calendarId) {
    return settings.googleCalendar.calendarId
  }

  // List existing calendars to find HabitTrove
  const listRes = await calendar.calendarList.list()
  const existing = (listRes.data.items ?? []).find(
    (cal) => cal.summary === CALENDAR_SUMMARY
  )
  if (existing?.id) {
    return existing.id
  }

  // Create a new calendar
  const createRes = await calendar.calendars.insert({
    requestBody: {
      summary: CALENDAR_SUMMARY,
      description: 'Synced habits from HabitTrove',
      timeZone: settings.system?.timezone ?? 'UTC',
    },
  })

  return createRes.data.id!
}

/**
 * Helper to build a client and calendar from settings that include tokens
 * (used in callback after we just stored tokens but before calendarId is set).
 */
export function getAuthenticatedClientFromTokens(settings: Settings) {
  return getAuthenticatedClient(settings)
}

/**
 * Build a GCal event body for a habit.
 */
function buildEventBody(
  habit: Habit,
  settings: Settings,
  calendarId: string,
  baseUrl: string
): calendar_v3.Schema$Event {
  const timezone = settings.system?.timezone ?? 'UTC'

  // Parse RRULE from habit.frequency if it looks like an rrule string
  let recurrence: string[] | undefined
  if (habit.frequency && habit.frequency.toUpperCase().startsWith('RRULE:')) {
    recurrence = [habit.frequency.toUpperCase()]
  }

  const completionUrl = `${baseUrl}/api/complete?habitId=${habit.id}`

  const descriptionParts: string[] = []
  if (habit.description) descriptionParts.push(habit.description)
  descriptionParts.push(`\n✅ Mark complete: ${completionUrl}`)

  const event: calendar_v3.Schema$Event = {
    summary: habit.name,
    description: descriptionParts.join('\n'),
    extendedProperties: {
      private: {
        habitId: habit.id,
        source: 'habittrove',
      },
    },
  }

  if (recurrence) {
    event.recurrence = recurrence
  }

  if (habit.scheduleType === 'time-blocked' && habit.startTime && habit.endTime) {
    // Time-blocked event: use dateTime
    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    event.start = {
      dateTime: `${today}T${habit.startTime}:00`,
      timeZone: timezone,
    }
    event.end = {
      dateTime: `${today}T${habit.endTime}:00`,
      timeZone: timezone,
    }
  } else {
    // All-day event
    const today = new Date().toISOString().slice(0, 10)
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    event.start = { date: today }
    event.end = { date: tomorrow }
  }

  return event
}

/**
 * Creates or updates a GCal event for a habit.
 * Returns { googleCalendarEventId } on success, or null on failure.
 */
export async function syncHabitToCalendar(
  habit: Habit,
  settings: Settings
): Promise<{ googleCalendarEventId: string } | null> {
  if (!isGoogleCalendarEnabled()) return null
  if (!settings.googleCalendar?.connected) return null
  if (!settings.googleCalendar.syncEnabled && !habit.notificationsEnabled) return null

  try {
    const client = getAuthenticatedClient(settings)
    const calendarId = await ensureHabitTroveCalendar(client, settings)
    const calendar = getCalendarClient(client)

    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    const eventBody = buildEventBody(habit, settings, calendarId, baseUrl)

    if (habit.googleCalendarEventId) {
      // Update existing event
      await calendar.events.patch({
        calendarId,
        eventId: habit.googleCalendarEventId,
        requestBody: eventBody,
      })
      return { googleCalendarEventId: habit.googleCalendarEventId }
    } else {
      // Create new event
      const res = await calendar.events.insert({
        calendarId,
        requestBody: eventBody,
      })
      return { googleCalendarEventId: res.data.id! }
    }
  } catch (err) {
    console.error(`[GCal] syncHabitToCalendar failed for habit ${habit.id}:`, err)
    return null
  }
}

/**
 * Removes a GCal event for a habit.
 */
export async function removeHabitFromCalendar(
  habit: Habit,
  settings: Settings
): Promise<void> {
  if (!isGoogleCalendarEnabled()) return
  if (!habit.googleCalendarEventId) return
  if (!settings.googleCalendar?.connected) return

  try {
    const client = getAuthenticatedClient(settings)
    const calendarId =
      settings.googleCalendar?.calendarId ??
      (await ensureHabitTroveCalendar(client, settings))
    const calendar = getCalendarClient(client)

    await calendar.events.delete({
      calendarId,
      eventId: habit.googleCalendarEventId,
    })
  } catch (err) {
    console.error(`[GCal] removeHabitFromCalendar failed for habit ${habit.id}:`, err)
  }
}

/**
 * Polls GCal for events modified since lastSyncAt.
 * Returns a list of { habitId, completed } for downstream processing.
 */
export async function pollCompletionsFromCalendar(
  settings: Settings
): Promise<Array<{ habitId: string; completed: boolean }>> {
  if (!isGoogleCalendarEnabled()) return []
  if (!settings.googleCalendar?.connected || !settings.googleCalendar.syncEnabled) return []

  try {
    const client = getAuthenticatedClient(settings)
    const calendarId =
      settings.googleCalendar?.calendarId ??
      (await ensureHabitTroveCalendar(client, settings))
    const calendar = getCalendarClient(client)

    const updatedMin =
      settings.googleCalendar?.lastSyncAt ?? new Date(0).toISOString()

    const res = await calendar.events.list({
      calendarId,
      updatedMin,
      singleEvents: true,
      showDeleted: false,
      maxResults: 250,
    })

    const results: Array<{ habitId: string; completed: boolean }> = []
    for (const event of res.data.items ?? []) {
      const habitId = event.extendedProperties?.private?.['habitId']
      if (!habitId) continue

      // Treat events with status 'confirmed' as completed if they exist
      const completed = event.status !== 'cancelled'
      results.push({ habitId, completed })
    }

    return results
  } catch (err) {
    console.error('[GCal] pollCompletionsFromCalendar failed:', err)
    return []
  }
}

/**
 * Top-level sync runner used by the cron job.
 * Loads settings, polls for changes, processes results.
 */
export async function runGoogleCalendarSync(): Promise<void> {
  if (!isGoogleCalendarEnabled()) return

  const { loadSettingsRaw } = await import('@/app/actions/data')
  const settings = await loadSettingsRaw()

  if (!settings.googleCalendar?.connected || !settings.googleCalendar.syncEnabled) return

  const results = await pollCompletionsFromCalendar(settings)

  if (results.length > 0) {
    console.log(`[GCal] Polled ${results.length} updated event(s) from Google Calendar`)
    // Future: process completion updates from GCal into habits
    // For now, log for observability
    for (const { habitId, completed } of results) {
      console.log(`[GCal] Habit ${habitId}: completed=${completed}`)
    }
  }

  // Update lastSyncAt in settings
  const { saveSettings } = await import('@/app/actions/data')
  await saveSettings({
    ...settings,
    googleCalendar: {
      ...settings.googleCalendar,
      lastSyncAt: new Date().toISOString(),
    },
  })
}
