'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Plus } from 'lucide-react'
import { useChallenges } from '@/hooks/useChallenges'
import { addGoal } from '@/app/actions/challenges'
import { ChallengeGoalFrequency } from '@/lib/types'

interface CreateChallengeWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface TempGoal {
  title: string
  description: string
  icon: string
  points: number
  frequency: ChallengeGoalFrequency
  maxCompletionsPerPeriod: number
}

const defaultGoal: TempGoal = {
  title: '',
  description: '',
  icon: '',
  points: 10,
  frequency: 'daily',
  maxCompletionsPerPeriod: 1,
}

export default function CreateChallengeWizard({ open, onOpenChange }: CreateChallengeWizardProps) {
  const t = useTranslations('Challenges')
  const router = useRouter()
  const { createChallenge } = useChallenges()

  const [step, setStep] = useState(0)
  const [creating, setCreating] = useState(false)

  // Step 1: Details
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [maxPlayers, setMaxPlayers] = useState(10)

  // Step 2: Goals
  const [goals, setGoals] = useState<TempGoal[]>([])
  const [editingGoal, setEditingGoal] = useState<TempGoal>({ ...defaultGoal })

  const reset = () => {
    setStep(0)
    setName('')
    setDescription('')
    setStartAt('')
    setEndAt('')
    setMaxPlayers(10)
    setGoals([])
    setEditingGoal({ ...defaultGoal })
    setCreating(false)
  }

  const handleClose = (open: boolean) => {
    if (!open) reset()
    onOpenChange(open)
  }

  const canProceedStep0 = name.trim() && startAt && endAt && endAt >= startAt
  const canProceedStep1 = true // Goals are optional

  const addTempGoal = () => {
    if (!editingGoal.title.trim()) return
    setGoals(prev => [...prev, { ...editingGoal }])
    setEditingGoal({ ...defaultGoal })
  }

  const removeTempGoal = (index: number) => {
    setGoals(prev => prev.filter((_, i) => i !== index))
  }

  const handleCreate = async () => {
    setCreating(true)
    const challengeId = await createChallenge({
      name: name.trim(),
      description: description.trim(),
      startAt,
      endAt,
      maxPlayers,
    })

    if (challengeId) {
      // Add goals sequentially
      for (const goal of goals) {
        await addGoal(challengeId, {
          title: goal.title,
          description: goal.description,
          icon: goal.icon || '',
          points: goal.points,
          frequency: goal.frequency,
          maxCompletionsPerPeriod: goal.maxCompletionsPerPeriod,
        })
      }
      reset()
      onOpenChange(false)
      router.push(`/challenges/${challengeId}`)
    } else {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('createTitle')} — {t(`wizardStep${step}`)}
          </DialogTitle>
        </DialogHeader>

        {/* Step 0: Details */}
        {step === 0 && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="challengeName">{t('nameLabel')}</Label>
              <Input
                id="challengeName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('namePlaceholder')}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="challengeDesc">{t('descriptionLabel')}</Label>
              <Input
                id="challengeDesc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('descriptionPlaceholder')}
                maxLength={500}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startAt">{t('startDateLabel')}</Label>
                <Input
                  id="startAt"
                  type="date"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endAt">{t('endDateLabel')}</Label>
                <Input
                  id="endAt"
                  type="date"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxPlayers">{t('maxPlayersLabel')}</Label>
              <Input
                id="maxPlayers"
                type="number"
                min={2}
                max={100}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
              />
            </div>
          </div>
        )}

        {/* Step 1: Goals */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            {goals.length > 0 && (
              <div className="space-y-2">
                {goals.map((goal, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 border rounded-md">
                    <span className="text-lg">{goal.icon || '🎯'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{goal.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {t(goal.frequency)} · {goal.points} {t('pts')}
                      </p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => removeTempGoal(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="border rounded-md p-3 space-y-3">
              <p className="text-sm font-medium">{t('addGoalTitle')}</p>
              <div className="grid grid-cols-[3rem_1fr] gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">{t('iconLabel')}</Label>
                  <Input
                    value={editingGoal.icon}
                    onChange={(e) => setEditingGoal(g => ({ ...g, icon: e.target.value }))}
                    placeholder="🎯"
                    className="text-center"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('goalTitleLabel')}</Label>
                  <Input
                    value={editingGoal.title}
                    onChange={(e) => setEditingGoal(g => ({ ...g, title: e.target.value }))}
                    placeholder={t('goalTitlePlaceholder')}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">{t('frequencyLabel')}</Label>
                  <Select
                    value={editingGoal.frequency}
                    onValueChange={(v) => setEditingGoal(g => ({ ...g, frequency: v as ChallengeGoalFrequency }))}
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
                    value={editingGoal.points}
                    onChange={(e) => setEditingGoal(g => ({ ...g, points: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('maxPerPeriodLabel')}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editingGoal.maxCompletionsPerPeriod}
                    onChange={(e) => setEditingGoal(g => ({ ...g, maxCompletionsPerPeriod: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={addTempGoal}
                disabled={!editingGoal.title.trim()}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('addGoalButton')}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t('goalsOptionalHint')}</p>
          </div>
        )}

        {/* Step 2: Review */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t('nameLabel')}</p>
              <p className="font-medium">{name}</p>
            </div>
            {description && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('descriptionLabel')}</p>
                <p className="text-sm">{description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('startDateLabel')}</p>
                <p className="text-sm">{new Date(startAt).toLocaleDateString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('endDateLabel')}</p>
                <p className="text-sm">{new Date(endAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t('maxPlayersLabel')}</p>
              <p className="text-sm">{maxPlayers}</p>
            </div>
            {goals.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('goalsLabel')} ({goals.length})</p>
                <div className="space-y-1">
                  {goals.map((goal, i) => (
                    <p key={i} className="text-sm">
                      {goal.icon || '🎯'} {goal.title} — {t(goal.frequency)}, {goal.points} {t('pts')}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={creating}>
              {t('backButton')}
            </Button>
          )}
          {step === 0 && (
            <Button variant="outline" onClick={() => handleClose(false)}>
              {t('cancelButton')}
            </Button>
          )}
          {step < 2 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 0 ? !canProceedStep0 : !canProceedStep1}
            >
              {t('nextButton')}
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? t('creatingButton') : t('createButton')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
