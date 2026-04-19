'use client'

import { useEffect, useState } from 'react'
import { useAtom } from 'jotai'
import { useTranslations } from 'next-intl'
import { weeklyHabitsAtom, weekOffsetAtom, settingsAtom, currentUserIdAtom } from '@/lib/atoms'
import { getCompletionsForDate } from '@/lib/utils'
import { useHabits } from '@/hooks/useHabits'
import AgendaAllDayRow from './AgendaAllDayRow'
import AgendaTimeSlot from './AgendaTimeSlot'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Habit } from '@/lib/types'

const SLOT_HEIGHT_PX = 48
const TOTAL_SLOTS = 48 // 24h × 2 slots per hour
const GUTTER_WIDTH = 56 // px for the hour label column

function hourLabel(slotIndex: number): string | null {
  if (slotIndex % 2 !== 0) return null
  const hour = slotIndex / 2
  return `${String(hour).padStart(2, '0')}:00`
}

export default function WeeklyAgenda() {
  const t = useTranslations('WeeklyAgenda')
  const [weeklyHabits] = useAtom(weeklyHabitsAtom)
  const [weekOffset, setWeekOffset] = useAtom(weekOffsetAtom)
  const [settings] = useAtom(settingsAtom)
  const [currentUserId] = useAtom(currentUserIdAtom)
  const { completeHabit, undoComplete } = useHabits()
  const timezone = settings.system.timezone

  // Mobile single-day view
  const [isMobile, setIsMobile] = useState(false)
  const [activeDayIndex, setActiveDayIndex] = useState(0)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleComplete = async (habit: Habit) => {
    await completeHabit(habit)
  }

  const handleUndo = async (habit: Habit) => {
    await undoComplete(habit)
  }

  // Week label: e.g. "Apr 14–20, 2026"
  const firstDay = weeklyHabits[0]?.date
  const lastDay = weeklyHabits[6]?.date
  const weekLabel = firstDay && lastDay
    ? `${firstDay.toFormat('MMM d')}–${lastDay.toFormat('d, yyyy')}`
    : ''

  const displayedDays = isMobile ? [weeklyHabits[activeDayIndex]] : weeklyHabits

  return (
    <div className="flex flex-col h-full">
      {/* Week navigation header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <Button variant="outline" size="sm" onClick={() => setWeekOffset(wo => wo - 1)}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t('prevWeek')}
        </Button>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm">{weekLabel}</span>
          {weekOffset !== 0 && (
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>
              {t('today')}
            </Button>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => setWeekOffset(wo => wo + 1)}>
          {t('nextWeek')}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Mobile: day switcher tabs */}
      {isMobile && (
        <div className="flex overflow-x-auto gap-1 mb-3 pb-1">
          {weeklyHabits.map((day, i) => (
            <button
              key={day.dateKey}
              onClick={() => setActiveDayIndex(i)}
              className={`flex-shrink-0 px-3 py-1.5 rounded text-xs font-medium transition-colors
                ${activeDayIndex === i ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              <div>{day.date.toFormat('EEE')}</div>
              <div>{day.date.toFormat('d')}</div>
            </button>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        {/* Day column headers — desktop only */}
        {!isMobile && (
          <div
            className="grid sticky top-0 bg-background z-10 border-b"
            style={{ gridTemplateColumns: `${GUTTER_WIDTH}px repeat(7, 1fr)` }}
          >
            {/* Empty gutter header */}
            <div className="border-r" />
            {weeklyHabits.map(day => (
              <div
                key={day.dateKey}
                className="text-center py-2 px-1 border-r last:border-r-0 text-xs font-medium"
              >
                <div className="text-muted-foreground">{day.date.toFormat('EEE')}</div>
                <div className={`font-semibold ${day.date.hasSame(day.date.setZone(timezone).startOf('day'), 'day') ? '' : ''}`}>
                  {day.date.toFormat('d')}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* All-day band */}
        <div
          className="grid border-b"
          style={{ gridTemplateColumns: !isMobile ? `${GUTTER_WIDTH}px repeat(7, 1fr)` : '1fr' }}
        >
          {!isMobile && (
            <div className="border-r py-1 px-1 text-xs text-muted-foreground flex items-start justify-end pr-2 pt-2">
              {t('allDay')}
            </div>
          )}
          {displayedDays.map(day => (
            <div key={day.dateKey} className="border-r last:border-r-0 min-h-[40px] p-1">
              {isMobile && (
                <div className="text-xs text-muted-foreground mb-1">{t('allDay')}</div>
              )}
              <AgendaAllDayRow
                date={day.date}
                dateKey={day.dateKey}
                habits={day.allDay}
                onComplete={handleComplete}
                onUndo={handleUndo}
              />
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div
          className="grid relative"
          style={{ gridTemplateColumns: !isMobile ? `${GUTTER_WIDTH}px repeat(7, 1fr)` : `${GUTTER_WIDTH}px 1fr` }}
        >
          {/* Hour gutter labels */}
          <div className="border-r">
            {Array.from({ length: TOTAL_SLOTS }, (_, i) => (
              <div
                key={i}
                style={{ height: `${SLOT_HEIGHT_PX}px` }}
                className="border-b border-muted/30 flex items-start justify-end pr-1 pt-0.5"
              >
                {hourLabel(i) && (
                  <span className="text-[10px] text-muted-foreground leading-none">{hourLabel(i)}</span>
                )}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {displayedDays.map(day => {
            return (
              <div
                key={day.dateKey}
                className="border-r last:border-r-0 relative"
                style={{ height: `${TOTAL_SLOTS * SLOT_HEIGHT_PX}px` }}
              >
                {/* Slot row backgrounds */}
                {Array.from({ length: TOTAL_SLOTS }, (_, i) => (
                  <div
                    key={i}
                    style={{ height: `${SLOT_HEIGHT_PX}px` }}
                    className="border-b border-muted/20"
                  />
                ))}
                {/* Time-blocked habit blocks */}
                {day.timeBlocked.map(habit => {
                  const completions = getCompletionsForDate({ habit, date: day.dateKey, timezone })
                  const isCompleted = completions >= (habit.targetCompletions || 1)
                  return (
                    <AgendaTimeSlot
                      key={habit.id}
                      habit={habit}
                      dateKey={day.dateKey}
                      onComplete={handleComplete}
                      onUndo={handleUndo}
                      isCompleted={isCompleted}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
