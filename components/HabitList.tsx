'use client'

import { useState } from 'react'
import { Plus, ListTodo } from 'lucide-react'
import { useAtom } from 'jotai'
import { habitsAtom, settingsAtom, browserSettingsAtom } from '@/lib/atoms'
import EmptyState from './EmptyState'
import { Button } from '@/components/ui/button'
import HabitItem from './HabitItem'
import AddEditHabitModal from './AddEditHabitModal'
import ConfirmDialog from './ConfirmDialog'
import { Habit } from '@/lib/types'
import { useHabits } from '@/hooks/useHabits'
import { HabitIcon, TaskIcon } from '@/lib/constants'
import { ViewToggle } from './ViewToggle'

export default function HabitList() {
  const { saveHabit, deleteHabit } = useHabits()
  const [habitsData, setHabitsData] = useAtom(habitsAtom)
  const [browserSettings] = useAtom(browserSettingsAtom)
  const isTasksView = browserSettings.viewType === 'tasks'
  const habits = habitsData.habits.filter(habit => 
    isTasksView ? habit.isTask : !habit.isTask
  )
  const activeHabits = habits.filter(h => !h.archived)
  const archivedHabits = habits.filter(h => h.archived)
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
        <h1 className="text-3xl font-bold">
          {isTasksView ? 'My Tasks' : 'My Habits'}
        </h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> {isTasksView ? 'Add Task' : 'Add Habit'}
        </Button>
      </div>
      <div className='py-4'>
        <ViewToggle />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        {activeHabits.length === 0 ? (
          <div className="col-span-2">
            <EmptyState
              icon={isTasksView ? TaskIcon : HabitIcon}
              title={isTasksView ? "No tasks yet" : "No habits yet"}
              description={isTasksView ? "Create your first task to start tracking your progress" : "Create your first habit to start tracking your progress"}
            />
          </div>
        ) : (
          activeHabits.map((habit: Habit) => (
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
        
        {archivedHabits.length > 0 && (
          <>
            <div className="col-span-1 sm:col-span-2 relative flex items-center my-6">
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600" />
              <span className="mx-4 text-sm text-gray-500 dark:text-gray-400">Archived</span>
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600" />
            </div>
            {archivedHabits.map((habit: Habit) => (
              <HabitItem
                key={habit.id}
                habit={habit}
                onEdit={() => {
                  setEditingHabit(habit)
                  setIsModalOpen(true)
                }}
                onDelete={() => setDeleteConfirmation({ isOpen: true, habitId: habit.id })}
              />
            ))}
          </>
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
        title={isTasksView ? "Delete Task" : "Delete Habit"}
        message={isTasksView ? "Are you sure you want to delete this task? This action cannot be undone." : "Are you sure you want to delete this habit? This action cannot be undone."}
        confirmText="Delete"
      />
    </div>
  )
}

