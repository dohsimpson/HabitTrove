import { Habit } from '@/lib/types'
import { useAtom } from 'jotai'
import { settingsAtom, pomodoroAtom, browserSettingsAtom } from '@/lib/atoms'
import { getTodayInTimezone, isSameDate, t2d, d2t, getNow, parseNaturalLanguageRRule, parseRRule, d2s } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Coins, Edit, Trash2, Check, Undo2, MoreVertical, Timer, Archive, ArchiveRestore } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useEffect, useState } from 'react'
import { useHabits } from '@/hooks/useHabits'
import { INITIAL_RECURRENCE_RULE } from '@/lib/constants'
import { DateTime } from 'luxon'

interface HabitItemProps {
  habit: Habit
  onEdit: () => void
  onDelete: () => void
}

export default function HabitItem({ habit, onEdit, onDelete }: HabitItemProps) {
  const { completeHabit, undoComplete, archiveHabit, unarchiveHabit } = useHabits()
  const [settings] = useAtom(settingsAtom)
  const [_, setPomo] = useAtom(pomodoroAtom)
  const completionsToday = habit.completions?.filter(completion =>
    isSameDate(t2d({ timestamp: completion, timezone: settings.system.timezone }), t2d({ timestamp: d2t({ dateTime: getNow({ timezone: settings.system.timezone }) }), timezone: settings.system.timezone }))
  ).length || 0
  const target = habit.targetCompletions || 1
  const isCompletedToday = completionsToday >= target
  const [isHighlighted, setIsHighlighted] = useState(false)
  const [browserSettings] = useAtom(browserSettingsAtom)
  const isTasksView = browserSettings.viewType === 'tasks'
  const isRecurRule = !isTasksView

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const highlightId = params.get('highlight')

    if (highlightId === habit.id) {
      setIsHighlighted(true)
      // Scroll the element into view after a short delay to ensure rendering
      setTimeout(() => {
        const element = document.getElementById(`habit-${habit.id}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
      // Remove highlight after animation
      const timer = setTimeout(() => setIsHighlighted(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [habit.id])

  return (
    <Card
      id={`habit-${habit.id}`}
      className={`h-full flex flex-col transition-all duration-500 ${isHighlighted ? 'bg-yellow-100 dark:bg-yellow-900' : ''} ${habit.archived ? 'opacity-75' : ''}`}
    >
      <CardHeader className="flex-none">
        <CardTitle className={`line-clamp-1 ${habit.archived ? 'text-gray-400 dark:text-gray-500' : ''}`}>{habit.name}</CardTitle>
        {habit.description && (
          <CardDescription className={`whitespace-pre-line ${habit.archived ? 'text-gray-400 dark:text-gray-500' : ''}`}>
            {habit.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        <p className={`text-sm ${habit.archived ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500'}`}>When: {isRecurRule ? parseRRule(habit.frequency || INITIAL_RECURRENCE_RULE).toText() : d2s({ dateTime: t2d({ timestamp: habit.frequency, timezone: settings.system.timezone }), timezone: settings.system.timezone, format: DateTime.DATE_MED_WITH_WEEKDAY })}</p>
        <div className="flex items-center mt-2">
          <Coins className={`h-4 w-4 mr-1 ${habit.archived ? 'text-gray-400 dark:text-gray-500' : 'text-yellow-400'}`} />
          <span className={`text-sm font-medium ${habit.archived ? 'text-gray-400 dark:text-gray-500' : ''}`}>{habit.coinReward} coins per completion</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between gap-2">
        <div className="flex gap-2">
          <div className="relative">
            <Button
              variant={isCompletedToday ? "secondary" : "default"}
              size="sm"
              onClick={async () => await completeHabit(habit)}
              disabled={habit.archived || (isCompletedToday && completionsToday >= target)}
              className={`overflow-hidden w-24 sm:w-auto ${habit.archived ? 'cursor-not-allowed' : ''}`}
            >
              <Check className="h-4 w-4 sm:mr-2" />
              <span>
                {isCompletedToday ? (
                  target > 1 ? (
                    <>
                      <span className="sm:hidden">{completionsToday}/{target}</span>
                      <span className="hidden sm:inline">Completed ({completionsToday}/{target})</span>
                    </>
                  ) : (
                    'Completed'
                  )
                ) : (
                  target > 1 ? (
                    <>
                      <span className="sm:hidden">{completionsToday}/{target}</span>
                      <span className="hidden sm:inline">Complete ({completionsToday}/{target})</span>
                    </>
                  ) : 'Complete'
                )}
              </span>
              {habit.targetCompletions && habit.targetCompletions > 1 && (
                <div
                  className="absolute bottom-0 left-0 h-1 bg-white/50"
                  style={{
                    width: `${(completionsToday / target) * 100}%`
                  }}
                />
              )}
            </Button>
          </div>
          {completionsToday > 0 && !habit.archived && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => await undoComplete(habit)}
              className="w-10 sm:w-auto"
            >
              <Undo2 className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Undo</span>
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {!habit.archived && (
            <Button
              variant="edit"
              size="sm"
              onClick={onEdit}
              className="hidden sm:flex"
            >
              <Edit className="h-4 w-4" />
              <span className="ml-2">Edit</span>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!habit.archived && (
                <DropdownMenuItem onClick={() => {
                  setPomo((prev) => ({
                    ...prev,
                    show: true,
                    selectedHabitId: habit.id
                  }))
                }}>
                  <Timer className="mr-2 h-4 w-4" />
                  <span>Start Pomodoro</span>
                </DropdownMenuItem>
              )}
              {!habit.archived && (
                <DropdownMenuItem onClick={() => archiveHabit(habit.id)}>
                  <Archive className="mr-2 h-4 w-4" />
                  <span>Archive</span>
                </DropdownMenuItem>
              )}
              {habit.archived && (
                <DropdownMenuItem onClick={() => unarchiveHabit(habit.id)}>
                  <ArchiveRestore className="mr-2 h-4 w-4" />
                  <span>Unarchive</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={onEdit}
                className="sm:hidden"
                disabled={habit.archived}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator className="sm:hidden" />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400 cursor-pointer"
                onClick={onDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardFooter>
    </Card>
  )
}

