import {
  calculateCoinsEarnedToday,
  calculateCoinsSpentToday,
  calculateTotalEarned,
  calculateTotalSpent,
  calculateTransactionsToday,
  getCompletionsForToday,
  getHabitFreq,
  getTodayInTimezone,
  isHabitDue,
  t2d
} from "@/lib/utils";
import { atom } from "jotai";
import { atomFamily, atomWithStorage } from "jotai/utils";
import { DateTime } from "luxon";
import {
  CompletionCache,
  Freq,
  getDefaultCoinsData,
  getDefaultHabitsData,
  getDefaultServerSettings,
  getDefaultSettings,
  getDefaultUsersData,
  getDefaultWishlistData,
  Habit,
  ViewType
} from "./types";

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
  return calculateCoinsEarnedToday(coins.transactions, settings.system.timezone);
});

// Derived atom for total earned
export const totalEarnedAtom = atom((get) => {
  const coins = get(coinsAtom);
  return calculateTotalEarned(coins.transactions);
});

// Derived atom for total spent
export const totalSpentAtom = atom((get) => {
  const coins = get(coinsAtom);
  return calculateTotalSpent(coins.transactions);
});

// Derived atom for coins spent today
export const coinsSpentTodayAtom = atom((get) => {
  const coins = get(coinsAtom);
  const settings = get(settingsAtom);
  return calculateCoinsSpentToday(coins.transactions, settings.system.timezone);
});

// Derived atom for transactions today
export const transactionsTodayAtom = atom((get) => {
  const coins = get(coinsAtom);
  const settings = get(settingsAtom);
  return calculateTransactionsToday(coins.transactions, settings.system.timezone);
});

// Derived atom for current balance from all transactions
export const coinsBalanceAtom = atom((get) => {
  const coins = get(coinsAtom);
  return coins.transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
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

export const userSelectAtom = atom<boolean>(false)

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
