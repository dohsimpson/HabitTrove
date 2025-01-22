import { useAtom } from 'jotai'
import {
  coinsAtom,
  coinsEarnedTodayAtom,
  totalEarnedAtom,
  totalSpentAtom,
  coinsSpentTodayAtom,
  transactionsTodayAtom
} from '@/lib/atoms'
import { addCoins, removeCoins, saveCoinsData } from '@/app/actions/data'
import { CoinsData } from '@/lib/types'
import { toast } from '@/hooks/use-toast'

export function useCoins() {
  const [coins, setCoins] = useAtom(coinsAtom)
  const [coinsEarnedToday] = useAtom(coinsEarnedTodayAtom)
  const [totalEarned] = useAtom(totalEarnedAtom)
  const [totalSpent] = useAtom(totalSpentAtom)
  const [coinsSpentToday] = useAtom(coinsSpentTodayAtom)
  const [transactionsToday] = useAtom(transactionsTodayAtom)

  const add = async (amount: number, description: string, note?: string) => {
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
      note
    })
    setCoins(data)
    toast({ title: "Success", description: `Added ${amount} coins` })
    return data
  }

  const remove = async (amount: number, description: string, note?: string) => {
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
      note
    })
    setCoins(data)
    toast({ title: "Success", description: `Removed ${numAmount} coins` })
    return data
  }

  const updateNote = async (transactionId: string, note: string) => {
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
    balance: coins.balance,
    transactions: coins.transactions,
    coinsEarnedToday,
    totalEarned,
    totalSpent,
    coinsSpentToday,
    transactionsToday
  }
}
