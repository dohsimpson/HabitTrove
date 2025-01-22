import Layout from '@/components/Layout'
import HabitList from '@/components/HabitList'
import { ViewToggle } from '@/components/ViewToggle'

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

