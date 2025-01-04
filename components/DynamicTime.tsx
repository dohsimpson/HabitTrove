'use client'

import { useEffect, useState } from 'react'
import { DateTime } from 'luxon'
import { d2s, getNow } from '@/lib/utils'
import { useAtom } from 'jotai'
import { settingsAtom } from '@/lib/atoms'

interface DynamicTimeProps {
  timezone: string
}

export function DynamicTime() {
  const [settings] = useAtom(settingsAtom)
  const [time, setTime] = useState<DateTime>(getNow({ timezone: settings.system.timezone }))

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prevTime) => prevTime.plus({ seconds: 1 }))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="text-sm text-muted-foreground">
      {d2s({ dateTime: time, timezone: settings.system.timezone })}
    </div>
  )
}
