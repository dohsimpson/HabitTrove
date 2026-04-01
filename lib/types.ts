import { RRule } from "rrule"
import { uuid } from "./utils"
import { DateTime } from "luxon"

export type UserId = string

export type Permission = {
  habit: {
    write: boolean
    interact: boolean
  }
  wishlist: {
    write: boolean
    interact: boolean
  }
  coins: {
    write: boolean
    interact: boolean
  }
}

export type SessionUser = {
  id: UserId
}

export type SafeUser = SessionUser & {
  username: string
  avatarPath?: string
  permissions?: Permission[]
  isAdmin?: boolean
  hasPassword?: boolean
}

export type User = SafeUser & {
  password?: string // Optional: Allow users without passwords (e.g., initial setup)
  lastNotificationReadTimestamp?: string // UTC ISO date string
}

export type PublicUser = Omit<User, 'password'> & {
  hasPassword: boolean
}

export type Habit = {
  id: string
  name: string
  description: string
  frequency: string
  coinReward: number
  targetCompletions?: number // Optional field, default to 1
  completions: string[] // Array of UTC ISO date strings
  isTask?: boolean // mark the habit as a task
  archived?: boolean // mark the habit as archived
  pinned?: boolean // mark the habit as pinned
  userIds?: UserId[]
  drawing?: string // Optional JSON string of drawing data
}


export type Freq = 'daily' | 'weekly' | 'monthly' | 'yearly'

export type WishlistItemType = {
  id: string
  name: string
  description: string
  coinCost: number
  archived?: boolean // mark the wishlist item as archived
  targetCompletions?: number // Optional field, infinity when unset
  link?: string // Optional URL to external resource
  userIds?: UserId[]
  drawing?: string // Optional JSON string of drawing data
}

export type TransactionType = 'HABIT_COMPLETION' | 'HABIT_UNDO' | 'WISH_REDEMPTION' | 'MANUAL_ADJUSTMENT' | 'TASK_COMPLETION' | 'TASK_UNDO';

export interface CoinTransaction {
  id: string;
  amount: number;
  type: TransactionType;
  description: string;
  timestamp: string;
  relatedItemId?: string;
  note?: string;
  userId?: UserId;
}

export interface UserData {
  users: User[]
}

export interface PublicUserData {
  users: PublicUser[]
}

export interface HabitsData {
  habits: Habit[];
}


export interface CoinsData {
  balance: number;
  transactions: CoinTransaction[];
}

// Default value functions
// Data container types
export interface WishlistData {
  items: WishlistItemType[];
}

// Default value functions
export const getDefaultUsersData = (): UserData => ({
  users: [
    {
      id: uuid(),
      username: 'admin',
      // password: '', // No default password for admin initially? Or set a secure default?
      isAdmin: true,
      lastNotificationReadTimestamp: undefined, // Initialize as undefined
    }
  ]
});

export const getDefaultPublicUsersData = (): PublicUserData => ({
  users: getDefaultUsersData().users.map(({ password, ...user }) => ({
    ...user,
    hasPassword: !!password,
  })),
});

export const getDefaultHabitsData = (): HabitsData => ({
  habits: []
});


export const getDefaultCoinsData = (): CoinsData => ({
  balance: 0,
  transactions: []
});

export const getDefaultWishlistData = (): WishlistData => ({
  items: []
});

export const getDefaultSettings = (): Settings => ({
  ui: {
    useNumberFormatting: true,
    useGrouping: true,
  },
  system: {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    weekStartDay: 1, // Monday
    autoBackupEnabled: true, // Add this line (default to true)
    language: 'en', // Default language
  },
  profile: {}
});

export const getDefaultServerSettings = (): ServerSettings => ({
  isDemo: false
})

// Map of data types to their default values
export const DATA_DEFAULTS = {
  wishlist: getDefaultWishlistData,
  habits: getDefaultHabitsData,
  coins: getDefaultCoinsData,
  settings: getDefaultSettings,
  auth: getDefaultUsersData,
} as const;

// Type for all possible data types
export type DataType = keyof typeof DATA_DEFAULTS;

