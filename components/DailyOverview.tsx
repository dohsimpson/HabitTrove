import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger
} from "@/components/ui/context-menu"
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useHabits } from '@/hooks/useHabits'
import { browserSettingsAtom, completedHabitsMapAtom, hasTasksAtom, pomodoroAtom, settingsAtom } from '@/lib/atoms'
import { Habit, WishlistItemType } from '@/lib/types'
import { cn, d2t, getNow, getTodayInTimezone, isHabitDue, isSameDate, isTaskOverdue, t2d } from '@/lib/utils'
import { useAtom } from 'jotai'
import { AlertTriangle, ArrowRight, ChevronDown, ChevronUp, Circle, CircleCheck, Coins, Pin, Plus } from 'lucide-react'; // Removed unused icons
import Link from 'next/link'
import { useState } from 'react'
import AddEditHabitModal from './AddEditHabitModal'
import CompletionCountBadge from './CompletionCountBadge'
import ConfirmDialog from './ConfirmDialog'
import { HabitContextMenuItems } from './HabitContextMenuItems'
import Linkify from './linkify'
import { Button } from './ui/button'

interface UpcomingItemsProps {
  habits: Habit[]
  wishlistItems: WishlistItemType[]
  coinBalance: number
}

interface ItemSectionProps {
  title: string;
  items: Habit[];
  emptyMessage: string;
  isTask: boolean;
  viewLink: string;
  addNewItem: () => void;
}

