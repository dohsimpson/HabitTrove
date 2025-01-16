import { atom } from "jotai";
import {
  getDefaultSettings,
  getDefaultHabitsData,
  getDefaultCoinsData,
  getDefaultWishlistData,
  Habit
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
  getCompletionsForToday
} from "@/lib/utils";

export const settingsAtom = atom(getDefaultSettings());
export const habitsAtom = atom(getDefaultHabitsData());
export const coinsAtom = atom(getDefaultCoinsData());
export const wishlistAtom = atom(getDefaultWishlistData());

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

// Derived atom for today's completions of selected habit
export const pomodoroTodayCompletionsAtom = atom((get) => {
  const pomo = get(pomodoroAtom)
  const habits = get(habitsAtom)
  const settings = get(settingsAtom)

  if (!pomo.selectedHabitId) return 0

  const selectedHabit = habits.habits.find(h => h.id === pomo.selectedHabitId)
  if (!selectedHabit) return 0

  return getCompletionsForToday({
    habit: selectedHabit,
    timezone: settings.system.timezone
  })
})
