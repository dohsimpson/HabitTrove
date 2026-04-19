'use client'

import { useAtom } from 'jotai'
import { useTranslations } from 'next-intl'
import { Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usersAtom, currentUserAtom } from '@/lib/atoms'
import { ChallengeStats, ChallengeParticipant } from '@/lib/types'

interface LeaderboardProps {
  stats: ChallengeStats | null
  participants: ChallengeParticipant[]
}

export default function Leaderboard({ stats, participants }: LeaderboardProps) {
  const t = useTranslations('Challenges')
  const [users] = useAtom(usersAtom)
  const [currentUser] = useAtom(currentUserAtom)

  if (!stats || stats.scores.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          {t('noScoresYet')}
        </CardContent>
      </Card>
    )
  }

  const sorted = [...stats.scores].sort((a, b) => b.totalScore - a.totalScore)

  const getUserName = (userId: string): string => {
    const user = users.users.find(u => u.id === userId)
    return user?.username ?? userId
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4" />
          {t('tabLeaderboard')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="grid grid-cols-[2rem_1fr_4rem] gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
            <span>{t('rank')}</span>
            <span>{t('player')}</span>
            <span className="text-right">{t('score')}</span>
          </div>
          {sorted.map((entry, i) => {
            const isMe = entry.userId === currentUser?.id
            return (
              <div
                key={entry.userId}
                className={`grid grid-cols-[2rem_1fr_4rem] gap-2 px-2 py-2 rounded-md text-sm ${
                  isMe ? 'bg-primary/10 font-medium' : ''
                }`}
              >
                <span className="text-muted-foreground">{i + 1}</span>
                <span className="truncate">
                  {getUserName(entry.userId)}
                  {isMe && (
                    <span className="ml-1 text-xs text-muted-foreground">{t('you')}</span>
                  )}
                </span>
                <span className="text-right font-mono">{entry.totalScore}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
