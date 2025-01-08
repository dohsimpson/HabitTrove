import { useAtom } from 'jotai'
import { coinsAtom, settingsAtom } from '@/lib/atoms'
import { addCoins, removeCoins } from '@/app/actions/data'
import { toast } from '@/hooks/use-toast'
import { getTodayInTimezone, isSameDate, t2d } from '@/lib/utils'

export function useCoins() {
  const [coins, setCoins] = useAtom(coinsAtom)
  const [settings] = useAtom(settingsAtom)

  const getTotalEarned = () => {
    return coins.transactions
      .filter(t => {
        if (t.type === 'HABIT_COMPLETION' && t.relatedItemId) {
          return !coins.transactions.some(undoT =>
            undoT.type === 'HABIT_UNDO' &&
            undoT.relatedItemId === t.relatedItemId
          )
        }
        return t.amount > 0 && t.type !== 'HABIT_UNDO'
      })
      .reduce((sum, t) => sum + t.amount, 0)
  }

  const getTotalSpent = () => {
    return Math.abs(
      coins.transactions
        .filter(t => t.type === 'WISH_REDEMPTION' || t.type === 'MANUAL_ADJUSTMENT')
        .reduce((sum, t) => sum + (t.amount < 0 ? t.amount : 0), 0)
    )
  }

  const getCoinsEarnedToday = () => {
    const today = getTodayInTimezone(settings.system.timezone)
    return coins.transactions
      .filter(transaction => 
        isSameDate(t2d({ timestamp: transaction.timestamp, timezone: settings.system.timezone }), 
                  t2d({ timestamp: today, timezone: settings.system.timezone }))
      )
      .reduce((sum, transaction) => {
        if (transaction.type !== 'HABIT_UNDO' && transaction.amount > 0) {
          return sum + transaction.amount
        }
        if (transaction.type === 'HABIT_UNDO') {
          return sum - Math.abs(transaction.amount)
        }
        return sum
      }, 0)
  }

  const getCoinsSpentToday = () => {
    const today = getTodayInTimezone(settings.system.timezone)
    return Math.abs(
      coins.transactions
        .filter(t => 
          isSameDate(t2d({ timestamp: t.timestamp, timezone: settings.system.timezone }), 
                    t2d({ timestamp: today, timezone: settings.system.timezone })) &&
          t.amount < 0
        )
        .reduce((sum, t) => sum + t.amount, 0)
    )
  }

  const getTransactionsToday = () => {
    const today = getTodayInTimezone(settings.system.timezone)
    return coins.transactions.filter(t =>
      isSameDate(t2d({ timestamp: t.timestamp, timezone: settings.system.timezone }), 
                t2d({ timestamp: today, timezone: settings.system.timezone }))
    ).length
  }

  const add = async (amount: number, description: string) => {
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive number"
      })
      return null
    }

    const data = await addCoins(amount, description)
    setCoins(data)
    toast({ title: "Success", description: `Added ${amount} coins` })
    return data
  }

  const remove = async (amount: number, description: string) => {
    const numAmount = Math.abs(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive number"
      })
      return null
    }

    const data = await removeCoins(numAmount, description)
    setCoins(data)
    toast({ title: "Success", description: `Removed ${numAmount} coins` })
    return data
  }

  return {
    add,
    remove,
    balance: coins.balance,
    transactions: coins.transactions,
    coinsEarnedToday: getCoinsEarnedToday(),
    totalEarned: getTotalEarned(),
    totalSpent: getTotalSpent(),
    coinsSpentToday: getCoinsSpentToday(),
    transactionsToday: getTransactionsToday()
  }
}
