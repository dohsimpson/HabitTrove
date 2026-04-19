'use client'

import { Habit } from '@/lib/types'
import { CheckSquare, Square } from 'lucide-react'

interface AgendaTimeSlotProps {
  habit: Habit
  dateKey: string
  onComplete: (habit: Habit) => void
  onUndo: (habit: Habit) => void
  isCompleted: boolean
}

const SLOT_HEIGHT_PX = 48 // height of a 30-minute slot in pixels

function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map(Number)
  return { hour: h ?? 0, minute: m ?? 0 }
}

function calcTopOffset(startTime: string): number {
  const { hour, minute } = parseTime(startTime)
  const totalMinutes = hour * 60 + minute
  return (totalMinutes / 30) * SLOT_HEIGHT_PX
}

function calcHeight(startTime: string, endTime: string): number {
  const start = parseTime(startTime)
  const end = parseTime(endTime)
  const durationMinutes = (end.hour * 60 + end.minute) - (start.hour * 60 + start.minute)
  const height = (durationMinutes / 30) * SLOT_HEIGHT_PX
  return Math.max(height, SLOT_HEIGHT_PX)
}

export default function AgendaTimeSlot({ habit, onComplete, onUndo, isCompleted }: AgendaTimeSlotProps) {
  const startTime = habit.startTime ?? '00:00'
  const endTime = habit.endTime ?? '00:30'

  const top = calcTopOffset(startTime)
  const height = calcHeight(startTime, endTime)

  const handleToggle = () => {
    if (isCompleted) {
      onUndo(habit)
    } else {
      onComplete(habit)
    }
  }

  return (
    <div
      className={`absolute left-0 right-1 rounded px-1 py-0.5 text-xs overflow-hidden cursor-pointer border transition-colors
        ${isCompleted
          ? 'bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300'
          : 'bg-primary/10 border-primary/30 hover:bg-primary/20'
        }`}
      style={{ top: `${top}px`, height: `${height}px` }}
      onClick={handleToggle}
      title={`${habit.name} ${startTime}–${endTime}`}
    >
      <div className="flex items-start gap-1 h-full">
        <button
          className="flex-shrink-0 mt-0.5 hover:opacity-70 transition-opacity"
          onClick={(e) => { e.stopPropagation(); handleToggle() }}
          aria-label={isCompleted ? 'Undo completion' : 'Complete habit'}
        >
          {isCompleted ? (
            <CheckSquare className="h-3 w-3 text-green-500" />
          ) : (
            <Square className="h-3 w-3" />
          )}
        </button>
        <div className="flex flex-col overflow-hidden">
          <span className="font-medium truncate leading-tight">{habit.name}</span>
          <span className="text-muted-foreground opacity-80 leading-tight">{startTime}–{endTime}</span>
        </div>
      </div>
    </div>
  )
}
