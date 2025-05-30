import { useAtom } from 'jotai';
import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { calculateCoinsEarnedToday, calculateCoinsSpentToday, calculateTotalEarned, calculateTotalSpent, calculateTransactionsToday, checkPermission, roundToInteger } from '@/lib/utils'
import {
  coinsAtom,
  coinsEarnedTodayAtom,
  totalEarnedAtom,
  totalSpentAtom,
  coinsSpentTodayAtom,
  transactionsTodayAtom,
  coinsBalanceAtom,
  settingsAtom,
  usersAtom,
  currentUserAtom,
} from '@/lib/atoms'
import { addCoins, removeCoins, saveCoinsData } from '@/app/actions/data'
import { CoinsData, User } from '@/lib/types'
import { toast } from '@/hooks/use-toast'
import { MAX_COIN_LIMIT } from '@/lib/constants'

function handlePermissionCheck(
  user: User | undefined,
  resource: 'habit' | 'wishlist' | 'coins',
  action: 'write' | 'interact',
  tCommon: (key: string, values?: Record<string, any>) => string
): boolean {
  if (!user) {
    toast({
      title: tCommon("authenticationRequiredTitle"),
      description: tCommon("authenticationRequiredDescription"),
      variant: "destructive",
    })
    return false
  }

  if (!user.isAdmin && !checkPermission(user.permissions, resource, action)) {
    toast({
      title: tCommon("permissionDeniedTitle"),
      description: tCommon("permissionDeniedDescription", { action, resource }),
      variant: "destructive",
    })
    return false
  }

  return true
}

export function useCoins(options?: { selectedUser?: string }) {
  const t = useTranslations('useCoins');
  const tCommon = useTranslations('Common');
  const [coins, setCoins] = useAtom(coinsAtom)
  const [settings] = useAtom(settingsAtom)
  const [users] = useAtom(usersAtom)
  const [currentUser] = useAtom(currentUserAtom)
  const [allCoinsData] = useAtom(coinsAtom) // All coin transactions
  const [loggedInUserBalance] = useAtom(coinsBalanceAtom) // Balance of the *currently logged-in* user
  const [atomCoinsEarnedToday] = useAtom(coinsEarnedTodayAtom);
  const [atomTotalEarned] = useAtom(totalEarnedAtom)
  const [atomTotalSpent] = useAtom(totalSpentAtom)
  const [atomCoinsSpentToday] = useAtom(coinsSpentTodayAtom);
  const [atomTransactionsToday] = useAtom(transactionsTodayAtom);
  const targetUser = options?.selectedUser ? users.users.find(u => u.id === options.selectedUser) : currentUser
  
  const transactions = useMemo(() => {
    return allCoinsData.transactions.filter(t => t.userId === targetUser?.id);
  }, [allCoinsData, targetUser?.id]);

  const timezone = settings.system.timezone;
  const [coinsEarnedToday, setCoinsEarnedToday] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [coinsSpentToday, setCoinsSpentToday] = useState(0);
  const [transactionsToday, setTransactionsToday] = useState<number>(0);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    // Calculate other metrics
    if (targetUser?.id && targetUser.id === currentUser?.id) {
      // If the target user is the currently logged-in user, use the derived atom's value
      setCoinsEarnedToday(atomCoinsEarnedToday);
      setTotalEarned(atomTotalEarned);
      setTotalSpent(atomTotalSpent);
      setCoinsSpentToday(atomCoinsSpentToday);
      setTransactionsToday(atomTransactionsToday);
      setBalance(loggedInUserBalance);
    } else if (targetUser?.id) {
      // If an admin is viewing another user, calculate their metrics manually
      const earnedToday = calculateCoinsEarnedToday(transactions, timezone);
      setCoinsEarnedToday(roundToInteger(earnedToday));

      const totalEarnedVal = calculateTotalEarned(transactions);
      setTotalEarned(roundToInteger(totalEarnedVal));

      const totalSpentVal = calculateTotalSpent(transactions);
      setTotalSpent(roundToInteger(totalSpentVal));

      const spentToday = calculateCoinsSpentToday(transactions, timezone);
      setCoinsSpentToday(roundToInteger(spentToday));

      setTransactionsToday(calculateTransactionsToday(transactions, timezone)); // This is a count

      const calculatedBalance = transactions.reduce((acc, t) => acc + t.amount, 0);
      setBalance(roundToInteger(calculatedBalance));
    }
  }, [
    targetUser?.id,
    currentUser?.id,
    transactions, // Memoized: depends on allCoinsData and targetUser?.id
    timezone,
    loggedInUserBalance,
    atomCoinsEarnedToday,
    atomTotalEarned,
    atomTotalSpent,
    atomCoinsSpentToday,
    atomTransactionsToday,
  ]);

  const add = async (amount: number, description: string, note?: string) => {
    if (!handlePermissionCheck(currentUser, 'coins', 'write', tCommon)) return null
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: t("invalidAmountTitle"),
        description: t("invalidAmountDescription")
      })
      return null
    }
    if (amount > MAX_COIN_LIMIT) {
      toast({
        title: t("invalidAmountTitle"),
        description: t("maxAmountExceededDescription", { max: MAX_COIN_LIMIT })
      })
      return null
    }

    const data = await addCoins({
      amount,
      description,
      type: 'MANUAL_ADJUSTMENT',
      note,
      userId: targetUser?.id
    })
    setCoins(data)
    toast({ title: t("successTitle"), description: t("addedCoinsDescription", { amount }) })
    return data
  }

  const remove = async (amount: number, description: string, note?: string) => {
    if (!handlePermissionCheck(currentUser, 'coins', 'write', tCommon)) return null
    const numAmount = Math.abs(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: t("invalidAmountTitle"),
        description: t("invalidAmountDescription")
      })
      return null
    }
    if (numAmount > MAX_COIN_LIMIT) {
      toast({
        title: t("invalidAmountTitle"),
        description: t("maxAmountExceededDescription", { max: MAX_COIN_LIMIT })
      })
      return null
    }

    const data = await removeCoins({
      amount: numAmount,
      description,
      type: 'MANUAL_ADJUSTMENT',
      note,
      userId: targetUser?.id
    })
    setCoins(data)
    toast({ title: t("successTitle"), description: t("removedCoinsDescription", { amount: numAmount }) })
    return data
  }

  const updateNote = async (transactionId: string, note: string) => {
    if (!handlePermissionCheck(currentUser, 'coins', 'write', tCommon)) return null
    const transaction = coins.transactions.find(t => t.id === transactionId)
    if (!transaction) {
      toast({
        title: tCommon("errorTitle"),
        description: t("transactionNotFoundDescription")
      })
      return null
    }

    const updatedTransaction = {
      ...transaction,
      note: note.trim() || undefined
    }

    const updatedTransactions = coins.transactions.map(t =>
      t.id === transactionId ? updatedTransaction : t
    )

    const newData: CoinsData = {
      ...coins,
      transactions: updatedTransactions
    }

    await saveCoinsData(newData)
    setCoins(newData)
    return newData
  }

  return {
    add,
    remove,
    updateNote,
    balance,
    transactions: transactions,
    coinsEarnedToday,
    totalEarned,
    totalSpent,
    coinsSpentToday,
    transactionsToday
  }
}
