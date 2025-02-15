import { Badge } from '@/components/ui/badge'
import { Habit } from '@/lib/types'
import { isHabitDue, getCompletionsForDate } from '@/lib/utils'

interface CompletionCountBadgeProps {
  habits: Habit[]
  selectedDate: luxon.DateTime
  timezone: string
  type: 'tasks' | 'habits'
}

export function CompletionCountBadge({ habits, selectedDate, timezone, type }: CompletionCountBadgeProps) {
  const filteredHabits = habits.filter(habit => {
    const isTask = type === 'tasks'
    if ((habit.isTask === isTask) && isHabitDue({
      habit,
      timezone,
      date: selectedDate
    })) {
      const completions = getCompletionsForDate({ habit, date: selectedDate, timezone })
      return completions >= (habit.targetCompletions || 1)
    }
    return false
  }).length

  const totalHabits = habits.filter(habit => 
    (habit.isTask === (type === 'tasks')) && 
    isHabitDue({
      habit,
      timezone,
      date: selectedDate
    })
  ).length

  return (
    <Badge variant="secondary">
      {`${filteredHabits}/${totalHabits} Completed`}
    </Badge>
  )
}
