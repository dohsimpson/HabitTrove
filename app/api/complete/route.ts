import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const HMAC_SECRET = process.env.COMPLETE_HMAC_SECRET ?? 'habittrove-default-secret'

export function generateCompletionUrl(baseUrl: string, habitId: string): string {
  const timestamp = Date.now().toString()
  const sig = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(`${habitId}:${timestamp}`)
    .digest('hex')
  return `${baseUrl}/api/complete?habitId=${habitId}&t=${timestamp}&sig=${sig}`
}

export async function GET(request: NextRequest) {
  const habitId = request.nextUrl.searchParams.get('habitId')
  const timestamp = request.nextUrl.searchParams.get('t')
  const sig = request.nextUrl.searchParams.get('sig')

  if (!habitId || !timestamp || !sig) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  // Verify HMAC signature
  const expected = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(`${habitId}:${timestamp}`)
    .digest('hex')

  if (expected !== sig) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  // Check timestamp freshness (24h window)
  if (Date.now() - parseInt(timestamp) > 86400000) {
    return NextResponse.json({ error: 'Link expired' }, { status: 410 })
  }

  // Redirect to the habit page with highlight
  return NextResponse.redirect(new URL(`/?highlight=${habitId}`, request.url))
}
