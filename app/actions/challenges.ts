'use server'

import fs from 'fs/promises'
import path from 'path'
import {
  Challenge,
  ChallengeGoal,
  ChallengeIndex,
  ChallengeIndexEntry,
  ChallengeMessage,
  ChallengeStats,
  ChallengeScoreEntry,
  ChallengeGoalScoreEntry,
  ChallengePeriodCount,
  ChallengeDailyPoints,
  GoalCompletion,
  getDefaultChallengeIndex,
} from '@/lib/types'
import { uuid, d2t, getNow } from '@/lib/utils'
import { getCurrentUser } from '@/lib/server-helpers'
import { loadUsersPublicData } from '@/app/actions/data'
import { DateTime } from 'luxon'

// ─── File I/O helpers ────────────────────────────────────────────────

const CHALLENGES_DIR = () => path.join(process.cwd(), 'data', 'challenges')
const INDEX_PATH = () => path.join(CHALLENGES_DIR(), 'index.json')
const challengePath = (id: string) => path.join(CHALLENGES_DIR(), `${id}.json`)

async function ensureChallengesDir() {
  await fs.mkdir(CHALLENGES_DIR(), { recursive: true })
}

async function atomicWrite(filePath: string, data: unknown) {
  const tmpPath = path.join(path.dirname(filePath), `.tmp-${uuid()}.json`)
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2))
  await fs.rename(tmpPath, filePath)
}

async function readIndex(): Promise<ChallengeIndex> {
  try {
    const raw = await fs.readFile(INDEX_PATH(), 'utf8')
    return JSON.parse(raw) as ChallengeIndex
  } catch {
    return getDefaultChallengeIndex()
  }
}

async function writeIndex(index: ChallengeIndex) {
  await ensureChallengesDir()
  await atomicWrite(INDEX_PATH(), index)
}

async function readChallenge(id: string): Promise<Challenge | null> {
  try {
    const raw = await fs.readFile(challengePath(id), 'utf8')
    return JSON.parse(raw) as Challenge
  } catch {
    return null
  }
}

async function writeChallenge(challenge: Challenge) {
  await ensureChallengesDir()
  await atomicWrite(challengePath(challenge.id), challenge)
}

function buildIndexEntry(challenge: Challenge, ownerName: string): ChallengeIndexEntry {
  return {
    id: challenge.id,
    name: challenge.name,
    status: challenge.status,
    joinCode: challenge.joinCode,
    ownerName,
    ownerId: challenge.ownerId,
    participantCount: challenge.participants.length,
    startAt: challenge.startAt,
    endAt: challenge.endAt,
  }
}

async function syncIndex(challenge: Challenge) {
  const index = await readIndex()
  const users = await loadUsersPublicData()
  const owner = users.users.find(u => u.id === challenge.ownerId)
  const entry = buildIndexEntry(challenge, owner?.username ?? 'Unknown')

  const existing = index.challenges.findIndex(c => c.id === challenge.id)
  if (existing >= 0) {
    index.challenges[existing] = entry
  } else {
    index.challenges.push(entry)
  }
  await writeIndex(index)
}

function generateJoinCode(): string {
  return uuid().substring(0, 8)
}

// ─── Period key helpers ──────────────────────────────────────────────

function getPeriodKey(frequency: string, timezone: string): string {
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
    default:
      return `daily-${now.toFormat('yyyy-MM-dd')}`
  }
}

// ─── Exported server actions ─────────────────────────────────────────

export async function loadChallengesIndex(): Promise<ChallengeIndex> {
  const user = await getCurrentUser()
  if (!user) return getDefaultChallengeIndex()

  await ensureChallengesDir()
  const index = await readIndex()

  if (user.isAdmin) return index

  return {
    challenges: index.challenges.filter(c =>
      c.ownerId === user.id ||
      // Check participation by loading each challenge (or storing participant IDs in index)
      // For efficiency, we also check ownerId. Full participant check requires loading challenge.
      true // We'll filter by participation below
    ),
  }
}

