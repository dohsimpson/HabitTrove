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

// Default value functions
// Data container types
export interface WishlistData {
  items: WishlistItemType[];
}

// Default value functions
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
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }
});

// Map of data types to their default values
export const DATA_DEFAULTS = {
  wishlist: getDefaultWishlistData,
  habits: getDefaultHabitsData,
  coins: getDefaultCoinsData,
  settings: getDefaultSettings,
} as const;

// Type for all possible data types
export type DataType = keyof typeof DATA_DEFAULTS;

export interface UISettings {
  useNumberFormatting: boolean;
  useGrouping: boolean;
}

export interface SystemSettings {
  timezone: string;
}

export interface Settings {
  ui: UISettings;
  system: SystemSettings;
}
