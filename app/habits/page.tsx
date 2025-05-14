import HabitList from '@/components/HabitList'

export default function HabitsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        {/* <ViewToggle /> */}
      </div>
      <HabitList />
    </div>
  )
}