export async function loadChallengesIndexForUser(): Promise<ChallengeIndex> {
  const user = await getCurrentUser()
  if (!user) return getDefaultChallengeIndex()

  await ensureChallengesDir()
  const index = await readIndex()

  if (user.isAdmin) return index

  // Load each challenge to check participation
  const userChallenges: ChallengeIndexEntry[] = []
  for (const entry of index.challenges) {
    const challenge = await readChallenge(entry.id)
    if (!challenge) continue
    const isParticipant = challenge.participants.some(p => p.userId === user.id)
    const isOwner = challenge.ownerId === user.id
    if (isParticipant || isOwner) {
      userChallenges.push(entry)
    }
  }

  return { challenges: userChallenges }
}

export async function loadChallenge(id: string): Promise<Challenge | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const challenge = await readChallenge(id)
  if (!challenge) return null

  // Auth check: must be participant or owner or admin
  if (!user.isAdmin) {
    const isParticipant = challenge.participants.some(p => p.userId === user.id)
    const isOwner = challenge.ownerId === user.id
    if (!isParticipant && !isOwner) return null
  }

  return challenge
}

export async function createChallenge(data: {
  name: string
  description: string
  startAt: string
  endAt: string
  maxPlayers: number
  goals: Omit<ChallengeGoal, 'id' | 'createdAt'>[]
}): Promise<Challenge> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const now = d2t({ dateTime: getNow({}) })
  const challenge: Challenge = {
    id: uuid(),
    ownerId: user.id,
    name: data.name,
    description: data.description,
    startAt: data.startAt,
    endAt: data.endAt,
    maxPlayers: data.maxPlayers,
    status: 'active',
    joinCode: generateJoinCode(),
    goals: data.goals.map(g => ({
      ...g,
      id: uuid(),
      createdAt: now,
    })),
    participants: [{ userId: user.id, joinedAt: now }],
    completions: [],
    messages: [],
    createdAt: now,
  }

  await writeChallenge(challenge)
  await syncIndex(challenge)
  return challenge
}

export async function updateChallenge(id: string, updates: Partial<Pick<Challenge, 'name' | 'description' | 'startAt' | 'endAt' | 'maxPlayers' | 'status' | 'coverImage'>>): Promise<Challenge | null> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const challenge = await readChallenge(id)
  if (!challenge) throw new Error('Challenge not found')
  if (challenge.ownerId !== user.id && !user.isAdmin) throw new Error('Not the owner')

  const updated: Challenge = { ...challenge, ...updates }
  await writeChallenge(updated)
  await syncIndex(updated)
  return updated
}

export async function deleteChallenge(id: string): Promise<void> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const challenge = await readChallenge(id)
  if (!challenge) throw new Error('Challenge not found')
  if (challenge.ownerId !== user.id && !user.isAdmin) throw new Error('Not the owner')

  // Remove file
  try {
    await fs.unlink(challengePath(id))
  } catch { /* file may not exist */ }

  // Remove from index
  const index = await readIndex()
  index.challenges = index.challenges.filter(c => c.id !== id)
  await writeIndex(index)
}

export async function joinChallenge(joinCode: string): Promise<Challenge | null> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const index = await readIndex()
  const entry = index.challenges.find(c => c.joinCode === joinCode && c.status === 'active')
  if (!entry) return null

  const challenge = await readChallenge(entry.id)
  if (!challenge) return null

  // Already a participant?
  if (challenge.participants.some(p => p.userId === user.id)) return challenge

  // Max players check
  if (challenge.participants.length >= challenge.maxPlayers) {
    throw new Error('Challenge is full')
  }

  challenge.participants.push({
    userId: user.id,
    joinedAt: d2t({ dateTime: getNow({}) }),
  })

  await writeChallenge(challenge)
  await syncIndex(challenge)
  return challenge
}

