import { Badge } from "@/components/ui/badge"
import { useAtom } from 'jotai'
import { completedHabitsMapAtom, habitsAtom, habitsByDateFamily } from '@/lib/atoms'
import { getTodayInTimezone } from '@/lib/utils'
// import { useHabits } from '@/hooks/useHabits' // Not used
import { settingsAtom } from '@/lib/atoms'
import { useTranslations } from 'next-intl'

interface CompletionCountBadgeProps {
  type: 'habits' | 'tasks'
  date?: string
}

export default function CompletionCountBadge({
  type,
  date
}: CompletionCountBadgeProps) {
  const t = useTranslations('CompletionCountBadge');
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
      {t('countCompleted', { completedCount, totalCount })}
    </Badge>
  )
}
