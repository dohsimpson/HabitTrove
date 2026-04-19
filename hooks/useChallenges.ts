import { useAtom } from 'jotai'
import { useTranslations } from 'next-intl'
import { challengeIndexAtom, activeChallengesAtom, currentUserAtom } from '@/lib/atoms'
import {
  loadChallengesIndexForUser,
  createChallenge as createChallengeAction,
  joinChallenge as joinChallengeAction,
  leaveChallenge as leaveChallengeAction,
  deleteChallenge as deleteChallengeAction,
} from '@/app/actions/challenges'
import { ChallengeGoal } from '@/lib/types'
import { toast } from '@/hooks/use-toast'

export function useChallenges() {
  const [challengeIndex, setChallengeIndex] = useAtom(challengeIndexAtom)
  const [activeChallenges] = useAtom(activeChallengesAtom)
  const [currentUser] = useAtom(currentUserAtom)
  const t = useTranslations('Challenges')
  const tCommon = useTranslations('Common')

  const refreshIndex = async () => {
    try {
      const index = await loadChallengesIndexForUser()
      setChallengeIndex(index)
    } catch {
      toast({
        title: tCommon('error'),
        description: t('errorLoadingChallenges'),
        variant: 'destructive',
      })
    }
  }

  const createChallenge = async (data: {
    name: string
    description: string
    startAt: string
    endAt: string
    maxPlayers: number
    goals?: Omit<ChallengeGoal, 'id' | 'createdAt'>[]
  }): Promise<string | null> => {
    if (!currentUser) {
      toast({
        title: tCommon('authenticationRequiredTitle'),
        description: tCommon('authenticationRequiredDescription'),
        variant: 'destructive',
      })
      return null
    }

    try {
      const challenge = await createChallengeAction({ ...data, goals: data.goals ?? [] })
      await refreshIndex()
      toast({ title: t('challengeCreated'), description: challenge.name })
      return challenge.id
    } catch {
      toast({
        title: tCommon('error'),
        description: t('errorCreatingChallenge'),
        variant: 'destructive',
      })
      return null
    }
  }

  const joinByCode = async (joinCode: string): Promise<boolean> => {
    if (!currentUser) {
      toast({
        title: tCommon('authenticationRequiredTitle'),
        description: tCommon('authenticationRequiredDescription'),
        variant: 'destructive',
      })
      return false
    }

    try {
      const challenge = await joinChallengeAction(joinCode)
      if (!challenge) {
        toast({
          title: tCommon('error'),
          description: t('invalidJoinCode'),
          variant: 'destructive',
        })
        return false
      }
      await refreshIndex()
      toast({ title: t('challengeJoined'), description: challenge.name })
      return true
    } catch {
      toast({
        title: tCommon('error'),
        description: t('errorJoiningChallenge'),
        variant: 'destructive',
      })
      return false
    }
  }

  const leaveChallenge = async (id: string): Promise<boolean> => {
    try {
      await leaveChallengeAction(id)
      await refreshIndex()
      toast({ title: t('challengeLeft') })
      return true
    } catch {
      toast({
        title: tCommon('error'),
        description: t('errorLeavingChallenge'),
        variant: 'destructive',
      })
      return false
    }
  }

  const deleteChallenge = async (id: string): Promise<boolean> => {
    try {
      await deleteChallengeAction(id)
      await refreshIndex()
      toast({ title: t('challengeDeleted') })
      return true
    } catch {
      toast({
        title: tCommon('error'),
        description: t('errorDeletingChallenge'),
        variant: 'destructive',
      })
      return false
    }
  }

  return {
    challenges: challengeIndex.challenges,
    activeChallenges,
    createChallenge,
    joinByCode,
    leaveChallenge,
    deleteChallenge,
    refreshIndex,
  }
}
