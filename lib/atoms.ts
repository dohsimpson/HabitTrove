import { atom } from "jotai";
import {
  getDefaultSettings,
  getDefaultHabitsData,
  getDefaultCoinsData,
  getDefaultWishlistData,
  Habit,
  ViewType,
  getDefaultUsersData,
  CompletionCache,
  getDefaultServerSettings,
  User,
  UserId,
} from "./types";
import {
  getTodayInTimezone,
  isSameDate,
  t2d,
  calculateCoinsEarnedToday,
  calculateTotalEarned,
  calculateTotalSpent,
  calculateCoinsSpentToday,
  calculateTransactionsToday,
  getCompletionsForToday,
  getISODate,
  isHabitDueToday,
  getNow,
  isHabitDue,
  getHabitFreq,
  roundToInteger
} from "@/lib/utils";
import { atomFamily, atomWithStorage } from "jotai/utils";
import { DateTime } from "luxon";
import { Freq } from "./types";

export interface BrowserSettings {
  viewType: ViewType
  expandedHabits: boolean
  expandedTasks: boolean
  expandedWishlist: boolean
}

export const browserSettingsAtom = atomWithStorage('browserSettings', {
  viewType: 'habits',
  expandedHabits: false,
  expandedTasks: false,
  expandedWishlist: false
} as BrowserSettings)

export const usersAtom = atom(getDefaultUsersData())
export const settingsAtom = atom(getDefaultSettings());
export const habitsAtom = atom(getDefaultHabitsData());
export const coinsAtom = atom(getDefaultCoinsData());
export const wishlistAtom = atom(getDefaultWishlistData());
export const serverSettingsAtom = atom(getDefaultServerSettings());

// Derived atom for coins earned today
export const coinsEarnedTodayAtom = atom((get) => {
  const coins = get(coinsAtom);
  const settings = get(settingsAtom);
  const value = calculateCoinsEarnedToday(coins.transactions, settings.system.timezone);
  return roundToInteger(value);
});

// Derived atom for total earned
export const totalEarnedAtom = atom((get) => {
  const coins = get(coinsAtom);
  const value = calculateTotalEarned(coins.transactions);
  return roundToInteger(value);
});

// Derived atom for total spent
export const totalSpentAtom = atom((get) => {
  const coins = get(coinsAtom);
  const value = calculateTotalSpent(coins.transactions);
  return roundToInteger(value);
});

// Derived atom for coins spent today
export const coinsSpentTodayAtom = atom((get) => {
  const coins = get(coinsAtom);
  const settings = get(settingsAtom);
  const value = calculateCoinsSpentToday(coins.transactions, settings.system.timezone);
  return roundToInteger(value);
});

// Derived atom for transactions today
export const transactionsTodayAtom = atom((get) => {
  const coins = get(coinsAtom);
  const settings = get(settingsAtom);
  return calculateTransactionsToday(coins.transactions, settings.system.timezone);
});

// Atom to store the current logged-in user's ID.
// This should be set by your application when the user session is available.
export const currentUserIdAtom = atom<UserId | undefined>(undefined);

export const currentUserAtom = atom((get) => {
  const currentUserId = get(currentUserIdAtom);
  const users = get(usersAtom);
  return users.users.find(user => user.id === currentUserId);
})

// Derived atom for current balance for the logged-in user
export const coinsBalanceAtom = atom((get) => {
  const loggedInUserId = get(currentUserIdAtom);
  if (!loggedInUserId) {
    return 0; // No user logged in or ID not set, so balance is 0
  }
  const coins = get(coinsAtom);
  const balance = coins.transactions
    .filter(transaction => transaction.userId === loggedInUserId)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  return roundToInteger(balance);
});

/* transient atoms */
interface PomodoroAtom {
  show: boolean
  selectedHabitId: string | null
  autoStart: boolean
  minimized: boolean
}

export const pomodoroAtom = atom<PomodoroAtom>({
  show: false,
  selectedHabitId: null,
  autoStart: true,
  minimized: false,
})

import { prepareDataForHashing, generateCryptoHash } from '@/lib/utils';

export const userSelectAtom = atom<boolean>(false)
export const aboutOpenAtom = atom<boolean>(false)

/**
 * Asynchronous atom that calculates a freshness token (hash) based on the current client-side data.
 * This token can be compared with a server-generated token to detect data discrepancies.
 */
export const clientFreshnessTokenAtom = atom(async (get) => {
  const settings = get(settingsAtom);
  const habits = get(habitsAtom);
  const coins = get(coinsAtom);
  const wishlist = get(wishlistAtom);
  const users = get(usersAtom);

  const dataString = prepareDataForHashing(settings, habits, coins, wishlist, users);
  const hash = await generateCryptoHash(dataString);
  return hash;
});

// Derived atom for completion cache
export const completionCacheAtom = atom((get) => {
  const habits = get(habitsAtom).habits;
  const timezone = get(settingsAtom).system.timezone;
  const cache: CompletionCache = {};

  habits.forEach(habit => {
    habit.completions.forEach(utcTimestamp => {
      const localDate = t2d({ timestamp: utcTimestamp, timezone })
        .toFormat('yyyy-MM-dd');

      if (!cache[localDate]) {
        cache[localDate] = {};
      }

      cache[localDate][habit.id] = (cache[localDate][habit.id] || 0) + 1;
    });
  });

  return cache;
});

// Derived atom for completed habits by date, using the cache
export const completedHabitsMapAtom = atom((get) => {
  const habits = get(habitsAtom).habits;
  const completionCache = get(completionCacheAtom);
  const map = new Map<string, Habit[]>();

  // For each date in the cache
  Object.entries(completionCache).forEach(([dateKey, habitCompletions]) => {
    const completedHabits = habits.filter(habit => {
      const completionsNeeded = habit.targetCompletions || 1;
      const completionsAchieved = habitCompletions[habit.id] || 0;
      return completionsAchieved >= completionsNeeded;
    });

    if (completedHabits.length > 0) {
      map.set(dateKey, completedHabits);
    }
  });

  return map;
});

// Derived atom for habit frequency map
export const habitFreqMapAtom = atom((get) => {
  const habits = get(habitsAtom).habits;
  const map = new Map<string, Freq>();
  habits.forEach(habit => {
    map.set(habit.id, getHabitFreq(habit));
  });
  return map;
});

export const pomodoroTodayCompletionsAtom = atom((get) => {
  const pomo = get(pomodoroAtom)
  const habits = get(habitsAtom)
  const settings = get(settingsAtom)

  if (!pomo.selectedHabitId) return 0

  const selectedHabit = habits.habits.find(h => h.id === pomo.selectedHabitId!)
  if (!selectedHabit) return 0

  return getCompletionsForToday({
    habit: selectedHabit,
    timezone: settings.system.timezone
  })
})

// Derived atom to check if any habits are tasks
export const hasTasksAtom = atom((get) => {
  const habits = get(habitsAtom)
  return habits.habits.some(habit => habit.isTask === true)
})

// Atom family for habits by specific date
export const habitsByDateFamily = atomFamily((dateString: string) =>
  atom((get) => {
    const habits = get(habitsAtom).habits;
    const settings = get(settingsAtom);
    const timezone = settings.system.timezone;

    const date = DateTime.fromISO(dateString).setZone(timezone);
    return habits.filter(habit => isHabitDue({ habit, timezone, date }));
  })
);

// Derived atom for daily habits
export const dailyHabitsAtom = atom((get) => {
  const settings = get(settingsAtom);
  const today = getTodayInTimezone(settings.system.timezone);
  return get(habitsByDateFamily(today));
});
