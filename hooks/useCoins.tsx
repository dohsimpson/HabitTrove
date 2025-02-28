import { useAtom } from 'jotai'
import { calculateCoinsEarnedToday, calculateCoinsSpentToday, calculateTotalEarned, calculateTotalSpent, calculateTransactionsToday, checkPermission } from '@/lib/utils'
import {
  coinsAtom,
  // coinsEarnedTodayAtom,
  // totalEarnedAtom,
  // totalSpentAtom,
  // coinsSpentTodayAtom,
  // transactionsTodayAtom,
  // coinsBalanceAtom,
  settingsAtom,
  usersAtom
} from '@/lib/atoms'
import { addCoins, removeCoins, saveCoinsData } from '@/app/actions/data'
import { CoinsData, User } from '@/lib/types'
import { toast } from '@/hooks/use-toast'
import { useHelpers } from '@/lib/client-helpers'

function handlePermissionCheck(
  user: User | undefined,
  resource: 'habit' | 'wishlist' | 'coins',
  action: 'write' | 'interact'
): boolean {
  if (!user) {
    toast({
      title: "Authentication Required",
      description: "Please sign in to continue.",
      variant: "destructive",
    })
    return false
  }
  
  if (!user.isAdmin && !checkPermission(user.permissions, resource, action)) {
    toast({
      title: "Permission Denied",
      description: `You don't have ${action} permission for ${resource}s.`,
      variant: "destructive",
    })
    return false
  }
  
  return true
}

export function useCoins(options?: { selectedUser?: string }) {
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

  const balance = transactions.reduce((sum, t) => sum + t.amount, 0)
  const coinsEarnedToday = calculateCoinsEarnedToday(transactions, settings.system.timezone)
  const totalEarned = calculateTotalEarned(transactions)
  const totalSpent = calculateTotalSpent(transactions)
  const coinsSpentToday = calculateCoinsSpentToday(transactions, settings.system.timezone)
  const transactionsToday = calculateTransactionsToday(transactions, settings.system.timezone)

  const add = async (amount: number, description: string, note?: string) => {
    if (!handlePermissionCheck(currentUser, 'coins', 'write')) return null
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive number"
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
    toast({ title: "Success", description: `Added ${amount} coins` })
    return data
  }

  const remove = async (amount: number, description: string, note?: string) => {
    if (!handlePermissionCheck(currentUser, 'coins', 'write')) return null
    const numAmount = Math.abs(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive number"
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
    toast({ title: "Success", description: `Removed ${numAmount} coins` })
    return data
  }

  const updateNote = async (transactionId: string, note: string) => {
    if (!handlePermissionCheck(currentUser, 'coins', 'write')) return null
    const transaction = coins.transactions.find(t => t.id === transactionId)
    if (!transaction) {
      toast({
        title: "Error",
        description: "Transaction not found"
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
