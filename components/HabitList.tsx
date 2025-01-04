'use client'

import { useState, useEffect } from 'react'
import { loadHabitsData, saveHabitsData, addCoins, removeCoins } from '@/app/actions/data'
import { Plus, ListTodo, Undo2 } from 'lucide-react'
import { useAtom } from 'jotai'
import { habitsAtom, settingsAtom } from '@/lib/atoms'
import { getTodayInTimezone, getNowInMilliseconds } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import EmptyState from './EmptyState'
import { Button } from '@/components/ui/button'
import HabitItem from './HabitItem'
import AddEditHabitModal from './AddEditHabitModal'
import ConfirmDialog from './ConfirmDialog'
import { Habit } from '@/lib/types'

export default function HabitList() {
  const [habitsData, setHabitsData] = useAtom(habitsAtom)
  const habits = habitsData.habits
  const [settings] = useAtom(settingsAtom)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean, habitId: string | null }>({
    isOpen: false,
    habitId: null
  })


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Habits</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Habit
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {habits.length === 0 ? (
          <div className="col-span-2">
            <EmptyState
              icon={ListTodo}
              title="No habits yet"
              description="Create your first habit to start tracking your progress"
            />
          </div>
        ) : (
          habits.map((habit) => (
            <HabitItem
              key={habit.id}
              habit={habit}
              onEdit={() => {
                setEditingHabit(habit)
                setIsModalOpen(true)
              }}
              onDelete={() => setDeleteConfirmation({ isOpen: true, habitId: habit.id })}
              onComplete={async () => {
                const today = getTodayInTimezone(settings.system.timezone)
                if (!habit.completions.includes(today)) {
                  const updatedHabit = {
                    ...habit,
                    completions: [...habit.completions, today]
                  }
                  const updatedHabits = habits.map(h =>
                    h.id === habit.id ? updatedHabit : h
                  )
                  await saveHabitsData({ habits: updatedHabits })
                  await addCoins(habit.coinReward, `Completed habit: ${habit.name}`, 'HABIT_COMPLETION', habit.id)
                  setHabitsData({ habits: updatedHabits })
                  toast({
                    title: "Habit completed!",
                    description: `You earned ${habit.coinReward} coins.`,
                    action: <ToastAction altText="Undo" className="gap-2" onClick={async () => {
                      const updatedHabit = {
                        ...habit,
                        completions: habit.completions.filter(date => date !== today)
                      }
                      const updatedHabits = habits.map(h =>
                        h.id === habit.id ? updatedHabit : h
                      )
                      await saveHabitsData({ habits: updatedHabits })
                      await removeCoins(habit.coinReward, `Undid habit completion: ${habit.name}`, 'HABIT_UNDO', habit.id)
                      setHabitsData({ habits: updatedHabits })
                    }}><Undo2 className="h-4 w-4" />Undo</ToastAction>
                  })
                } else {
                  toast({
                    title: "Habit already completed",
                    description: "You've already completed this habit today.",
                    variant: "destructive",
                  })
                }
              }}
              onUndo={async () => {
                const today = getTodayInTimezone(settings.system.timezone)
                const updatedHabit = {
                  ...habit,
                  completions: habit.completions.filter(date => date !== today)
                }
                const updatedHabits = habits.map(h =>
                  h.id === habit.id ? updatedHabit : h
                )
                await saveHabitsData({ habits: updatedHabits })
                await removeCoins(habit.coinReward, `Undid habit completion: ${habit.name}`, 'HABIT_UNDO', habit.id)
                setHabitsData({ habits: updatedHabits })
                toast({
                  title: "Completion undone",
                  description: `${habit.coinReward} coins have been deducted.`,
                  action: <ToastAction altText="Redo" onClick={async () => {
                    const updatedHabit = {
                      ...habit,
                      completions: [...habit.completions, today]
                    }
                    const updatedHabits = habits.map(h =>
                      h.id === habit.id ? updatedHabit : h
                    )
                    await saveHabitsData({ habits: updatedHabits })
                    await addCoins(habit.coinReward, `Completed habit: ${habit.name}`, 'HABIT_COMPLETION', habit.id)
                    setHabitsData({ habits: updatedHabits })
                  }}><Undo2 className="h-4 w-4" />Undo</ToastAction>
                })
              }}
            />
          ))
        )}
      </div>
      <AddEditHabitModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingHabit(null)
        }}
        onSave={async (habit) => {
          if (editingHabit) {
            const updatedHabits = habits.map(h =>
              h.id === editingHabit.id ? { ...habit, id: editingHabit.id } : h
            )
            await saveHabitsData({ habits: updatedHabits })
            setHabitsData({ habits: updatedHabits })
          } else {
            const newHabit = { ...habit, id: getNowInMilliseconds() }
            const newHabits = [...habits, newHabit]
            await saveHabitsData({ habits: newHabits })
            setHabitsData({ habits: newHabits })
          }
          setIsModalOpen(false)
          setEditingHabit(null)
        }}
        habit={editingHabit}
      />
      <ConfirmDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, habitId: null })}
        onConfirm={async () => {
          if (deleteConfirmation.habitId) {
            const newHabits = habits.filter(habit => habit.id !== deleteConfirmation.habitId)
            await saveHabitsData({ habits: newHabits })
            setHabitsData({ habits: newHabits })
          }
          setDeleteConfirmation({ isOpen: false, habitId: null })
        }}
        title="Delete Habit"
        message="Are you sure you want to delete this habit? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  )
}

