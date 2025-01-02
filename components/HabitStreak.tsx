'use client'

import { Habit } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSettings } from '@/hooks/useSettings'
import { d2s, getNow } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface HabitStreakProps {
  habits: Habit[]
}

export default function HabitStreak({ habits }: HabitStreakProps) {
  const { settings } = useSettings()
  // Get the last 7 days of data
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = getNow({ timezone: settings.system.timezone });
    return d2s({ dateTime: d.minus({ days: i }), format: 'yyyy-MM-dd' });
  }).reverse()

  const completions = dates.map(date => {
    const completedCount = habits.reduce((count, habit) => {
      return count + (habit.completions.includes(date) ? 1 : 0);
    }, 0);
    return {
      date,
      completed: completedCount
    };
  });

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
