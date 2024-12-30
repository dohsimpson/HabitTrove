export type Habit = {
  id: string
  name: string
  description: string
  frequency: 'daily' | 'weekly' | 'monthly'
  coinReward: number
  completions: string[] // Array of ISO date strings
}

export type WishlistItemType = {
  id: string
  name: string
  description: string
  coinCost: number
}

export type TransactionType = 'HABIT_COMPLETION' | 'HABIT_UNDO' | 'WISH_REDEMPTION' | 'MANUAL_ADJUSTMENT';

export interface CoinTransaction {
  id: string;
  amount: number;
  type: TransactionType;
  description: string;
  timestamp: string;
  relatedItemId?: string;
}

export interface HabitsData {
  habits: Habit[];
}

export interface CoinsData {
  balance: number;
  transactions: CoinTransaction[];
}