const ItemSection = ({
  title,
  items,
  emptyMessage,
  isTask,
  viewLink,
  addNewItem,
}: ItemSectionProps) => {
  const { completeHabit, undoComplete, saveHabit, deleteHabit, archiveHabit, habitFreqMap } = useHabits();
  const [_, setPomo] = useAtom(pomodoroAtom);
  const [browserSettings, setBrowserSettings] = useAtom(browserSettingsAtom);
  const [settings] = useAtom(settingsAtom);
  const [completedHabitsMap] = useAtom(completedHabitsMapAtom);

  const today = getTodayInTimezone(settings.system.timezone);
  const currentTodayCompletions = completedHabitsMap.get(today) || [];
  const currentBadgeType = isTask ? 'tasks' : 'habits';

  const currentExpanded = isTask ? browserSettings.expandedTasks : browserSettings.expandedHabits;
  const setCurrentExpanded = (value: boolean) => {
    setBrowserSettings(prev => ({
      ...prev,
      [isTask ? 'expandedTasks' : 'expandedHabits']: value
    }));
  };

  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);

  const handleDeleteClick = (habit: Habit) => {
    setHabitToDelete(habit);
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (habitToDelete) {
      await deleteHabit(habitToDelete.id);
      setHabitToDelete(null);
      setIsConfirmDeleteDialogOpen(false);
    }
  };

  const handleEditClick = (habit: Habit) => {
    setHabitToEdit(habit);
  };

  if (items.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary"
            onClick={addNewItem}
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add {isTask ? "Task" : "Habit"}</span>
          </Button>
        </div>
        <div className="text-center text-muted-foreground text-sm py-4">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <CompletionCountBadge type={currentBadgeType} />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary"
            onClick={addNewItem}
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add {isTask ? "Task" : "Habit"}</span>
          </Button>
        </div>
      </div>
      <ul className={`grid gap-2 transition-all duration-300 ease-in-out ${currentExpanded ? 'max-h-none' : 'max-h-[200px]'} overflow-hidden`}>
        {items
          .sort((a, b) => {
            // First by pinned status
            if (a.pinned !== b.pinned) {
              return a.pinned ? -1 : 1;
            }

            // Then by completion status
            const aCompleted = currentTodayCompletions.includes(a);
            const bCompleted = currentTodayCompletions.includes(b);
            if (aCompleted !== bCompleted) {
              return aCompleted ? 1 : -1;
            }

            // Then by frequency (daily first)
            const aFreq = habitFreqMap.get(a.id) || 'daily';
            const bFreq = habitFreqMap.get(b.id) || 'daily';
            const freqOrder = ['daily', 'weekly', 'monthly', 'yearly'];
            if (freqOrder.indexOf(aFreq) !== freqOrder.indexOf(bFreq)) {
              return freqOrder.indexOf(aFreq) - freqOrder.indexOf(bFreq);
            }

            // Then by coin reward (higher first)
            if (a.coinReward !== b.coinReward) {
              return b.coinReward - a.coinReward;
            }

            // Finally by target completions (higher first)
            const aTarget = a.targetCompletions || 1;
            const bTarget = b.targetCompletions || 1;
            return bTarget - aTarget;
          })
          .slice(0, currentExpanded ? undefined : 5)
          .map((habit) => {
            const completionsToday = habit.completions.filter(completion =>
              isSameDate(t2d({ timestamp: completion, timezone: settings.system.timezone }), t2d({ timestamp: d2t({ dateTime: getNow({ timezone: settings.system.timezone }) }), timezone: settings.system.timezone }))
            ).length
            const target = habit.targetCompletions || 1
            const isCompleted = completionsToday >= target || (isTask && habit.archived)
            return (
              <li
                className={`flex items-center justify-between text-sm p-2 rounded-md
                ${isCompleted ? 'bg-secondary/50' : 'bg-secondary/20'}`}
                key={habit.id}
              >
                <span className="flex items-center gap-2 flex-1 min-w-0">
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <div className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (isCompleted) {
                                undoComplete(habit);
                              } else {
                                completeHabit(habit);
                              }
                            }}
                            className="relative hover:opacity-70 transition-opacity w-4 h-4"
                          >
                            {isCompleted ? (
                              <CircleCheck className="h-4 w-4 text-green-500" />
                            ) : (
                              <div className="relative h-4 w-4">
                                <Circle className="absolute h-4 w-4 text-muted-foreground" />
                                <div
                                  className="absolute h-4 w-4 rounded-full overflow-hidden"
                                  style={{
                                    background: `conic-gradient(
                                  currentColor ${(completionsToday / target) * 360}deg,
                                  transparent ${(completionsToday / target) * 360}deg 360deg
                                )`,
                                    mask: 'radial-gradient(transparent 50%, black 51%)',
                                    WebkitMask: 'radial-gradient(transparent 50%, black 51%)'
                                  }}
                                />
                              </div>
                            )}
                          </button>
                        </div>
                        <span className="flex items-center gap-1">
                          {habit.pinned && (
                            <Pin className="h-4 w-4 text-yellow-500" />
                          )}
                          <Link
                            href={`/habits?highlight=${habit.id}`}
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                            onClick={() => {
                              const newViewType = isTask ? 'tasks' : 'habits';
                              if (browserSettings.viewType !== newViewType) {
                                setBrowserSettings(prev => ({ ...prev, viewType: newViewType }));
                              }
                            }}
                          >
                            {isTask && isTaskOverdue(habit, settings.system.timezone) && !isCompleted && (
                              <TooltipProvider>
                                <Tooltip delayDuration={0}>
                                  <TooltipTrigger asChild>
                                    {/* The AlertTriangle itself doesn't need hover styles if the parent Link handles it */}
                                    <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Overdue</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            <span
                              className={cn(
                                isCompleted ? 'line-through' : '',
                                'break-all' // Text specific styles
                              )}
                            >
                              {habit.name}
                            </span>
                          </Link>
                        </span>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-64">
                      <HabitContextMenuItems
                        habit={habit}
                        onEditRequest={() => handleEditClick(habit)}
                        onDeleteRequest={() => handleDeleteClick(habit)}
                        context="daily-overview"
                      />
                    </ContextMenuContent>
                  </ContextMenu>
                </span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                  {habit.targetCompletions && (
                    <span className="bg-secondary px-1.5 py-0.5 rounded-full">
                      {completionsToday}/{target}
                    </span>
                  )}
                  {habitFreqMap.get(habit.id) !== 'daily' && (
                    <Badge variant="outline" className="text-xs">
                      {habitFreqMap.get(habit.id)}
                    </Badge>
                  )}
                  <span className="flex items-center">
                    <Coins className={cn(
                      "h-3 w-3 mr-1 transition-all",
                      isCompleted
                        ? "text-yellow-500 drop-shadow-[0_0_2px_rgba(234,179,8,0.3)]"
                        : "text-gray-400"
                    )} />
                    <span className={cn(
                      "transition-all",
                      isCompleted
                        ? "text-yellow-500 font-medium"
                        : "text-gray-400"
                    )}>
                      {habit.coinReward}
                    </span>
                  </span>
                </span>
              </li>
            )
          })}
      </ul>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentExpanded(!currentExpanded)}
          className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
        >
          {currentExpanded ? (
            <>
              Show less
              <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              Show all
              <ChevronDown className="h-3 w-3" />
            </>
          )}
        </button>
        <Link
          href={viewLink}
          className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
          onClick={() => {
            const newViewType = isTask ? 'tasks' : 'habits';
            if (browserSettings.viewType !== newViewType) {
              setBrowserSettings(prev => ({ ...prev, viewType: newViewType }));
            }
          }}
        >
          View
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {habitToDelete && (
        <ConfirmDialog
          isOpen={isConfirmDeleteDialogOpen}
          onClose={() => setIsConfirmDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
          title={`Delete ${isTask ? 'Task' : 'Habit'}`}
          message={`Are you sure you want to delete "${habitToDelete.name}"? This action cannot be undone.`}
          confirmText="Delete"
        />
      )}
      {habitToEdit && (
        <AddEditHabitModal
          onClose={() => setHabitToEdit(null)}
          onSave={async (updatedHabit) => {
            await saveHabit({ ...habitToEdit, ...updatedHabit });
            setHabitToEdit(null);
          }}
          habit={habitToEdit}
          isTask={habitToEdit.isTask || false}
        />
      )}
    </div>
  );
};

