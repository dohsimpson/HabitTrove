'use server'

import webpush from 'web-push'
import fs from 'fs/promises'
import path from 'path'
import { PushSubscriptionsData, PushSubscriptionRecord, UserId } from '@/lib/types'

webpush.setVapidDetails(
  'mailto:admin@habittrove.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

const SUBS_FILE = path.join(process.cwd(), 'data', 'pushSubscriptions.json')

async function readSubscriptionsFile(): Promise<PushSubscriptionsData> {
  try {
    const data = await fs.readFile(SUBS_FILE, 'utf8')
    return JSON.parse(data) as PushSubscriptionsData
  } catch {
    return { subscriptions: [] }
  }
}

async function writeSubscriptionsFile(data: PushSubscriptionsData): Promise<void> {
  await fs.writeFile(SUBS_FILE, JSON.stringify(data, null, 2))
}

export async function subscribeUser(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  userId: UserId
): Promise<{ success: boolean }> {
  try {
    const data = await readSubscriptionsFile()

    // Remove any existing subscription for this userId+endpoint combo
    data.subscriptions = data.subscriptions.filter(
      (s) => !(s.userId === userId && s.subscription.endpoint === subscription.endpoint)
    )

    // Append the new subscription
    const newRecord: PushSubscriptionRecord = {
      userId,
      subscription: {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
    }
    data.subscriptions.push(newRecord)

    await writeSubscriptionsFile(data)
    return { success: true }
  } catch (error) {
    console.error('Error subscribing user:', error)
    return { success: false }
  }
}

export async function unsubscribeUser(
  endpoint: string,
  userId: UserId
): Promise<{ success: boolean }> {
  try {
    const data = await readSubscriptionsFile()

    data.subscriptions = data.subscriptions.filter(
      (s) => !(s.subscription.endpoint === endpoint && s.userId === userId)
    )

    await writeSubscriptionsFile(data)
    return { success: true }
  } catch (error) {
    console.error('Error unsubscribing user:', error)
    return { success: false }
  }
}

export async function sendNotificationToUser(
  userId: UserId,
  payload: { title: string; body: string; tag?: string; habitId?: string; url?: string }
): Promise<{ sent: number; failed: number }> {
  const data = await readSubscriptionsFile()
  const userSubs = data.subscriptions.filter((s) => s.userId === userId)

  let sent = 0
  let failed = 0
  const expiredEndpoints: string[] = []

  for (const record of userSubs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: record.subscription.endpoint,
          keys: {
            p256dh: record.subscription.keys.p256dh,
            auth: record.subscription.keys.auth,
          },
        },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          icon: '/icon.png',
          tag: payload.tag,
          data: {
            habitId: payload.habitId,
            url: payload.url,
          },
        })
      )
      sent++
    } catch (error: unknown) {
      // HTTP 410 means subscription has expired — remove it
      if (
        error &&
        typeof error === 'object' &&
        'statusCode' in error &&
        (error as { statusCode: number }).statusCode === 410
      ) {
        expiredEndpoints.push(record.subscription.endpoint)
      } else {
        console.error('Error sending push notification:', error)
      }
      failed++
    }
  }

  // Remove expired subscriptions
  if (expiredEndpoints.length > 0) {
    const freshData = await readSubscriptionsFile()
    freshData.subscriptions = freshData.subscriptions.filter(
      (s) => !(s.userId === userId && expiredEndpoints.includes(s.subscription.endpoint))
    )
    await writeSubscriptionsFile(freshData)
  }

  return { sent, failed }
}

export async function getSubscriptionsForUser(userId: UserId): Promise<PushSubscriptionRecord[]> {
  const data = await readSubscriptionsFile()
  return data.subscriptions.filter((s) => s.userId === userId)
}
