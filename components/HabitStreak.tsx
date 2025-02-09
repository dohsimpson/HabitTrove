'use client'

import { Habit } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { d2s, getNow, t2d, getCompletedHabitsForDate } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAtom } from 'jotai'
import { settingsAtom, hasTasksAtom } from '@/lib/atoms'

interface HabitStreakProps {
  habits: Habit[]
}

export default function HabitStreak({ habits }: HabitStreakProps) {
  const [settings] = useAtom(settingsAtom)
  const [hasTasks] = useAtom(hasTasksAtom)
  // Get the last 7 days of data
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = getNow({ timezone: settings.system.timezone });
    return d2s({ dateTime: d.minus({ days: i }), format: 'yyyy-MM-dd', timezone: settings.system.timezone });
  }).reverse()

  const completions = dates.map(date => {
    const completedHabits = getCompletedHabitsForDate({
      habits: habits.filter(h => !h.isTask),
      date: t2d({ timestamp: date, timezone: settings.system.timezone }),
      timezone: settings.system.timezone
    });
    const completedTasks = getCompletedHabitsForDate({
      habits: habits.filter(h => h.isTask),
      date: t2d({ timestamp: date, timezone: settings.system.timezone }),
      timezone: settings.system.timezone
    });
    return {
      date,
      habits: completedHabits.length,
      tasks: completedTasks.length
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Completion Streak</CardTitle>
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
              <Tooltip formatter={(value, name) => [`${value} ${name}`, 'Completed']} />
              <Line
                type="monotone"
                name="habits"
                dataKey="habits"
                stroke="#14b8a6"
                strokeWidth={2}
                dot={false}
              />
              {hasTasks && (
                <Line
                  type="monotone"
                  name="tasks"
                  dataKey="tasks"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
