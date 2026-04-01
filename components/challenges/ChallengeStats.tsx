'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChallengeStats as ChallengeStatsType, ChallengeGoal } from '@/lib/types'

interface ChallengeStatsProps {
  stats: ChallengeStatsType | null
  goals: ChallengeGoal[]
}

const COLORS = [
  'hsl(var(--primary))',
  '#22c55e',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
]

export default function ChallengeStatsView({ stats, goals }: ChallengeStatsProps) {
  const t = useTranslations('Challenges')

  const goalNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const g of goals) {
      map[g.id] = g.icon ? `${g.icon} ${g.title}` : g.title
    }
    return map
  }, [goals])

  const userChartData = useMemo(() => {
    if (!stats || stats.userDailyPoints.length === 0) return []
    const dayMap = new Map<string, Record<string, number>>()
    for (const dp of stats.userDailyPoints) {
      if (!dayMap.has(dp.day)) dayMap.set(dp.day, {})
      const entry = dayMap.get(dp.day)!
      entry[dp.goalId] = (entry[dp.goalId] ?? 0) + dp.points
    }
    return Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, goalPoints]) => ({
        day: day.substring(5), // MM-DD
        ...goalPoints,
      }))
  }, [stats])

  const groupChartData = useMemo(() => {
    if (!stats || stats.groupDailyPoints.length === 0) return []
    const dayMap = new Map<string, Record<string, number>>()
    for (const dp of stats.groupDailyPoints) {
      if (!dayMap.has(dp.day)) dayMap.set(dp.day, {})
      const entry = dayMap.get(dp.day)!
      entry[dp.goalId] = (entry[dp.goalId] ?? 0) + dp.points
    }
    return Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, goalPoints]) => ({
        day: day.substring(5),
        ...goalPoints,
      }))
  }, [stats])

  if (!stats || (stats.userDailyPoints.length === 0 && stats.groupDailyPoints.length === 0)) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          {t('noStatsYet')}
        </CardContent>
      </Card>
    )
  }

  const goalIds = goals.map(g => g.id)

  return (
    <div className="space-y-4">
      {userChartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('yourPoints')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={userChartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend formatter={(value) => goalNameMap[value] ?? value} />
                {goalIds.map((gid, i) => (
                  <Bar
                    key={gid}
                    dataKey={gid}
                    name={gid}
                    stackId="stack"
                    fill={COLORS[i % COLORS.length]}
                    radius={i === goalIds.length - 1 ? [2, 2, 0, 0] : undefined}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {groupChartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('groupPoints')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={groupChartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend formatter={(value) => goalNameMap[value] ?? value} />
                {goalIds.map((gid, i) => (
                  <Bar
                    key={gid}
                    dataKey={gid}
                    name={gid}
                    stackId="stack"
                    fill={COLORS[i % COLORS.length]}
                    radius={i === goalIds.length - 1 ? [2, 2, 0, 0] : undefined}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
