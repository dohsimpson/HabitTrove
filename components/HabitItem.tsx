import { Habit } from '@/lib/types'
import { useAtom } from 'jotai'
import { settingsAtom } from '@/lib/atoms'
import { getTodayInTimezone, isSameDate, t2d, d2t, getNow, parseNaturalLanguageRRule, parseRRule } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Coins, Edit, Trash2, Check, Undo2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useHabits } from '@/hooks/useHabits'
import { RRule } from 'rrule'
import { INITIAL_RECURRENCE_RULE } from '@/lib/constants'

interface HabitItemProps {
  habit: Habit
  onEdit: () => void
  onDelete: () => void
}

export default function HabitItem({ habit, onEdit, onDelete }: HabitItemProps) {
  const { completeHabit, undoComplete } = useHabits()
  const [settings] = useAtom(settingsAtom)
  const today = getTodayInTimezone(settings.system.timezone)
  const completionsToday = habit.completions?.filter(completion =>
    isSameDate(t2d({ timestamp: completion, timezone: settings.system.timezone }), t2d({ timestamp: d2t({ dateTime: getNow({ timezone: settings.system.timezone }) }), timezone: settings.system.timezone }))
  ).length || 0
  const target = habit.targetCompletions || 1
  const isCompletedToday = completionsToday >= target
  const [isHighlighted, setIsHighlighted] = useState(false)

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
      className={`transition-all duration-500 ${isHighlighted ? 'bg-yellow-100 dark:bg-yellow-900' : ''}`}
    >
      <CardHeader>
        <CardTitle>{habit.name}</CardTitle>
        <CardDescription>{habit.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500">Frequency: {parseRRule(habit.frequency || INITIAL_RECURRENCE_RULE).toText()}</p>
        <div className="flex items-center mt-2">
          <Coins className="h-4 w-4 text-yellow-400 mr-1" />
          <span className="text-sm font-medium">{habit.coinReward} coins per completion</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>
          <Button variant="outline" size="sm" onClick={onEdit} className="mr-2">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Button
              variant={isCompletedToday ? "secondary" : "default"}
              size="sm"
              onClick={async () => await completeHabit(habit)}
              disabled={isCompletedToday && completionsToday >= target}
              className="overflow-hidden"
            >
              <Check className="h-4 w-4 mr-2" />
              {isCompletedToday ? (
                target > 1 ? `Completed (${completionsToday}/${target})` : 'Completed'
              ) : (
                target > 1 ? `Complete (${completionsToday}/${target})` : 'Complete'
              )}
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
          {completionsToday > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => await undoComplete(habit)}
            >
              <Undo2 />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

