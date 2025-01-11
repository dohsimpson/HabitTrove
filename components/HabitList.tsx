'use client'

import { useState } from 'react'
import { Plus, ListTodo } from 'lucide-react'
import { useAtom } from 'jotai'
import { habitsAtom, settingsAtom } from '@/lib/atoms'
import EmptyState from './EmptyState'
import { Button } from '@/components/ui/button'
import HabitItem from './HabitItem'
import AddEditHabitModal from './AddEditHabitModal'
import ConfirmDialog from './ConfirmDialog'
import { Habit } from '@/lib/types'
import { useHabits } from '@/hooks/useHabits'

export default function HabitList() {
  const { saveHabit, deleteHabit } = useHabits()
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
            />
          ))
        )}
      </div>
      {isModalOpen &&
        <AddEditHabitModal
          onClose={() => {
            setIsModalOpen(false)
            setEditingHabit(null)
          }}
          onSave={async (habit) => {
            await saveHabit({ ...habit, id: editingHabit?.id })
            setIsModalOpen(false)
            setEditingHabit(null)
          }}
          habit={editingHabit}
        />
      }
      <ConfirmDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, habitId: null })}
        onConfirm={async () => {
          if (deleteConfirmation.habitId) {
            await deleteHabit(deleteConfirmation.habitId)
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

