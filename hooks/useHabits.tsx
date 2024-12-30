import { useState, useEffect } from 'react'
import { loadHabitsData, saveHabitsData, addCoins, removeCoins } from '@/app/actions/data'
import { toast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { Undo2 } from 'lucide-react'
import { Habit } from '@/lib/types'

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([])

  useEffect(() => {
    fetchHabits()
  }, [])

  const fetchHabits = async () => {
    const data = await loadHabitsData()
    setHabits(data.habits)
  }

  const addHabit = async (habit: Omit<Habit, 'id'>) => {
    const newHabit = { ...habit, id: Date.now().toString() }
    const newHabits = [...habits, newHabit]
    setHabits(newHabits)
    await saveHabitsData({ habits: newHabits })
  }

  const editHabit = async (updatedHabit: Habit) => {
    const newHabits = habits.map(habit =>
      habit.id === updatedHabit.id ? updatedHabit : habit
    )
    setHabits(newHabits)
    await saveHabitsData({ habits: newHabits })
  }

  const deleteHabit = async (id: string) => {
    const newHabits = habits.filter(habit => habit.id !== id)
    setHabits(newHabits)
    await saveHabitsData({ habits: newHabits })
  }

  const completeHabit = async (habit: Habit) => {
    const today = new Date().toISOString().split('T')[0]
    if (!habit.completions.includes(today)) {
      const updatedHabit = {
        ...habit,
        completions: [...habit.completions, today]
      }
      const updatedHabits = habits.map(h =>
        h.id === habit.id ? updatedHabit : h
      )
      await saveHabitsData({ habits: updatedHabits })
      const coinsData = await addCoins(habit.coinReward, `Completed habit: ${habit.name}`, 'HABIT_COMPLETION', habit.id)

      setHabits(updatedHabits)

      toast({
        title: "Habit completed!",
        description: `You earned ${habit.coinReward} coins.`,
        action: <ToastAction altText="Undo" className="gap-2" onClick={() => undoComplete(habit)}><Undo2 className="h-4 w-4" />Undo</ToastAction>
      })

      return coinsData.balance
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
    const today = new Date().toISOString().split('T')[0]
    const updatedHabit = {
      ...habit,
      completions: habit.completions.filter(date => date !== today)
    }
    const updatedHabits = habits.map(h =>
      h.id === habit.id ? updatedHabit : h
    )
    await saveHabitsData({ habits: updatedHabits })
    const coinsData = await removeCoins(habit.coinReward, `Undid habit completion: ${habit.name}`, 'HABIT_UNDO', habit.id)

    setHabits(updatedHabits)

    toast({
      title: "Completion undone",
      description: `${habit.coinReward} coins have been deducted.`,
      action: <ToastAction altText="Redo" onClick={() => completeHabit(habit)}><Undo2 className="h-4 w-4" />Undo</ToastAction>
    })

    return coinsData.balance
  }

  return {
    habits,
    addHabit,
    editHabit,
    deleteHabit,
    completeHabit,
    undoComplete
  }
}
