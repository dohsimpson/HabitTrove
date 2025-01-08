import { atom } from "jotai";
import { 
  getDefaultSettings,
  getDefaultHabitsData,
  getDefaultCoinsData,
  getDefaultWishlistData
} from "./types";
import { getTodayInTimezone, isSameDate, t2d } from "@/lib/utils";

export const settingsAtom = atom(getDefaultSettings());
export const habitsAtom = atom(getDefaultHabitsData());
export const coinsAtom = atom(getDefaultCoinsData());
export const wishlistAtom = atom(getDefaultWishlistData());

// Derived atom for coins earned today
export const coinsEarnedTodayAtom = atom((get) => {
  const coins = get(coinsAtom);
  const settings = get(settingsAtom);
  const today = getTodayInTimezone(settings.system.timezone);
  return coins.transactions
    .filter(transaction =>
      isSameDate(t2d({ timestamp: transaction.timestamp, timezone: settings.system.timezone }),
        t2d({ timestamp: today, timezone: settings.system.timezone }))
    )
    .reduce((sum, transaction) => {
      if (transaction.type !== 'HABIT_UNDO' && transaction.amount > 0) {
        return sum + transaction.amount;
      }
      if (transaction.type === 'HABIT_UNDO') {
        return sum - Math.abs(transaction.amount);
      }
      return sum;
    }, 0);
});

// Derived atom for total earned
export const totalEarnedAtom = atom((get) => {
  const coins = get(coinsAtom);
  return coins.transactions
    .filter(t => {
      if (t.type === 'HABIT_COMPLETION' && t.relatedItemId) {
        return !coins.transactions.some(undoT =>
          undoT.type === 'HABIT_UNDO' &&
          undoT.relatedItemId === t.relatedItemId
        );
      }
      return t.amount > 0 && t.type !== 'HABIT_UNDO';
    })
    .reduce((sum, t) => sum + t.amount, 0);
});

// Derived atom for total spent
export const totalSpentAtom = atom((get) => {
  const coins = get(coinsAtom);
  return Math.abs(
    coins.transactions
      .filter(t => t.type === 'WISH_REDEMPTION' || t.type === 'MANUAL_ADJUSTMENT')
      .reduce((sum, t) => sum + (t.amount < 0 ? t.amount : 0), 0)
  );
});

// Derived atom for coins spent today
export const coinsSpentTodayAtom = atom((get) => {
  const coins = get(coinsAtom);
  const settings = get(settingsAtom);
  const today = getTodayInTimezone(settings.system.timezone);
  return Math.abs(
    coins.transactions
      .filter(t =>
        isSameDate(t2d({ timestamp: t.timestamp, timezone: settings.system.timezone }),
          t2d({ timestamp: today, timezone: settings.system.timezone })) &&
        t.amount < 0
      )
      .reduce((sum, t) => sum + t.amount, 0)
  );
});

// Derived atom for transactions today
export const transactionsTodayAtom = atom((get) => {
  const coins = get(coinsAtom);
  const settings = get(settingsAtom);
  const today = getTodayInTimezone(settings.system.timezone);
  return coins.transactions.filter(t =>
    isSameDate(t2d({ timestamp: t.timestamp, timezone: settings.system.timezone }),
      t2d({ timestamp: today, timezone: settings.system.timezone }))
  ).length;
});
