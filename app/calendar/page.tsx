import HabitCalendar from '@/components/HabitCalendar'

export default function CalendarPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        {/* <ViewToggle /> */}
      </div>
      <HabitCalendar />
    </div>
  )
}

