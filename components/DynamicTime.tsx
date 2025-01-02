'use client'

import { useEffect, useState } from 'react'
import moment from 'moment-timezone'

interface DynamicTimeProps {
  timezone: string
}

export function DynamicTime({ timezone }: DynamicTimeProps) {
  const [time, setTime] = useState(moment())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(moment())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="text-sm text-muted-foreground">
      {time.tz(timezone).format('dddd, MMMM D, YYYY h:mm:ss A')}
    </div>
  )
}
