'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'; // Added
import { Label } from '@/components/ui/label'; // Added
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Added
import { useHabits } from '@/hooks/useHabits'
import { browserSettingsAtom, habitsAtom } from '@/lib/atoms'
import { HabitIcon, TaskIcon } from '@/lib/constants'
import { Habit } from '@/lib/types'
import { getHabitFreq } from '@/lib/utils'; // Added
import { useAtom } from 'jotai'
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Plus, Search } from 'lucide-react'; // Added sort icons, Search icon
import { DateTime } from 'luxon'; // Added
import { useEffect, useMemo, useState } from 'react'; // Added useMemo, useEffect
import AddEditHabitModal from './AddEditHabitModal'
import ConfirmDialog from './ConfirmDialog'
import EmptyState from './EmptyState'
import HabitItem from './HabitItem'
import { ViewToggle } from './ViewToggle'

export default function HabitList() {
  const { saveHabit, deleteHabit } = useHabits()
  const [habitsData] = useAtom(habitsAtom) // setHabitsData removed as it's not used
  const [browserSettings] = useAtom(browserSettingsAtom)
  const isTasksView = browserSettings.viewType === 'tasks'
  // const [settings] = useAtom(settingsAtom); // settingsAtom is not directly used in HabitList itself.

  type SortableField = 'name' | 'coinReward' | 'dueDate' | 'frequency';
  type SortOrder = 'asc' | 'desc';

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortableField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  useEffect(() => {
    if (isTasksView && sortBy === 'frequency') {
      setSortBy('name');
    } else if (!isTasksView && sortBy === 'dueDate') {
      setSortBy('name');
    }
  }, [isTasksView, sortBy]);

  const compareHabits = useMemo(() => {
    return (a: Habit, b: Habit, currentSortBy: SortableField, currentSortOrder: SortOrder, tasksView: boolean): number => {
      let comparison = 0;
      switch (currentSortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'coinReward':
          comparison = a.coinReward - b.coinReward;
          break;
        case 'dueDate':
          if (tasksView && a.isTask && b.isTask) {
            const dateA = DateTime.fromISO(a.frequency);
            const dateB = DateTime.fromISO(b.frequency);
            if (dateA.isValid && dateB.isValid) comparison = dateA.toMillis() - dateB.toMillis();
            else if (dateA.isValid) comparison = -1; // Valid dates first
            else if (dateB.isValid) comparison = 1;
            // If both invalid, comparison remains 0
          }
          break;
        case 'frequency':
          if (!tasksView && !a.isTask && !b.isTask) {
            const freqOrder = ['daily', 'weekly', 'monthly', 'yearly'];
            const freqAVal = getHabitFreq(a);
            const freqBVal = getHabitFreq(b);
            comparison = freqOrder.indexOf(freqAVal) - freqOrder.indexOf(freqBVal);
          }
          break;
      }
      return currentSortOrder === 'asc' ? comparison : -comparison;
    };
  }, []);

  const allHabitsInView = useMemo(() => {
    return habitsData.habits.filter(habit =>
      isTasksView ? habit.isTask : !habit.isTask
    );
  }, [habitsData.habits, isTasksView]);

  const searchedHabits = useMemo(() => {
    if (!searchTerm.trim()) {
      return allHabitsInView;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return allHabitsInView.filter(habit =>
      habit.name.toLowerCase().includes(lowercasedSearchTerm) ||
      (habit.description && habit.description.toLowerCase().includes(lowercasedSearchTerm))
    );
  }, [allHabitsInView, searchTerm]);

  const activeHabits = useMemo(() => {
    return searchedHabits
      .filter(h => !h.archived)
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        // For items in the same pinned group (both pinned or both not pinned), apply general sort
        return compareHabits(a, b, sortBy, sortOrder, isTasksView);
      });
  }, [searchedHabits, sortBy, sortOrder, isTasksView, compareHabits]);

  const archivedHabits = useMemo(() => {
    return searchedHabits
      .filter(h => h.archived)
      .sort((a, b) => compareHabits(a, b, sortBy, sortOrder, isTasksView));
  }, [searchedHabits, sortBy, sortOrder, isTasksView, compareHabits]);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean,
    isTask: boolean
  }>({
    isOpen: false,
    isTask: false
  })
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
        <span>
          <Button className="mr-2" onClick={() => setModalConfig({ isOpen: true, isTask: true })}>
            <Plus className="mr-2 h-4 w-4" /> {'Add Task'}
          </Button>
          <Button onClick={() => setModalConfig({ isOpen: true, isTask: false })}>
            <Plus className="mr-2 h-4 w-4" /> {'Add Habit'}
          </Button>
        </span>
      </div>
      <div className='py-4'>
        <ViewToggle />
      </div>

      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-4 my-4">
        <div className="relative flex-grow w-full sm:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            type="search"
            placeholder={`Search ${isTasksView ? 'tasks' : 'habits'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center w-full sm:w-auto">
          <Label htmlFor="sort-by" className="text-sm font-medium whitespace-nowrap sr-only sm:not-sr-only">Sort by:</Label>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortableField)}>
            <SelectTrigger id="sort-by" className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="coinReward">Coin Reward</SelectItem>
              {isTasksView && <SelectItem value="dueDate">Due Date</SelectItem>}
              {!isTasksView && <SelectItem value="frequency">Frequency</SelectItem>}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}>
            {sortOrder === 'asc' ? <ArrowUpNarrowWide className="h-4 w-4" /> : <ArrowDownWideNarrow className="h-4 w-4" />}
            <span className="sr-only">Toggle sort order</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        {activeHabits.length === 0 && searchTerm.trim() ? (
          <div className="col-span-2 text-center text-muted-foreground py-8">
            No {isTasksView ? 'tasks' : 'habits'} found matching your search.
          </div>
        ) : activeHabits.length === 0 ? (
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
                  setModalConfig({ isOpen: true, isTask: isTasksView })
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
                  setModalConfig({ isOpen: true, isTask: isTasksView })
                }}
                onDelete={() => setDeleteConfirmation({ isOpen: true, habitId: habit.id })}
              />
            ))}
          </>
        )}
      </div>
      {modalConfig.isOpen &&
        <AddEditHabitModal
          onClose={() => {
            setModalConfig({ isOpen: false, isTask: false })
            setEditingHabit(null)
          }}
          onSave={async (habit) => {
            await saveHabit({ ...habit, id: editingHabit?.id, isTask: modalConfig.isTask })
            setModalConfig({ isOpen: false, isTask: false })
            setEditingHabit(null)
          }}
          habit={editingHabit}
          isTask={modalConfig.isTask}
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

