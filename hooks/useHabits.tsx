import { useAtom } from 'jotai'
import { habitsAtom, coinsAtom, settingsAtom } from '@/lib/atoms'
import { addCoins, removeCoins, saveHabitsData } from '@/app/actions/data'
import { Habit } from '@/lib/types'
import { DateTime } from 'luxon'
import { getNowInMilliseconds, getTodayInTimezone, isSameDate, t2d, d2t, getNow, getCompletionsForDate, getISODate, d2s } from '@/lib/utils'
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

    // Check if already completed
    if (completionsToday >= target) {
      toast({
        title: "Already completed",
        description: `You've already completed this habit today.`,
        variant: "destructive",
      })
      return null
    }

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
      const updatedCoins = await addCoins({
        amount: habit.coinReward,
        description: `Completed habit: ${habit.name}`,
        type: habit.isTask ? 'TASK_COMPLETION' : 'HABIT_COMPLETION',
        relatedItemId: habit.id,
      })
      setCoins(updatedCoins)
    }

    toast({
      title: isTargetReached ? "Habit completed!" : "Progress!",
      description: isTargetReached
        ? `You earned ${habit.coinReward} coins.`
        : `You've completed ${completionsToday + 1}/${target} times today.`,
      action: <ToastAction altText="Undo" className="gap-2" onClick={() => undoComplete(updatedHabit)}>
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
        const updatedCoins = await removeCoins({
          amount: habit.coinReward,
          description: `Undid habit completion: ${habit.name}`,
          type: habit.isTask ? 'TASK_UNDO' : 'HABIT_UNDO',
          relatedItemId: habit.id,
        })
        setCoins(updatedCoins)
      }

      toast({
        title: "Completion undone",
        description: `You have ${getCompletionsForDate({
          habit: updatedHabit,
          date: today,
          timezone
        })}/${target} completions today.`,
        action: <ToastAction altText="Redo" onClick={() => completeHabit(updatedHabit)}>
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

  const completePastHabit = async (habit: Habit, date: DateTime) => {
    const timezone = settings.system.timezone
    const dateKey = getISODate({ dateTime: date, timezone })

    // Check if already completed on this date
    const completionsOnDate = habit.completions.filter(completion =>
      isSameDate(t2d({ timestamp: completion, timezone }), date)
    ).length
    const target = habit.targetCompletions || 1

    if (completionsOnDate >= target) {
      toast({
        title: "Already completed",
        description: `This habit was already completed on ${d2s({ dateTime: date, timezone, format: 'yyyy-MM-dd' })}.`,
        variant: "destructive",
      })
      return null
    }

    // Use current time but with the past date
    const now = getNow({ timezone })
    const completionDateTime = date.set({
      hour: now.hour,
      minute: now.minute,
      second: now.second,
      millisecond: now.millisecond
    })
    const completionTimestamp = d2t({ dateTime: completionDateTime })
    const updatedHabit = {
      ...habit,
      completions: [...habit.completions, completionTimestamp]
    }

    const updatedHabits = habitsData.habits.map(h =>
      h.id === habit.id ? updatedHabit : h
    )

    await saveHabitsData({ habits: updatedHabits })
    setHabitsData({ habits: updatedHabits })

    // Check if we've now reached the target
    const isTargetReached = completionsOnDate + 1 === target
    if (isTargetReached) {
      const updatedCoins = await addCoins({
        amount: habit.coinReward,
        description: `Completed habit: ${habit.name} on ${d2s({ dateTime: date, timezone, format: 'yyyy-MM-dd' })}`,
        type: habit.isTask ? 'TASK_COMPLETION' : 'HABIT_COMPLETION',
        relatedItemId: habit.id,
      })
      setCoins(updatedCoins)
    }

    toast({
      title: isTargetReached ? "Habit completed!" : "Progress!",
      description: isTargetReached
        ? `You earned ${habit.coinReward} coins for ${dateKey}.`
        : `You've completed ${completionsOnDate + 1}/${target} times on ${dateKey}.`,
      action: <ToastAction altText="Undo" className="gap-2" onClick={() => undoComplete(updatedHabit)}>
        <Undo2 className="h-4 w-4" />Undo
      </ToastAction>
    })

    return {
      updatedHabits,
      newBalance: coins.balance,
      newTransactions: coins.transactions
    }
  }

  const archiveHabit = async (id: string) => {
    const updatedHabits = habitsData.habits.map(h =>
      h.id === id ? { ...h, archived: true } : h
    )
    await saveHabitsData({ habits: updatedHabits })
    setHabitsData({ habits: updatedHabits })
  }

  const unarchiveHabit = async (id: string) => {
    const updatedHabits = habitsData.habits.map(h =>
      h.id === id ? { ...h, archived: undefined } : h
    )
    await saveHabitsData({ habits: updatedHabits })
    setHabitsData({ habits: updatedHabits })
  }

  return {
    completeHabit,
    undoComplete,
    saveHabit,
    deleteHabit,
    completePastHabit,
    archiveHabit,
    unarchiveHabit
  }
}
