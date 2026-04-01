'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Copy, Users, Calendar, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ChallengeGoalList from '@/components/challenges/ChallengeGoalList'
import Leaderboard from '@/components/challenges/Leaderboard'
import ChallengeChat from '@/components/challenges/ChallengeChat'
import ChallengeStatsView from '@/components/challenges/ChallengeStats'
import { useChallenge } from '@/hooks/useChallenge'
import { toast } from '@/hooks/use-toast'
import { ChallengeGoalFrequency } from '@/lib/types'

interface ChallengeDetailProps {
  challengeId: string
}

type Tab = 'goals' | 'leaderboard' | 'chat' | 'stats'

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

export default function ChallengeDetail({ challengeId }: ChallengeDetailProps) {
  const t = useTranslations('Challenges')
  const router = useRouter()
  const {
    challenge,
    messages,
    stats,
    loading,
    isOwner,
    isParticipant,
    toggleGoal,
    addGoal,
    sendMessage,
  } = useChallenge(challengeId)

  const [activeTab, setActiveTab] = useState<Tab>('goals')
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    icon: '',
    points: 10,
    frequency: 'daily' as ChallengeGoalFrequency,
    maxCompletionsPerPeriod: 1,
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">{t('loading')}</p>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-muted-foreground">{t('notFound')}</p>
        <Button variant="outline" onClick={() => router.push('/challenges')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t('backToList')}
        </Button>
      </div>
    )
  }

  const copyJoinCode = () => {
    navigator.clipboard.writeText(challenge.joinCode)
    toast({ title: t('joinCodeCopied') })
  }

  const handleAddGoal = async () => {
    if (!newGoal.title.trim()) return
    const success = await addGoal({
      ...newGoal,
      title: newGoal.title.trim(),
      description: newGoal.description.trim(),
    })
    if (success) {
      setNewGoal({
        title: '',
        description: '',
        icon: '',
        points: 10,
        frequency: 'daily',
        maxCompletionsPerPeriod: 1,
      })
      setShowAddGoal(false)
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'goals', label: t('tabGoals') },
    { key: 'leaderboard', label: t('tabLeaderboard') },
    { key: 'chat', label: t('tabChat') },
    { key: 'stats', label: t('tabStats') },
  ]

  const startDate = new Date(challenge.startAt).toLocaleDateString()
  const endDate = new Date(challenge.endAt).toLocaleDateString()

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/challenges')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold truncate">{challenge.name}</h1>
            <Badge variant="outline" className={statusColors[challenge.status] || ''}>
              {t(challenge.status)}
            </Badge>
          </div>
          {challenge.description && (
            <p className="text-sm text-muted-foreground truncate">{challenge.description}</p>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          {challenge.participants.length}/{challenge.maxPlayers}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {startDate} - {endDate}
        </span>
        <button
          onClick={copyJoinCode}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <Copy className="h-4 w-4" />
          {challenge.joinCode}
        </button>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          {isOwner && (
            <Button size="sm" variant="outline" onClick={() => setShowAddGoal(true)}>
              <Plus className="h-4 w-4 mr-1" />
              {t('addGoalButton')}
            </Button>
          )}
          <ChallengeGoalList
            goals={challenge.goals}
            completions={challenge.completions}
            onToggle={toggleGoal}
            disabled={!isParticipant || challenge.status !== 'active'}
          />
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <Leaderboard stats={stats} participants={challenge.participants} />
      )}

      {activeTab === 'chat' && (
        <ChallengeChat
          messages={messages}
          onSend={sendMessage}
          disabled={!isParticipant || challenge.status !== 'active'}
        />
      )}

      {activeTab === 'stats' && (
        <ChallengeStatsView stats={stats} goals={challenge.goals} />
      )}

      {/* Add Goal Dialog */}
      <Dialog open={showAddGoal} onOpenChange={setShowAddGoal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addGoalTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-[3rem_1fr] gap-2">
              <div className="space-y-1">
                <Label className="text-xs">{t('iconLabel')}</Label>
                <Input
                  value={newGoal.icon}
                  onChange={(e) => setNewGoal(g => ({ ...g, icon: e.target.value }))}
                  placeholder="🎯"
                  className="text-center"
                  maxLength={2}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('goalTitleLabel')}</Label>
                <Input
                  value={newGoal.title}
                  onChange={(e) => setNewGoal(g => ({ ...g, title: e.target.value }))}
                  placeholder={t('goalTitlePlaceholder')}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('goalDescriptionLabel')}</Label>
              <Input
                value={newGoal.description}
                onChange={(e) => setNewGoal(g => ({ ...g, description: e.target.value }))}
                placeholder={t('goalDescriptionPlaceholder')}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">{t('frequencyLabel')}</Label>
                <Select
                  value={newGoal.frequency}
                  onValueChange={(v) => setNewGoal(g => ({ ...g, frequency: v as ChallengeGoalFrequency }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">{t('daily')}</SelectItem>
                    <SelectItem value="weekly">{t('weekly')}</SelectItem>
                    <SelectItem value="monthly">{t('monthly')}</SelectItem>
                    <SelectItem value="once">{t('once')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('pointsLabel')}</Label>
                <Input
                  type="number"
                  min={1}
                  value={newGoal.points}
                  onChange={(e) => setNewGoal(g => ({ ...g, points: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('maxPerPeriodLabel')}</Label>
                <Input
                  type="number"
                  min={1}
                  value={newGoal.maxCompletionsPerPeriod}
                  onChange={(e) => setNewGoal(g => ({ ...g, maxCompletionsPerPeriod: Number(e.target.value) }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddGoal(false)}>
              {t('cancelButton')}
            </Button>
            <Button onClick={handleAddGoal} disabled={!newGoal.title.trim()}>
              {t('addGoalButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
