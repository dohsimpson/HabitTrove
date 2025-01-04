'use client'

import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { d2s, getNow } from '@/lib/utils'
import { useAtom } from 'jotai'
import { habitsAtom, settingsAtom } from '@/lib/atoms'
import { DateTime } from 'luxon'
import Linkify from './linkify'

export default function HabitCalendar() {
  const [settings] = useAtom(settingsAtom)
  const [selectedDate, setSelectedDate] = useState<DateTime>(getNow({ timezone: settings.system.timezone }))
  const [habitsData] = useAtom(habitsAtom)
  const habits = habitsData.habits

  const getHabitsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return habits.filter(habit =>
      habit.completions.includes(dateString)
    )
  }

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
              className="rounded-md border"
              modifiers={{
                completed: (date) => getHabitsForDate(date).length > 0,
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
                <>Habits for {d2s({ dateTime: selectedDate, timezone: settings.system.timezone })}</>
              ) : (
                'Select a date'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate && (
              <ul className="space-y-2">
                {habits.map((habit) => {
                  const isCompleted = getHabitsForDate(selectedDate.toJSDate()).some(h => h.id === habit.id)
                  return (
                    <li key={habit.id} className="flex items-center justify-between">
                      <span>
                        <Linkify>{habit.name}</Linkify>
                      </span>
                      {isCompleted ? (
                        <Badge variant="default">Completed</Badge>
                      ) : (
                        <Badge variant="secondary">Not Completed</Badge>
                      )}
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

