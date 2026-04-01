'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Users, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChallengeIndexEntry } from '@/lib/types'

interface ChallengeCardProps {
  challenge: ChallengeIndexEntry
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

export default function ChallengeCard({ challenge }: ChallengeCardProps) {
  const t = useTranslations('Challenges')

  const startDate = new Date(challenge.startAt).toLocaleDateString()
  const endDate = new Date(challenge.endAt).toLocaleDateString()

  return (
    <Link href={`/challenges/${challenge.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base truncate">{challenge.name}</h3>
            <Badge variant="outline" className={statusColors[challenge.status] || ''}>
              {t(challenge.status)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {t('ownedBy', { name: challenge.ownerName })}
          </p>
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {challenge.participantCount}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {startDate} - {endDate}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
