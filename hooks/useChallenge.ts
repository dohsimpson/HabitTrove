import { useAtom } from 'jotai'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  currentChallengeAtom,
  challengeMessagesAtom,
  challengeStatsAtom,
  currentUserAtom,
  settingsAtom,
} from '@/lib/atoms'
import {
  loadChallenge,
  toggleGoalCompletion as toggleGoalAction,
  sendMessage as sendMessageAction,
  loadMessages,
  getChallengeStats,
  addGoal as addGoalAction,
  updateGoal as updateGoalAction,
  deleteGoal as deleteGoalAction,
  updateChallenge as updateChallengeAction,
} from '@/app/actions/challenges'
import { Challenge, ChallengeGoal } from '@/lib/types'
import { toast } from '@/hooks/use-toast'

const CHAT_POLL_INTERVAL = 5000

export function useChallenge(challengeId: string | null) {
  const [challenge, setChallenge] = useAtom(currentChallengeAtom)
  const [messages, setMessages] = useAtom(challengeMessagesAtom)
  const [stats, setStats] = useAtom(challengeStatsAtom)
  const [currentUser] = useAtom(currentUserAtom)
  const [settings] = useAtom(settingsAtom)
  const [loading, setLoading] = useState(false)
  const t = useTranslations('Challenges')
  const tCommon = useTranslations('Common')
  const lastMessageTimestamp = useRef<string | undefined>(undefined)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isOwner = challenge?.ownerId === currentUser?.id
  const isParticipant = challenge?.participants.some(p => p.userId === currentUser?.id) ?? false
  const timezone = settings.system.timezone

  // Load full challenge data
  const loadChallengeData = useCallback(async () => {
    if (!challengeId) return
    setLoading(true)
    try {
      const data = await loadChallenge(challengeId)
      setChallenge(data)
      if (data) {
        setMessages(data.messages)
        lastMessageTimestamp.current = data.messages.length > 0
          ? data.messages[data.messages.length - 1].createdAt
          : undefined
      }
    } catch {
      toast({
        title: tCommon('error'),
        description: t('errorLoadingChallenge'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [challengeId, setChallenge, setMessages, t, tCommon])

  // Load stats
  const refreshStats = useCallback(async () => {
    if (!challengeId) return
    try {
      const data = await getChallengeStats(challengeId)
      setStats(data)
    } catch {
      // Stats are non-critical, don't toast
    }
  }, [challengeId, setStats])

  // Initial load
  useEffect(() => {
    loadChallengeData()
    return () => {
      setChallenge(null)
      setMessages([])
      setStats(null)
    }
  }, [challengeId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load stats after challenge is loaded
  useEffect(() => {
    if (challenge) {
      refreshStats()
    }
  }, [challenge?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Chat polling
  useEffect(() => {
    if (!challengeId || !isParticipant) return

    pollRef.current = setInterval(async () => {
      try {
        const newMessages = await loadMessages(challengeId, lastMessageTimestamp.current)
        if (newMessages.length > 0) {
          setMessages(prev => [...prev, ...newMessages])
          lastMessageTimestamp.current = newMessages[newMessages.length - 1].createdAt
        }
      } catch {
        // Polling failure is non-critical
      }
    }, CHAT_POLL_INTERVAL)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [challengeId, isParticipant, setMessages])

  // ─── Mutations ──────────────────────────────────────────────────────

  const toggleGoal = async (goalId: string): Promise<boolean> => {
    if (!challengeId) return false
    try {
      const updated = await toggleGoalAction(challengeId, goalId, timezone)
      setChallenge(updated)
      await refreshStats()
      return true
    } catch (e) {
      toast({
        title: tCommon('error'),
        description: e instanceof Error ? e.message : t('errorTogglingGoal'),
        variant: 'destructive',
      })
      return false
    }
  }

  const sendMessage = async (text: string): Promise<boolean> => {
    if (!challengeId || !text.trim()) return false
    try {
      const message = await sendMessageAction(challengeId, text)
      setMessages(prev => [...prev, message])
      lastMessageTimestamp.current = message.createdAt
      return true
    } catch {
      toast({
        title: tCommon('error'),
        description: t('errorSendingMessage'),
        variant: 'destructive',
      })
      return false
    }
  }

  const addGoal = async (goal: Omit<ChallengeGoal, 'id' | 'createdAt'>): Promise<boolean> => {
    if (!challengeId) return false
    try {
      const updated = await addGoalAction(challengeId, goal)
      setChallenge(updated)
      toast({ title: t('goalAdded') })
      return true
    } catch {
      toast({
        title: tCommon('error'),
        description: t('errorAddingGoal'),
        variant: 'destructive',
      })
      return false
    }
  }

  const updateGoal = async (goalId: string, updates: Partial<Pick<ChallengeGoal, 'title' | 'description' | 'icon' | 'points' | 'frequency' | 'maxCompletionsPerPeriod'>>): Promise<boolean> => {
    if (!challengeId) return false
    try {
      const updated = await updateGoalAction(challengeId, goalId, updates)
      setChallenge(updated)
      toast({ title: t('goalUpdated') })
      return true
    } catch {
      toast({
        title: tCommon('error'),
        description: t('errorUpdatingGoal'),
        variant: 'destructive',
      })
      return false
    }
  }

  const deleteGoal = async (goalId: string): Promise<boolean> => {
    if (!challengeId) return false
    try {
      const updated = await deleteGoalAction(challengeId, goalId)
      setChallenge(updated)
      toast({ title: t('goalDeleted') })
      return true
    } catch {
      toast({
        title: tCommon('error'),
        description: t('errorDeletingGoal'),
        variant: 'destructive',
      })
      return false
    }
  }

  const updateChallenge = async (updates: Partial<Pick<Challenge, 'name' | 'description' | 'startAt' | 'endAt' | 'maxPlayers' | 'status' | 'coverImage'>>): Promise<boolean> => {
    if (!challengeId) return false
    try {
      const updated = await updateChallengeAction(challengeId, updates)
      if (updated) setChallenge(updated)
      toast({ title: t('challengeUpdated') })
      return true
    } catch {
      toast({
        title: tCommon('error'),
        description: t('errorUpdatingChallenge'),
        variant: 'destructive',
      })
      return false
    }
  }

  return {
    challenge,
    messages,
    stats,
    loading,
    isOwner,
    isParticipant,
    toggleGoal,
    sendMessage,
    addGoal,
    updateGoal,
    deleteGoal,
    updateChallenge,
    refreshStats,
    reload: loadChallengeData,
  }
}
