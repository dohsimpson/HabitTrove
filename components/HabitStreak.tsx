'use client'

import { Habit } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { d2s, getNow, t2d } from '@/lib/utils' // Removed getCompletedHabitsForDate
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAtom } from 'jotai'
import { useTranslations } from 'next-intl'
import { settingsAtom, hasTasksAtom, completedHabitsMapAtom } from '@/lib/atoms' // Added completedHabitsMapAtom

interface HabitStreakProps {
  habits: Habit[]
}

export default function HabitStreak({ habits }: HabitStreakProps) {
  const t = useTranslations('HabitStreak');
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
        <CardTitle>{t('dailyCompletionStreakTitle')}</CardTitle>
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
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(value, name) => {
                const translatedName = name === 'habits' ? t('tooltipHabitsLabel') : t('tooltipTasksLabel');
                return [`${value} ${translatedName}`, t('tooltipCompletedLabel')];
              }} />
              <Line
                type="monotone"
                name={t('tooltipHabitsLabel')}
                dataKey="habits"
                stroke="#14b8a6"
                strokeWidth={2}
                dot={false}
              />
              {hasTasks && (
                <Line
                  type="monotone"
                  name={t('tooltipTasksLabel')}
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
