'use server'

import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:mydohsimpson@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

interface PushSubscriptionWithKeys extends PushSubscription {
  keys: {
    p256dh: string
    auth: string
  }
}

let subscription: PushSubscriptionWithKeys | null = null

export async function subscribeUser(sub: PushSubscriptionWithKeys) {
  subscription = sub
  return { success: true }
}

export async function unsubscribeUser() {
  subscription = null
  return { success: true }
}

export async function sendNotification(message: string) {
  if (!subscription) {
    throw new Error('No subscription available')
  }

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: 'HabitTrove',
        body: message,
        icon: '/icon.png',
      })
    )
    return { success: true }
  } catch (error) {
    console.error('Error sending push notification:', error)
    return { success: false, error: 'Failed to send notification' }
  }
}
