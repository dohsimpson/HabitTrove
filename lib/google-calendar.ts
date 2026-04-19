import { google } from 'googleapis'
import type { Settings } from './types'

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = (process.env.NEXTAUTH_URL ?? 'http://localhost:3000') + '/api/google-calendar/callback'

export function isGoogleCalendarEnabled(): boolean {
  return !!(CLIENT_ID && CLIENT_SECRET)
}

export function getOAuth2Client() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)
}

export function getAuthUrl(): string {
  const client = getOAuth2Client()
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    prompt: 'consent',
  })
}

export async function exchangeCode(code: string) {
  const client = getOAuth2Client()
  const { tokens } = await client.getToken(code)
  return tokens
}

export function getAuthenticatedClient(settings: Settings) {
  const gcal = settings.googleCalendar
  if (!gcal?.accessToken) throw new Error('No Google Calendar access token')
  const client = getOAuth2Client()
  client.setCredentials({
    access_token: gcal.accessToken,
    refresh_token: gcal.refreshToken,
    expiry_date: gcal.tokenExpiry ? new Date(gcal.tokenExpiry).getTime() : undefined,
  })
  return client
}