export async function leaveChallenge(id: string): Promise<void> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const challenge = await readChallenge(id)
  if (!challenge) throw new Error('Challenge not found')

  // Owner can't leave (must delete instead)
  if (challenge.ownerId === user.id) throw new Error('Owner cannot leave. Delete the challenge instead.')

  challenge.participants = challenge.participants.filter(p => p.userId !== user.id)
  await writeChallenge(challenge)
  await syncIndex(challenge)
}

export async function addGoal(challengeId: string, goal: Omit<ChallengeGoal, 'id' | 'createdAt'>): Promise<Challenge> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const challenge = await readChallenge(challengeId)
  if (!challenge) throw new Error('Challenge not found')
  if (challenge.ownerId !== user.id && !user.isAdmin) throw new Error('Not the owner')

  challenge.goals.push({
    ...goal,
    id: uuid(),
    createdAt: d2t({ dateTime: getNow({}) }),
  })

  await writeChallenge(challenge)
  return challenge
}

export async function updateGoal(challengeId: string, goalId: string, updates: Partial<Pick<ChallengeGoal, 'title' | 'description' | 'icon' | 'points' | 'frequency' | 'maxCompletionsPerPeriod'>>): Promise<Challenge> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const challenge = await readChallenge(challengeId)
  if (!challenge) throw new Error('Challenge not found')
  if (challenge.ownerId !== user.id && !user.isAdmin) throw new Error('Not the owner')

  const goalIndex = challenge.goals.findIndex(g => g.id === goalId)
  if (goalIndex < 0) throw new Error('Goal not found')

  challenge.goals[goalIndex] = { ...challenge.goals[goalIndex], ...updates }
  await writeChallenge(challenge)
  return challenge
}

export async function deleteGoal(challengeId: string, goalId: string): Promise<Challenge> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const challenge = await readChallenge(challengeId)
  if (!challenge) throw new Error('Challenge not found')
  if (challenge.ownerId !== user.id && !user.isAdmin) throw new Error('Not the owner')

  challenge.goals = challenge.goals.filter(g => g.id !== goalId)
  // Also remove completions for this goal
  challenge.completions = challenge.completions.filter(c => c.goalId !== goalId)
  await writeChallenge(challenge)
  return challenge
}

export async function toggleGoalCompletion(challengeId: string, goalId: string, timezone: string): Promise<Challenge> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const challenge = await readChallenge(challengeId)
  if (!challenge) throw new Error('Challenge not found')

  // Must be a participant
  if (!challenge.participants.some(p => p.userId === user.id)) {
    throw new Error('Not a participant')
  }

  const goal = challenge.goals.find(g => g.id === goalId)
  if (!goal) throw new Error('Goal not found')

  const periodKey = getPeriodKey(goal.frequency, timezone)

  // Count existing completions for this period
  const existingCompletions = challenge.completions.filter(
    c => c.goalId === goalId && c.userId === user.id && c.periodKey === periodKey
  )

  if (existingCompletions.length >= goal.maxCompletionsPerPeriod) {
    // Undo: remove the latest completion for this period
    const lastCompletion = existingCompletions[existingCompletions.length - 1]
    challenge.completions = challenge.completions.filter(c => c.id !== lastCompletion.id)
  } else {
    // Add completion
    const now = d2t({ dateTime: getNow({}) })
    const completion: GoalCompletion = {
      id: uuid(),
      goalId,
      userId: user.id,
      completionAt: now,
      pointsAtTime: goal.points,
      periodKey,
      createdAt: now,
    }
    challenge.completions.push(completion)
  }

  await writeChallenge(challenge)
  return challenge
}

export async function sendMessage(challengeId: string, text: string): Promise<ChallengeMessage> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const challenge = await readChallenge(challengeId)
  if (!challenge) throw new Error('Challenge not found')

  if (!challenge.participants.some(p => p.userId === user.id)) {
    throw new Error('Not a participant')
  }

  const message: ChallengeMessage = {
    id: uuid(),
    userId: user.id,
    messageText: text.trim(),
    createdAt: d2t({ dateTime: getNow({}) }),
  }

  challenge.messages.push(message)
  await writeChallenge(challenge)
  return message
}

