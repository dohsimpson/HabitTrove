'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, UserPlus, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import EmptyState from '@/components/EmptyState'
import ChallengeCard from '@/components/challenges/ChallengeCard'
import CreateChallengeWizard from '@/components/challenges/CreateChallengeWizard'
import JoinChallengeModal from '@/components/challenges/JoinChallengeModal'
import { useChallenges } from '@/hooks/useChallenges'

export default function ChallengeList() {
  const t = useTranslations('Challenges')
  const { challenges, joinByCode } = useChallenges()
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowJoin(true)}>
            <UserPlus className="h-4 w-4 mr-1" />
            {t('joinButton')}
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {t('createButton')}
          </Button>
        </div>
      </div>

      {challenges.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title={t('emptyTitle')}
          description={t('emptyDescription')}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {challenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      )}

      <CreateChallengeWizard open={showCreate} onOpenChange={setShowCreate} />
      <JoinChallengeModal open={showJoin} onOpenChange={setShowJoin} onJoin={joinByCode} />
    </div>
  )
}
