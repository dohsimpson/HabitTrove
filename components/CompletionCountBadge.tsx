import { Badge } from "@/components/ui/badge"
import { completedHabitsMapAtom, habitsByDateFamily, settingsAtom } from '@/lib/atoms'
import { getTodayInTimezone } from '@/lib/utils'
import { useAtom } from 'jotai'

interface CompletionCountBadgeProps {
  type: 'habits' | 'tasks'
  date?: string
}

export default function CompletionCountBadge({
  type,
  date
}: CompletionCountBadgeProps) {
  const [settings] = useAtom(settingsAtom)
  const [completedHabitsMap] = useAtom(completedHabitsMapAtom)
  const targetDate = date || getTodayInTimezone(settings.system.timezone)
  const [dueHabits] = useAtom(habitsByDateFamily(targetDate))

  const completedCount = completedHabitsMap.get(targetDate)?.filter(h => 
    type === 'tasks' ? h.isTask : !h.isTask
  ).length || 0

  const totalCount = dueHabits.filter(h => 
    type === 'tasks' ? h.isTask : !h.isTask
  ).length

  return (
    <Badge variant="secondary">
      {`${completedCount}/${totalCount} Completed`}
    </Badge>
  )
}
