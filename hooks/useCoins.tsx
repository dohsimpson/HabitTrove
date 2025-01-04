import { useAtom } from 'jotai'
import { coinsAtom } from '@/lib/atoms'
import { addCoins, removeCoins } from '@/app/actions/data'
import { toast } from '@/hooks/use-toast'

export function useCoins() {
  const [coins, setCoins] = useAtom(coinsAtom)

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
    transactions: coins.transactions
  }
}
