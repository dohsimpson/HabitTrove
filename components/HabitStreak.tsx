'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { completedHabitsMapAtom, hasTasksAtom, settingsAtom } from '@/lib/atoms'; // Added completedHabitsMapAtom
import { Habit } from '@/lib/types'
import { d2s, getNow } from '@/lib/utils'; // Removed getCompletedHabitsForDate
import { useAtom } from 'jotai'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface HabitStreakProps {
  habits: Habit[]
}

export default function HabitStreak({ habits }: HabitStreakProps) {
  const [settings] = useAtom(settingsAtom)
  const [hasTasks] = useAtom(hasTasksAtom)
  const [completedHabitsMap] = useAtom(completedHabitsMapAtom) // Use the atom

  // Get the last 7 days of data
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = getNow({ timezone: settings.system.timezone });
    return d2s({ dateTime: d.minus({ days: i }), format: 'yyyy-MM-dd', timezone: settings.system.timezone });
  }).reverse()

  const completions = dates.map(date => {
    // Get completed habits for the date from the map
    const completedOnDate = completedHabitsMap.get(date) || [];

    // Filter the completed list to count habits and tasks
    const completedHabitsCount = completedOnDate.filter(h => !h.isTask).length;
    const completedTasksCount = completedOnDate.filter(h => h.isTask).length;

    return {
      date,
      habits: completedHabitsCount,
      tasks: completedTasksCount
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