export async function loadMessages(challengeId: string, since?: string): Promise<ChallengeMessage[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const challenge = await readChallenge(challengeId)
  if (!challenge) return []

  if (!user.isAdmin && !challenge.participants.some(p => p.userId === user.id)) {
    return []
  }

  if (since) {
    return challenge.messages.filter(m => m.createdAt > since)
  }
  return challenge.messages
}

export async function getChallengeStats(challengeId: string, userId?: string): Promise<ChallengeStats> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const challenge = await readChallenge(challengeId)
  if (!challenge) throw new Error('Challenge not found')

  const completions = challenge.completions

  // scores: total per user
  const scoreMap = new Map<string, number>()
  for (const c of completions) {
    scoreMap.set(c.userId, (scoreMap.get(c.userId) ?? 0) + c.pointsAtTime)
  }
  const scores: ChallengeScoreEntry[] = Array.from(scoreMap.entries())
    .map(([uid, totalScore]) => ({ userId: uid, totalScore }))

  // goalScores: per user per goal
  const goalScoreMap = new Map<string, number>()
  for (const c of completions) {
    const key = `${c.userId}:${c.goalId}`
    goalScoreMap.set(key, (goalScoreMap.get(key) ?? 0) + c.pointsAtTime)
  }
  const goalScores: ChallengeGoalScoreEntry[] = Array.from(goalScoreMap.entries())
    .map(([key, score]) => {
      const [uid, goalId] = key.split(':')
      return { userId: uid, goalId, score }
    })

  // periodCounts: per user per goal per period (optionally filtered by userId)
  const filteredCompletions = userId
    ? completions.filter(c => c.userId === userId)
    : completions
  const periodMap = new Map<string, number>()
  for (const c of filteredCompletions) {
    const key = `${c.userId}:${c.goalId}:${c.periodKey}`
    periodMap.set(key, (periodMap.get(key) ?? 0) + 1)
  }
  const periodCounts: ChallengePeriodCount[] = Array.from(periodMap.entries())
    .map(([key, count]) => {
      const [uid, goalId, periodKey] = key.split(':')
      return { userId: uid, goalId, periodKey, count }
    })

  // daily points (last 7 days)
  const sevenDaysAgo = DateTime.now().minus({ days: 7 }).toFormat('yyyy-MM-dd')

  function extractDay(c: GoalCompletion): string {
    if (c.periodKey.startsWith('daily-')) {
      return c.periodKey.substring(6)
    }
    return DateTime.fromISO(c.completionAt).toFormat('yyyy-MM-dd')
  }

  // userDailyPoints
  const userDailyMap = new Map<string, number>()
  const userFilteredCompletions = userId
    ? completions.filter(c => c.userId === userId)
    : completions.filter(c => c.userId === user.id)
  for (const c of userFilteredCompletions) {
    const day = extractDay(c)
    if (day >= sevenDaysAgo) {
      const key = `${c.goalId}:${day}`
      userDailyMap.set(key, (userDailyMap.get(key) ?? 0) + c.pointsAtTime)
    }
  }
  const userDailyPoints: ChallengeDailyPoints[] = Array.from(userDailyMap.entries())
    .map(([key, points]) => {
      const [goalId, day] = key.split(':')
      return { goalId, day, points }
    })
    .sort((a, b) => a.day.localeCompare(b.day))

  // groupDailyPoints (all participants)
  const groupDailyMap = new Map<string, number>()
  for (const c of completions) {
    const day = extractDay(c)
    if (day >= sevenDaysAgo) {
      const key = `${c.goalId}:${day}`
      groupDailyMap.set(key, (groupDailyMap.get(key) ?? 0) + c.pointsAtTime)
    }
  }
  const groupDailyPoints: ChallengeDailyPoints[] = Array.from(groupDailyMap.entries())
    .map(([key, points]) => {
      const [goalId, day] = key.split(':')
      return { goalId, day, points }
    })
    .sort((a, b) => a.day.localeCompare(b.day))

  return { scores, goalScores, periodCounts, userDailyPoints, groupDailyPoints }
}
