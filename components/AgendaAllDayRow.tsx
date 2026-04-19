'use client'

import { useState } from 'react'
import { DateTime } from 'luxon'
import { Habit } from '@/lib/types'
import { getCompletionsForDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Undo2, CheckSquare, Square } from 'lucide-react'
import { useAtom } from 'jotai'
import { settingsAtom } from '@/lib/atoms'

interface AgendaAllDayRowProps {
  date: DateTime
  dateKey: string
  habits: Habit[]
  onComplete: (habit: Habit) => void
  onUndo: (habit: Habit) => void
}

interface HabitRowProps {
  habit: Habit
  dateKey: string
  timezone: string
  onComplete: (habit: Habit) => void
  onUndo: (habit: Habit) => void
}

function HabitRow({ habit, dateKey, timezone, onComplete, onUndo }: HabitRowProps) {
  // Optimistic local count for immediate feedback
  const serverCompletions = getCompletionsForDate({ habit, date: dateKey, timezone })
  const [optimisticDelta, setOptimisticDelta] = useState(0)
  const completions = serverCompletions + optimisticDelta
  const target = habit.targetCompletions || 1
  const isCompleted = completions >= target

  const handleComplete = async () => {
    if (isCompleted) return
    setOptimisticDelta(d => d + 1)
    try {
      await onComplete(habit)
    } catch {
      setOptimisticDelta(d => d - 1)
    }
  }

  const handleUndo = async () => {
    if (completions <= 0) return
    setOptimisticDelta(d => d - 1)
    try {
      await onUndo(habit)
    } catch {
      setOptimisticDelta(d => d + 1)
    }
  }

  return (
    <div className="flex items-center gap-2 py-1 px-2 rounded hover:bg-muted/50 transition-colors">
      {/* Checkbox for single-completion habits */}
      {target <= 1 ? (
        <button
          onClick={isCompleted ? handleUndo : handleComplete}
          className="flex-shrink-0 hover:opacity-70 transition-opacity"
          aria-label={isCompleted ? 'Undo completion' : 'Complete habit'}
        >
          {isCompleted ? (
            <CheckSquare className="h-4 w-4 text-green-500" />
          ) : (
            <Square className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      ) : null}

      {/* Habit name */}
      <span className={`flex-1 text-sm ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
        {habit.name}
      </span>

      {/* Counter badge for multi-completion habits */}
      {target > 1 && (
        <Badge variant={isCompleted ? 'default' : 'secondary'} className="text-xs">
          {completions}/{target}
        </Badge>
      )}

      {/* + button to increment */}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={handleComplete}
        disabled={isCompleted}
        aria-label="Add completion"
      >
        <Plus className="h-3 w-3" />
      </Button>

      {/* Undo button — only shown when completions > 0 */}
      {completions > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleUndo}
          aria-label="Undo completion"
        >
          <Undo2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}

export default function AgendaAllDayRow({ date: _date, dateKey, habits, onComplete, onUndo }: AgendaAllDayRowProps) {
  const [settings] = useAtom(settingsAtom)
  const timezone = settings.system.timezone

  if (habits.length === 0) {
    return (
      <div className="text-xs text-muted-foreground px-2 py-1 italic">No all-day habits</div>
    )
  }

  return (
    <div className="space-y-0.5">
      {habits.map(habit => (
        <HabitRow
          key={habit.id}
          habit={habit}
          dateKey={dateKey}
          timezone={timezone}
          onComplete={onComplete}
          onUndo={onUndo}
        />
      ))}
    </div>
  )
}