export interface UISettings {
  useNumberFormatting: boolean;
  useGrouping: boolean;
}

export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 6 = Saturday

export interface SystemSettings {
  timezone: string;
  weekStartDay: WeekDay;
  autoBackupEnabled: boolean; // Add this line
  language: string; // Add this line for language preference
}

export interface ProfileSettings {
  avatarPath?: string; // deprecated
}

export interface Settings {
  ui: UISettings;
  system: SystemSettings;
  profile: ProfileSettings;
}

export type CompletionCache = {
  [dateKey: string]: {  // dateKey format: "YYYY-MM-DD"
    [habitId: string]: number  // number of completions on that date
  }
}

export type ViewType = 'habits' | 'tasks'

export interface JotaiHydrateInitialValues {
  settings: Settings;
  coins: CoinsData;
  habits: HabitsData;
  wishlist: WishlistData;
  users: PublicUserData;
  serverSettings: ServerSettings;
  challengeIndex: ChallengeIndex;
}

export interface ServerSettings {
  isDemo: boolean
}

// ─── Challenge Types (ported from APE) ───────────────────────────────

export type ChallengeStatus = 'active' | 'completed' | 'draft' | 'cancelled'
export type ChallengeGoalFrequency = 'daily' | 'weekly' | 'monthly' | 'once'

export interface ChallengeGoal {
  id: string
  title: string
  description: string
  icon: string // emoji
  points: number
  frequency: ChallengeGoalFrequency
  maxCompletionsPerPeriod: number
  createdAt: string // ISO date
}

export interface ChallengeParticipant {
  userId: UserId
  joinedAt: string // ISO date
}

export interface GoalCompletion {
  id: string
  goalId: string
  userId: UserId
  completionAt: string // ISO date
  pointsAtTime: number
  periodKey: string // e.g. "daily-2026-03-31", "weekly-2026-w14", "monthly-2026-03", "once"
  createdAt: string // ISO date
}

export interface ChallengeMessage {
  id: string
  userId: UserId
  messageText: string
  createdAt: string // ISO date
}

export interface Challenge {
  id: string
  ownerId: UserId
  name: string
  description: string
  startAt: string // ISO date
  endAt: string // ISO date
  maxPlayers: number
  status: ChallengeStatus
  joinCode: string // 8-char random
  coverImage?: string
  goals: ChallengeGoal[]
  participants: ChallengeParticipant[]
  completions: GoalCompletion[]
  messages: ChallengeMessage[]
  createdAt: string // ISO date
}

export interface ChallengeIndexEntry {
  id: string
  name: string
  status: ChallengeStatus
  joinCode: string
  ownerName: string
  ownerId: UserId
  participantCount: number
  startAt: string
  endAt: string
}

export interface ChallengeIndex {
  challenges: ChallengeIndexEntry[]
}

export const getDefaultChallengeIndex = (): ChallengeIndex => ({
  challenges: []
})

// ─── Challenge Stats (replaces APE's get_challenge_stats_v2 RPC) ─────

export interface ChallengeScoreEntry {
  userId: UserId
  totalScore: number
}

export interface ChallengeGoalScoreEntry {
  userId: UserId
  goalId: string
  score: number
}

export interface ChallengePeriodCount {
  userId: UserId
  goalId: string
  periodKey: string
  count: number
}

export interface ChallengeDailyPoints {
  goalId: string
  day: string // YYYY-MM-DD
  points: number
}

export interface ChallengeStats {
  scores: ChallengeScoreEntry[]
  goalScores: ChallengeGoalScoreEntry[]
  periodCounts: ChallengePeriodCount[]
  userDailyPoints: ChallengeDailyPoints[]
  groupDailyPoints: ChallengeDailyPoints[]
}

// ─────────────────────────────────────────────────────────────────────

export type ParsedResultType = DateTime<true> | RRule | string | null // null if invalid

// return rrule / datetime (machine-readable frequency), string (human-readable frequency), or null (invalid)
export interface ParsedFrequencyResult {
  message: string | null
  result: ParsedResultType
}
