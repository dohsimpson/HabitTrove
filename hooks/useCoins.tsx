import { useAtom } from 'jotai'
import { useTranslations } from 'next-intl'
import { calculateCoinsEarnedToday, calculateCoinsSpentToday, calculateTotalEarned, calculateTotalSpent, calculateTransactionsToday, checkPermission } from '@/lib/utils'
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
} from '@/lib/atoms'
import { addCoins, removeCoins, saveCoinsData } from '@/app/actions/data'
import { CoinsData, User } from '@/lib/types'
import { toast } from '@/hooks/use-toast'
import { useHelpers } from '@/lib/client-helpers'

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
  const { currentUser } = useHelpers()
  let user: User | undefined;
  if (!options?.selectedUser) {
    user = currentUser;
  } else {
    user = users.users.find(u => u.id === options.selectedUser)
  }

  // Filter transactions for the selectd user
  const transactions = coins.transactions.filter(t => t.userId === user?.id)

  const [balance] = useAtom(coinsBalanceAtom)
  const [coinsEarnedToday] = useAtom(coinsEarnedTodayAtom)
  const [totalEarned] = useAtom(totalEarnedAtom)
  const [totalSpent] = useAtom(totalSpentAtom)
  const [coinsSpentToday] = useAtom(coinsSpentTodayAtom)
  const [transactionsToday] = useAtom(transactionsTodayAtom)

  const add = async (amount: number, description: string, note?: string) => {
    if (!handlePermissionCheck(currentUser, 'coins', 'write', tCommon)) return null
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: t("invalidAmountTitle"),
        description: t("invalidAmountDescription")
      })
      return null
    }

    const data = await addCoins({
      amount,
      description,
      type: 'MANUAL_ADJUSTMENT',
      note,
      userId: user?.id
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

    const data = await removeCoins({
      amount: numAmount,
      description,
      type: 'MANUAL_ADJUSTMENT',
      note,
      userId: user?.id
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