export default function DailyOverview({
  habits,
  wishlistItems,
  coinBalance,
}: UpcomingItemsProps) {
  const { completeHabit, undoComplete } = useHabits()
  const [settings] = useAtom(settingsAtom)
  const [completedHabitsMap] = useAtom(completedHabitsMapAtom)
  const [browserSettings, setBrowserSettings] = useAtom(browserSettingsAtom)
  const today = getTodayInTimezone(settings.system.timezone)
  const todayCompletions = completedHabitsMap.get(today) || []
  const { saveHabit } = useHabits()

  const timezone = settings.system.timezone
  const todayDateObj = getNow({ timezone })

  const dailyTasks = habits.filter(habit =>
    habit.isTask &&
    !habit.archived &&
    (isHabitDue({ habit, timezone, date: todayDateObj }) || isTaskOverdue(habit, timezone))
  )
  const dailyHabits = habits.filter(habit =>
    !habit.isTask &&
    !habit.archived &&
    isHabitDue({ habit, timezone, date: todayDateObj })
  )

  // Get all wishlist items sorted by redeemable status (non-redeemable first) then by coin cost
  // Filter out archived wishlist items
  const sortedWishlistItems = wishlistItems
    .filter(item => !item.archived)
    .sort((a, b) => {
      const aRedeemable = a.coinCost <= coinBalance
      const bRedeemable = b.coinCost <= coinBalance

      // Non-redeemable items first
      if (aRedeemable !== bRedeemable) {
        return aRedeemable ? 1 : -1
      }

      // Then sort by coin cost (lower cost first)
      return a.coinCost - b.coinCost
    })

  const [hasTasks] = useAtom(hasTasksAtom)
  const [, setPomo] = useAtom(pomodoroAtom)
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean,
    isTask: boolean
  }>({
    isOpen: false,
    isTask: false
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Today's Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Tasks Section */}
            {hasTasks && (
              <ItemSection
                title="Daily Tasks"
                items={dailyTasks}
                emptyMessage="No tasks due today. Add some tasks to get started!"
                isTask={true}
                viewLink="/habits?view=tasks"
                addNewItem={() => setModalConfig({ isOpen: true, isTask: true })}
              />
            )}

            {/* Habits Section */}
            <ItemSection
              title="Daily Habits"
              items={dailyHabits}
              emptyMessage="No habits due today. Add some habits to get started!"
              isTask={false}
              viewLink="/habits"
              addNewItem={() => setModalConfig({ isOpen: true, isTask: false })}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Wishlist Goals</h3>
                <Badge variant="secondary">
                  {wishlistItems.filter(item => item.coinCost <= coinBalance).length}/{wishlistItems.length} Redeemable
                </Badge>
              </div>
              <div>
                <div className={`space-y-3 transition-all duration-300 ease-in-out ${browserSettings.expandedWishlist ? 'max-h-none' : 'max-h-[200px]'} overflow-hidden`}>
                  {sortedWishlistItems.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-4">
                      No wishlist items yet. Add some goals to work towards!
                    </div>
                  ) : (
                    <>
                      {sortedWishlistItems
                        .slice(0, browserSettings.expandedWishlist ? undefined : 5)
                        .map((item) => {
                          const isRedeemable = item.coinCost <= coinBalance
                          return (
                            <Link
                              key={item.id}
                              href={`/wishlist?highlight=${item.id}`}
                              className={cn(
                                "block p-3 rounded-md hover:bg-secondary/30 transition-colors",
                                isRedeemable ? 'bg-green-500/10' : 'bg-secondary/20'
                              )}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm">
                                  <Linkify>{item.name}</Linkify>
                                </span>
                                <span className="text-xs flex items-center">
                                  <Coins className={cn(
                                    "h-3 w-3 mr-1 transition-all",
                                    isRedeemable
                                      ? "text-yellow-500 drop-shadow-[0_0_2px_rgba(234,179,8,0.3)]"
                                      : "text-gray-400"
                                  )} />
                                  <span className={cn(
                                    "transition-all",
                                    isRedeemable
                                      ? "text-yellow-500 font-medium"
                                      : "text-gray-400"
                                  )}>
                                    {item.coinCost}
                                  </span>
                                </span>
                              </div>
                              <Progress
                                value={(coinBalance / item.coinCost) * 100}
                                className={cn(
                                  "h-2",
                                  isRedeemable ? "bg-green-500/20" : ""
                                )}
                              />
                              <p className="text-xs text-muted-foreground mt-2">
                                {isRedeemable
                                  ? "Ready to redeem!"
                                  : `${item.coinCost - coinBalance} coins to go`
                                }
                              </p>
                            </Link>
                          )
                        })}
                    </>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setBrowserSettings(prev => ({ ...prev, expandedWishlist: !prev.expandedWishlist }))}
                    className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                  >
                    {browserSettings.expandedWishlist ? (
                      <>
                        Show less
                        <ChevronUp className="h-3 w-3" />
                      </>
                    ) : (
                      <>
                        Show all
                        <ChevronDown className="h-3 w-3" />
                      </>
                    )}
                  </button>
                  <Link
                    href="/wishlist"
                    className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                  >
                    View
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {modalConfig.isOpen && (
        <AddEditHabitModal
          onClose={() => setModalConfig({ isOpen: false, isTask: false })}
          onSave={async (habit) => {
            await saveHabit({ ...habit, isTask: modalConfig.isTask })
            setModalConfig({ isOpen: false, isTask: false });
          }}
          habit={null}
          isTask={modalConfig.isTask}
        />
      )}
    </>
  )
}
