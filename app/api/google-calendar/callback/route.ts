import { NextRequest, NextResponse } from 'next/server'
import { exchangeCode } from '@/lib/google-calendar'
import { loadSettingsRaw, saveSettings } from '@/app/actions/data'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(new URL('/settings?gcal=error', request.url))
  }

  try {
    const tokens = await exchangeCode(code)
    const settings = await loadSettingsRaw()

    const newSettings = {
      ...settings,
      googleCalendar: {
        connected: true,
        syncEnabled: true,
        accessToken: tokens.access_token ?? undefined,
        refreshToken: tokens.refresh_token ?? undefined,
        tokenExpiry: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : undefined,
      },
    }

    await saveSettings(newSettings)

    return NextResponse.redirect(new URL('/settings?gcal=connected', request.url))
  } catch (err) {
    console.error('Google Calendar OAuth callback error:', err)
    return NextResponse.redirect(new URL('/settings?gcal=error', request.url))
  }
}
