'use client'

import { useTranslations } from 'next-intl'
import { useAtom } from 'jotai'
import { settingsAtom, currentUserAtom } from '@/lib/atoms'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChallengeGoal, GoalCompletion, ChallengeGoalFrequency } from '@/lib/types'
import { DateTime } from 'luxon'

interface ChallengeGoalListProps {
  goals: ChallengeGoal[]
  completions: GoalCompletion[]
  onToggle: (goalId: string) => Promise<boolean>
  disabled?: boolean
}

function getPeriodKey(frequency: ChallengeGoalFrequency, timezone: string): string {
  const now = DateTime.now().setZone(timezone)
  switch (frequency) {
    case 'daily':
      return `daily-${now.toFormat('yyyy-MM-dd')}`
    case 'weekly':
      return `weekly-${now.toFormat("yyyy-'w'WW")}`
    case 'monthly':
      return `monthly-${now.toFormat('yyyy-MM')}`
    case 'once':
      return 'once'
  }
}

const frequencyKeys: Record<ChallengeGoalFrequency, string> = {
  daily: 'daily',
  weekly: 'weekly',
  monthly: 'monthly',
  once: 'once',
}

export default function ChallengeGoalList({ goals, completions, onToggle, disabled }: ChallengeGoalListProps) {
  const t = useTranslations('Challenges')
  const [settings] = useAtom(settingsAtom)
  const [currentUser] = useAtom(currentUserAtom)
  const timezone = settings.system.timezone

  const getCompletionCount = (goalId: string): number => {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return 0
    const periodKey = getPeriodKey(goal.frequency, timezone)
    return completions.filter(
      c => c.goalId === goalId && c.userId === currentUser?.id && c.periodKey === periodKey
    ).length
  }

  const isGoalCompleted = (goal: ChallengeGoal): boolean => {
    return getCompletionCount(goal.id) >= goal.maxCompletionsPerPeriod
  }

  return (
    <div className="space-y-3">
      {goals.map((goal) => {
        const completed = isGoalCompleted(goal)
        const count = getCompletionCount(goal.id)

        return (
          <Card key={goal.id} className={completed ? 'opacity-75' : ''}>
            <CardContent className="p-4 flex items-center gap-3">
              <span className="text-2xl flex-shrink-0">{goal.icon || '🎯'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium truncate">{goal.title}</h4>
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    {t(frequencyKeys[goal.frequency])}
                  </Badge>
                </div>
                {goal.description && (
                  <p className="text-sm text-muted-foreground truncate">{goal.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {t('points', { count: goal.points })}
                  {goal.maxCompletionsPerPeriod > 1 && ` · ${count}/${goal.maxCompletionsPerPeriod}`}
                </p>
              </div>
              <Button
                size="sm"
                variant={completed ? 'secondary' : 'default'}
                onClick={() => onToggle(goal.id)}
                disabled={disabled}
                className="flex-shrink-0"
              >
                {completed ? (
                  <Check className="h-4 w-4" />
                ) : (
                  t('completeGoal')
                )}
              </Button>
            </CardContent>
          </Card>
        )
      })}
      {goals.length === 0 && (
        <p className="text-center text-muted-foreground py-8">{t('noGoalsYet')}</p>
      )}
    </div>
  )
}
