'use client'

import { useState, useMemo, useCallback } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, Circle, CircleCheck } from 'lucide-react'
import { d2s, getNow, t2d, getCompletedHabitsForDate, isHabitDue, getISODate, getCompletionsForToday, getCompletionsForDate } from '@/lib/utils'
import { useAtom } from 'jotai'
import { useHabits } from '@/hooks/useHabits'
import { habitsAtom, settingsAtom, completedHabitsMapAtom } from '@/lib/atoms'
import { DateTime } from 'luxon'
import Linkify from './linkify'
import { Habit } from '@/lib/types'

export default function HabitCalendar() {
  const { completePastHabit } = useHabits()

  const handleCompletePastHabit = useCallback(async (habit: Habit, date: DateTime) => {
    try {
      await completePastHabit(habit, date)
    } catch (error) {
      console.error('Error completing past habit:', error)
    }
  }, [completePastHabit])
  const [settings] = useAtom(settingsAtom)
  const [selectedDate, setSelectedDate] = useState<DateTime>(getNow({ timezone: settings.system.timezone }))
  const [habitsData] = useAtom(habitsAtom)
  const habits = habitsData.habits

  const [completedHabitsMap] = useAtom(completedHabitsMapAtom)

  // Get completed dates for calendar modifiers
  const completedDates = useMemo(() => {
    return new Set(Array.from(completedHabitsMap.keys()).map(date =>
      getISODate({ dateTime: DateTime.fromISO(date), timezone: settings.system.timezone })
    ))
  }, [completedHabitsMap, settings.system.timezone])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Habit Calendar</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate.toJSDate()}
              onSelect={(e) => e && setSelectedDate(DateTime.fromJSDate(e))}
              weekStartsOn={settings.system.weekStartDay}
              className="rounded-md border"
              modifiers={{
                completed: (date) => completedDates.has(
                  getISODate({
                    dateTime: DateTime.fromJSDate(date),
                    timezone: settings.system.timezone
                  })!
                )
              }}
              modifiersClassNames={{
                completed: 'bg-green-100 text-green-800 font-bold',
              }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate ? (
                <>Habits for {d2s({ dateTime: selectedDate, timezone: settings.system.timezone, format: "yyyy-MM-dd" })}</>
              ) : (
                'Select a date'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate && (
              <ul className="space-y-2">
                {habits
                  .filter(habit => isHabitDue({
                    habit,
                    timezone: settings.system.timezone,
                    date: selectedDate
                  }))
                  .map((habit) => {
                    const completions = getCompletionsForDate({ habit, date: selectedDate, timezone: settings.system.timezone })
                    const isCompleted = completions >= (habit.targetCompletions || 1)
                    return (
                      <li key={habit.id} className="flex items-center justify-between gap-2">
                        <span>
                          <Linkify>{habit.name}</Linkify>
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            {habit.targetCompletions && (
                              <span className="text-sm text-muted-foreground">
                                {completions}/{habit.targetCompletions}
                              </span>
                            )}
                            <button
                              onClick={() => handleCompletePastHabit(habit, selectedDate)}
                              disabled={isCompleted}
                              className="relative h-4 w-4 hover:opacity-70 transition-opacity disabled:opacity-100"
                            >
                              {isCompleted ? (
                                <CircleCheck className="h-4 w-4 text-green-500" />
                              ) : (
                                <div className="relative h-4 w-4">
                                  <Circle className="absolute h-4 w-4 text-muted-foreground" />
                                  <div
                                    className="absolute h-4 w-4 rounded-full overflow-hidden"
                                    style={{
                                      background: `conic-gradient(
                                        currentColor ${(completions / (habit.targetCompletions ?? 1)) * 360}deg,
                                        transparent ${(completions / (habit.targetCompletions ?? 1)) * 360}deg 360deg
                                      )`,
                                      mask: 'radial-gradient(transparent 50%, black 51%)',
                                      WebkitMask: 'radial-gradient(transparent 50%, black 51%)'
                                    }}
                                  />
                                </div>
                              )}
                            </button>
                          </div>
                        </div>
                      </li>
                    )
                  })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

