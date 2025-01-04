import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getTodayInTimezone } from '@/lib/utils'
import { loadHabitsData } from '@/app/actions/data'
import { Habit } from '@/lib/types'
import { useAtom } from 'jotai'
import { settingsAtom } from '@/lib/atoms'

export default function HabitOverview() {
  const [habits, setHabits] = useState<Habit[]>([])

  useEffect(() => {
    const fetchHabits = async () => {
      const data = await loadHabitsData()
      setHabits(data.habits)
    }
    fetchHabits()
  }, [])

  const [settings] = useAtom(settingsAtom)
  const today = getTodayInTimezone(settings.system.timezone)

  const completedToday = habits.filter(habit =>
    habit.completions.includes(today)
  ).length

  const habitsByFrequency = habits.reduce((acc, habit) => ({
    ...acc,
    [habit.frequency]: (acc[habit.frequency] || 0) + 1
  }), {} as Record<string, number>)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Habit Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Today's Progress */}
          <div className="bg-secondary/20 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Today&apos;s Progress</h3>
            <div className="flex items-center justify-between">
              <span>{completedToday}/{habits.length} completed</span>
              <BarChart className="h-5 w-5" />
            </div>
          </div>

          {/* Frequency Breakdown */}
          <div>
            <h3 className="font-semibold mb-2">Habit Frequency</h3>
            <div className="space-y-2">
              {Object.entries(habitsByFrequency).map(([frequency, count]) => (
                <div key={frequency} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{frequency}</span>
                  <span className="bg-secondary/30 px-2 py-1 rounded">
                    {count} habits
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

