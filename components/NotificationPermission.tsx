'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { subscribeUser } from '@/app/actions/push'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)))
}

type NotificationStatus = 'idle' | 'requesting' | 'subscribed' | 'denied' | 'unsupported'

interface NotificationPermissionProps {
  userId: string
  onSubscribed?: () => void
}

export default function NotificationPermission({
  userId,
  onSubscribed,
}: NotificationPermissionProps) {
  const [status, setStatus] = useState<NotificationStatus>('idle')

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported')
      return
    }

    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }

    if (Notification.permission === 'granted') {
      // Check if there is already an active push subscription
      navigator.serviceWorker.ready
        .then((registration) => registration.pushManager.getSubscription())
        .then((existingSub) => {
          if (existingSub) {
            setStatus('subscribed')
          }
        })
        .catch(() => {
          // Ignore errors during subscription check
        })
    }
  }, [])

  async function handleEnableNotifications() {
    setStatus('requesting')

    try {
      const permission = await Notification.requestPermission()

      if (permission !== 'granted') {
        setStatus('denied')
        return
      }

      const registration = await navigator.serviceWorker.ready

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        console.error('VAPID public key is not configured')
        setStatus('idle')
        return
      }

      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const subscriptionJson = pushSubscription.toJSON()
      const endpoint = subscriptionJson.endpoint
      const p256dh = subscriptionJson.keys?.p256dh
      const auth = subscriptionJson.keys?.auth

      if (!endpoint || !p256dh || !auth) {
        console.error('Push subscription is missing required fields')
        setStatus('idle')
        return
      }

      await subscribeUser({ endpoint, keys: { p256dh, auth } }, userId)

      setStatus('subscribed')
      onSubscribed?.()
    } catch (error) {
      console.error('Error enabling push notifications:', error)
      setStatus('idle')
    }
  }

  if (status === 'unsupported') {
    return (
      <p className="text-sm text-muted-foreground">
        Push notifications are not supported in this browser.
      </p>
    )
  }

  if (status === 'subscribed') {
    return (
      <p className="text-sm text-green-600 dark:text-green-400">
        Notifications are enabled for this device.
      </p>
    )
  }

  if (status === 'denied') {
    return (
      <p className="text-sm text-muted-foreground">
        Notification permission was denied. Please enable notifications in your browser settings.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        onClick={handleEnableNotifications}
        disabled={status === 'requesting'}
      >
        {status === 'requesting' ? 'Requesting permission...' : 'Enable Notifications'}
      </Button>
      {status === 'idle' && (
        <p className="text-sm text-muted-foreground">
          Allow push notifications to get habit reminders.
        </p>
      )}
    </div>
  )
}
