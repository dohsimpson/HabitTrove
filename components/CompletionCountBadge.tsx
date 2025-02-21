import { Badge } from "@/components/ui/badge"
import { useAtom } from 'jotai'
import { completedHabitsMapAtom, habitsAtom, habitsByDateFamily } from '@/lib/atoms'
import { getTodayInTimezone } from '@/lib/utils'
import { useHabits } from '@/hooks/useHabits'
import { settingsAtom } from '@/lib/atoms'

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
