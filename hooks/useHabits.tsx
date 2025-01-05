import { useAtom } from 'jotai'
import { habitsAtom, coinsAtom, settingsAtom } from '@/lib/atoms'
import { addCoins, removeCoins, saveHabitsData } from '@/app/actions/data'
import { Habit } from '@/lib/types'
import { getNowInMilliseconds, getTodayInTimezone, isSameDate, t2d, d2t, getNow, getCompletionsForDate } from '@/lib/utils'
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

    // Get current completions for today
    const completionsToday = getCompletionsForDate({
      habit,
      date: today,
      timezone
    })
    const target = habit.targetCompletions || 1

    // Add new completion
    const updatedHabit = {
      ...habit,
      completions: [...habit.completions, d2t({ dateTime: getNow({ timezone }) })]
    }

    const updatedHabits = habitsData.habits.map(h =>
      h.id === habit.id ? updatedHabit : h
    )

    await saveHabitsData({ habits: updatedHabits })
    setHabitsData({ habits: updatedHabits })

    // Check if we've now reached the target
    const isTargetReached = completionsToday + 1 === target
    if (isTargetReached) {
      const updatedCoins = await addCoins(
        habit.coinReward,
        `Completed habit: ${habit.name}`,
        'HABIT_COMPLETION',
        habit.id
      )
      setCoins(updatedCoins)
    }

    toast({
      title: isTargetReached ? "Habit completed!" : "Progress!",
      description: isTargetReached
        ? `You earned ${habit.coinReward} coins.`
        : `You've completed ${completionsToday + 1}/${target} times today.`,
      action: <ToastAction altText="Undo" className="gap-2" onClick={() => undoComplete(habit)}>
        <Undo2 className="h-4 w-4" />Undo
      </ToastAction>
    })

    return {
      updatedHabits,
      newBalance: coins.balance,
      newTransactions: coins.transactions
    }
  }

  const undoComplete = async (habit: Habit) => {
    const timezone = settings.system.timezone
    const today = t2d({ timestamp: getTodayInTimezone(timezone), timezone })

    // Get today's completions
    const todayCompletions = habit.completions.filter(completion =>
      isSameDate(t2d({ timestamp: completion, timezone }), today)
    )

    if (todayCompletions.length > 0) {
      // Remove the most recent completion
      const updatedHabit = {
        ...habit,
        completions: habit.completions.filter(
          (_, index) => index !== habit.completions.length - 1
        )
      }

      const updatedHabits = habitsData.habits.map(h =>
        h.id === habit.id ? updatedHabit : h
      )

      await saveHabitsData({ habits: updatedHabits })
      setHabitsData({ habits: updatedHabits })

      // If we were at the target, remove the coins
      const target = habit.targetCompletions || 1
      if (todayCompletions.length === target) {
        const updatedCoins = await removeCoins(
          habit.coinReward,
          `Undid habit completion: ${habit.name}`,
          'HABIT_UNDO',
          habit.id
        )
        setCoins(updatedCoins)
      }

      toast({
        title: "Completion undone",
        description: `You have ${getCompletionsForDate({
          habit: updatedHabit,
          date: today,
          timezone
        })}/${target} completions today.`,
        action: <ToastAction altText="Redo" onClick={() => completeHabit(habit)}>
          <Undo2 className="h-4 w-4" />Redo
        </ToastAction>
      })

      return {
        updatedHabits,
        newBalance: coins.balance,
        newTransactions: coins.transactions
      }
    } else {
      toast({
        title: "No completions to undo",
        description: "This habit hasn't been completed today.",
        variant: "destructive",
      })
      return null
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
