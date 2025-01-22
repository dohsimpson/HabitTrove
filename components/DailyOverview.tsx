import { Circle, Coins, ArrowRight, CircleCheck, ChevronDown, ChevronUp, Timer } from 'lucide-react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { cn, isHabitDueToday, getHabitFreq } from '@/lib/utils'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { pomodoroAtom, settingsAtom, completedHabitsMapAtom, transientSettingsAtom } from '@/lib/atoms'
import { getTodayInTimezone, isSameDate, t2d, d2t, getNow } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { WishlistItemType } from '@/lib/types'
import { Habit } from '@/lib/types'
import Linkify from './linkify'
import { useHabits } from '@/hooks/useHabits'

interface UpcomingItemsProps {
  habits: Habit[]
  wishlistItems: WishlistItemType[]
  coinBalance: number
}

export default function DailyOverview({
  habits,
  wishlistItems,
  coinBalance,
}: UpcomingItemsProps) {
  const { completeHabit, undoComplete } = useHabits()
  const [settings] = useAtom(settingsAtom)
  const [dailyHabits, setDailyHabits] = useState<Habit[]>([])
  const [completedHabitsMap] = useAtom(completedHabitsMapAtom)
  const today = getTodayInTimezone(settings.system.timezone)
  const todayCompletions = completedHabitsMap.get(today) || []

  useEffect(() => {
    // Filter habits that are due today based on their recurrence rule
    const filteredHabits = habits.filter(habit => isHabitDueToday({ habit, timezone: settings.system.timezone }))
    setDailyHabits(filteredHabits)
  }, [habits])

  // Get all wishlist items sorted by redeemable status (non-redeemable first) then by coin cost
  const sortedWishlistItems = wishlistItems
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

  const [expandedHabits, setExpandedHabits] = useState(false)
  const [expandedWishlist, setExpandedWishlist] = useState(false)
  const [_, setPomo] = useAtom(pomodoroAtom)

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Today's Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Daily Habits</h3>
                <Badge variant="secondary">
                  {`${dailyHabits.filter(habit => {
                    const completions = (completedHabitsMap.get(today) || [])
                      .filter(h => h.id === habit.id).length;
                    return completions >= (habit.targetCompletions || 1);
                  }).length}/${dailyHabits.length} Completed`}
                </Badge>
              </div>
              <ul className={`grid gap-2 transition-all duration-300 ease-in-out ${expandedHabits ? 'max-h-none' : 'max-h-[200px]'} overflow-hidden`}>
                {dailyHabits
                  .sort((a, b) => {
                    // First by completion status
                    const aCompleted = todayCompletions.includes(a);
                    const bCompleted = todayCompletions.includes(b);
                    if (aCompleted !== bCompleted) {
                      return aCompleted ? 1 : -1;
                    }

                    // Then by frequency (daily first)
                    const aFreq = getHabitFreq(a);
                    const bFreq = getHabitFreq(b);
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
                  .slice(0, expandedHabits ? undefined : 5)
                  .map((habit) => {
                    const completionsToday = habit.completions.filter(completion =>
                      isSameDate(t2d({ timestamp: completion, timezone: settings.system.timezone }), t2d({ timestamp: d2t({ dateTime: getNow({ timezone: settings.system.timezone }) }), timezone: settings.system.timezone }))
                    ).length
                    const target = habit.targetCompletions || 1
                    const isCompleted = completionsToday >= target
                    return (
                      <li
                        className={`flex items-center justify-between text-sm p-2 rounded-md
                        ${isCompleted ? 'bg-secondary/50' : 'bg-secondary/20'}`}
                        key={habit.id}
                      >
                        <span className="flex items-center gap-2">
                          <ContextMenu>
                            <ContextMenuTrigger asChild>
                              <div className="flex-none">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
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
                            </ContextMenuTrigger>
                            <span className={isCompleted ? 'line-through' : ''}>
                              <Linkify>
                                {habit.name}
                              </Linkify>
                            </span>
                            <ContextMenuContent className="w-64">
                              <ContextMenuItem onClick={() => {
                                setPomo((prev) => ({
                                  ...prev,
                                  show: true,
                                  selectedHabitId: habit.id
                                }))
                              }}>
                                <Timer className="mr-2 h-4 w-4" />
                                <span>Start Pomodoro</span>
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        </span>
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          {habit.targetCompletions && (
                            <span className="bg-secondary px-1.5 py-0.5 rounded-full">
                              {completionsToday}/{target}
                            </span>
                          )}
                          {getHabitFreq(habit) !== 'daily' && (
                            <Badge variant="outline" className="text-xs">
                              {getHabitFreq(habit)}
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
                  onClick={() => setExpandedHabits(!expandedHabits)}
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  {expandedHabits ? (
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
                  href="/habits"
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  View
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Wishlist Goals</h3>
                <Badge variant="secondary">
                  {wishlistItems.filter(item => item.coinCost <= coinBalance).length}/{wishlistItems.length} Redeemable
                </Badge>
              </div>
              <div>
                <div className={`space-y-3 transition-all duration-300 ease-in-out ${expandedWishlist ? 'max-h-none' : 'max-h-[200px]'} overflow-hidden`}>
                  {sortedWishlistItems.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-4">
                      No wishlist items yet. Add some goals to work towards!
                    </div>
                  ) : (
                    <>
                      {sortedWishlistItems
                        .slice(0, expandedWishlist ? undefined : 5)
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
                    onClick={() => setExpandedWishlist(!expandedWishlist)}
                    className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                  >
                    {expandedWishlist ? (
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
    </>
  )
}
