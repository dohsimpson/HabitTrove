'use client'

import { useAtom } from 'jotai'
import { browserSettingsAtom } from '@/lib/atoms'
import HabitCalendar from '@/components/HabitCalendar'
import WeeklyAgenda from '@/components/WeeklyAgenda'
import { Button } from '@/components/ui/button'

export default function CalendarPage() {
  const [browserSettings, setBrowserSettings] = useAtom(browserSettingsAtom)
  const calendarView = browserSettings.calendarView

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <div className="flex gap-1 border rounded-md p-0.5">
          <Button
            variant={calendarView === 'month' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBrowserSettings(prev => ({ ...prev, calendarView: 'month' }))}
          >
            Month
          </Button>
          <Button
            variant={calendarView === 'week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBrowserSettings(prev => ({ ...prev, calendarView: 'week' }))}
          >
            Week
          </Button>
        </div>
      </div>
      {calendarView === 'week' ? <WeeklyAgenda /> : <HabitCalendar />}
    </div>
  )
}
