import { useState, useEffect } from 'react'
import { loadCoinsData, addCoins, removeCoins } from '@/app/actions/data'
import { toast } from '@/hooks/use-toast'
import { CoinTransaction, TransactionType } from '@/lib/types'

export function useCoins() {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<CoinTransaction[]>([])

  useEffect(() => {
    fetchCoins()
  }, [])

  const fetchCoins = async () => {
    const data = await loadCoinsData()
    setBalance(data.balance)
    setTransactions(data.transactions || [])
  }

  const addAmount = async (
    amount: number,
    description: string,
    type: TransactionType = 'MANUAL_ADJUSTMENT',
    relatedItemId?: string
  ) => {
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive number"
      })
      return null
    }

    const data = await addCoins(amount, description, type, relatedItemId)
    setBalance(data.balance)
    setTransactions(data.transactions)
    return data
  }

  const removeAmount = async (
    amount: number,
    description: string,
    type: TransactionType = 'MANUAL_ADJUSTMENT',
    relatedItemId?: string
  ) => {
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive number"
      })
      return null
    }

    const data = await removeCoins(amount, description, type, relatedItemId)
    setBalance(data.balance)
    setTransactions(data.transactions)
    return data
  }

  return {
    balance,
    transactions,
    addAmount,
    removeAmount,
    fetchCoins
  }
}
