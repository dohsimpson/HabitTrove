import { useAtom } from 'jotai'
import { habitsAtom, coinsAtom, settingsAtom } from '@/lib/atoms'
import { addCoins, removeCoins, saveHabitsData } from '@/app/actions/data'
import { Habit } from '@/lib/types'
import { getNowInMilliseconds, getTodayInTimezone } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { Undo2 } from 'lucide-react'

export function useHabits() {
  const [habitsData, setHabitsData] = useAtom(habitsAtom)
  const [coins, setCoins] = useAtom(coinsAtom)
  const [settings] = useAtom(settingsAtom)

  const completeHabit = async (habit: Habit) => {
    const timezone = settings.system.timezone
    const today = getTodayInTimezone(timezone)
    if (!habit.completions.includes(today)) {
      const updatedHabit = {
        ...habit,
        completions: [...habit.completions, today]
      }
      const updatedHabits = habitsData.habits.map(h =>
        h.id === habit.id ? updatedHabit : h
      )
      await saveHabitsData({ habits: updatedHabits })
      setHabitsData({ habits: updatedHabits })

      const coinsData = await addCoins(habit.coinReward, `Completed habit: ${habit.name}`, 'HABIT_COMPLETION', habit.id)
      setCoins(coinsData)

      toast({
        title: "Habit completed!",
        description: `You earned ${habit.coinReward} coins.`,
        action: <ToastAction altText="Undo" className="gap-2" onClick={() => undoComplete(habit)}>
          <Undo2 className="h-4 w-4" />Undo
        </ToastAction>
      })

      return {
        updatedHabits,
        newBalance: coinsData.balance,
        newTransactions: coinsData.transactions
      }
    } else {
      toast({
        title: "Habit already completed",
        description: "You've already completed this habit today.",
        variant: "destructive",
      })
      return null
    }
  }

  const undoComplete = async (habit: Habit) => {
    const timezone = settings.system.timezone
    const today = getTodayInTimezone(timezone)
    const updatedHabit = {
      ...habit,
      completions: habit.completions.filter(date => date !== today)
    }
    const updatedHabits = habitsData.habits.map(h =>
      h.id === habit.id ? updatedHabit : h
    )
    await saveHabitsData({ habits: updatedHabits })
    setHabitsData({ habits: updatedHabits })

    const coinsData = await removeCoins(habit.coinReward, `Undid habit completion: ${habit.name}`, 'HABIT_UNDO', habit.id)
    setCoins(coinsData)

    toast({
      title: "Completion undone",
      description: `${habit.coinReward} coins have been deducted.`,
      action: <ToastAction altText="Redo" onClick={() => completeHabit(habit)}>
        <Undo2 className="h-4 w-4" />Undo
      </ToastAction>
    })

    return {
      updatedHabits,
      newBalance: coinsData.balance,
      newTransactions: coinsData.transactions
    }
  }

  const saveHabit = async (habit: Omit<Habit, 'id'> & { id?: string }) => {
    const newHabit = {
      ...habit,
      id: habit.id || getNowInMilliseconds().toString()
    }
    const updatedHabits = habit.id
      ? habitsData.habits.map(h => h.id === habit.id ? newHabit : h)
      : [...habitsData.habits, newHabit]

    await saveHabitsData({ habits: updatedHabits })
    setHabitsData({ habits: updatedHabits })
    return updatedHabits
  }

  const deleteHabit = async (id: string) => {
    const updatedHabits = habitsData.habits.filter(h => h.id !== id)
    await saveHabitsData({ habits: updatedHabits })
    setHabitsData({ habits: updatedHabits })
    return updatedHabits
  }

  return {
    completeHabit,
    undoComplete,
    saveHabit,
    deleteHabit
  }
}
