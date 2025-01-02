'use client'

import { Habit } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSettings } from '@/hooks/useSettings'
import { getDateInTimezone } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface HabitStreakProps {
  habits: Habit[]
}

export default function HabitStreak({ habits }: HabitStreakProps) {
  // Get the last 30 days of data
  const dates = Array.from({ length: 30 }, (_, i) => {
    const { settings } = useSettings()
    const d = getDateInTimezone(new Date(), settings.system.timezone)
    d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0]
  }).reverse()

  // Count completed habits per day
  const completions = dates.map(date => ({
    date: new Date(date).toLocaleDateString(),
    completed: habits.filter(habit =>
      habit.completions.includes(date)
    ).length
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Habit Completion Streak</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full aspect-[2/1]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={completions}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} habits`, 'Completed']} />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#14b8a6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
