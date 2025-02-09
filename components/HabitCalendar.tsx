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
import { habitsAtom, settingsAtom, completedHabitsMapAtom, hasTasksAtom } from '@/lib/atoms'
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
  const [hasTasks] = useAtom(hasTasksAtom)
  const habits = habitsData.habits

  const [completedHabitsMap] = useAtom(completedHabitsMapAtom)

  // Get completed dates for calendar modifiers
  const completedDates = useMemo(() => {
    return new Set(Array.from(completedHabitsMap.keys()).map(date =>
      getISODate({ dateTime: DateTime.fromISO(date), timezone: settings.system.timezone })
    ))
  }, [completedHabitsMap, settings.system.timezone])

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-6">Habit Calendar</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                completed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 font-medium rounded-md',
              }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate ? (
                <>{d2s({ dateTime: selectedDate, timezone: settings.system.timezone, format: DateTime.DATE_MED_WITH_WEEKDAY })}</>
              ) : (
                'Select a date'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate && (
              <div className="space-y-8">
                {hasTasks && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Tasks</h3>
                      <Badge variant="secondary">
                        {`${habits.filter(habit => {
                          if (habit.isTask && isHabitDue({
                            habit,
                            timezone: settings.system.timezone,
                            date: selectedDate
                          })) {
                            const completions = getCompletionsForDate({ habit, date: selectedDate, timezone: settings.system.timezone })
                            return completions >= (habit.targetCompletions || 1)
                          }
                          return false
                        }).length}/${habits.filter(habit => habit.isTask && isHabitDue({
                          habit,
                          timezone: settings.system.timezone,
                          date: selectedDate
                        })).length} Completed`}
                      </Badge>
                    </div>
                    <ul className="space-y-3">
                      {habits
                        .filter(habit => habit.isTask && !habit.archived && isHabitDue({
                          habit,
                          timezone: settings.system.timezone,
                          date: selectedDate
                        }))
                        .map((habit) => {
                          const completions = getCompletionsForDate({ habit, date: selectedDate, timezone: settings.system.timezone })
                          const isCompleted = completions >= (habit.targetCompletions || 1)
                          return (
                            <li key={habit.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors">
                              <span className="flex items-center gap-2">
                                <Linkify>{habit.name}</Linkify>
                                {habit.archived && (
                                  <Badge variant="secondary" className="text-xs">Archived</Badge>
                                )}
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
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Habits</h3>
                    <Badge variant="secondary">
                      {`${habits.filter(habit => {
                        if (!habit.isTask && !habit.archived && isHabitDue({
                          habit,
                          timezone: settings.system.timezone,
                          date: selectedDate
                        })) {
                          const completions = getCompletionsForDate({ habit, date: selectedDate, timezone: settings.system.timezone })
                          return completions >= (habit.targetCompletions || 1)
                        }
                        return false
                      }).length}/${habits.filter(habit => !habit.isTask && isHabitDue({
                        habit,
                        timezone: settings.system.timezone,
                        date: selectedDate
                      })).length} Completed`}
                    </Badge>
                  </div>
                  <ul className="space-y-3">
                    {habits
                      .filter(habit => !habit.isTask && !habit.archived && isHabitDue({
                        habit,
                        timezone: settings.system.timezone,
                        date: selectedDate
                      }))
                      .map((habit) => {
                    const completions = getCompletionsForDate({ habit, date: selectedDate, timezone: settings.system.timezone })
                    const isCompleted = completions >= (habit.targetCompletions || 1)
                    return (
                      <li key={habit.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <span className="flex items-center gap-2">
                          <Linkify>{habit.name}</Linkify>
                          {habit.archived && (
                            <Badge variant="secondary" className="text-xs">Archived</Badge>
                          )}
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
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

