'use client'

import { useEffect, useState } from 'react'
import { DateTime } from 'luxon'
import { d2s } from '@/lib/utils'

interface DynamicTimeProps {
  timezone: string
}

export function DynamicTime({ timezone }: DynamicTimeProps) {
  const [time, setTime] = useState(DateTime.now().setZone(timezone))

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prevTime) => prevTime.plus({ seconds: 1 }))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="text-sm text-muted-foreground">
      {d2s({ dateTime: time })}
    </div>
  )
}
