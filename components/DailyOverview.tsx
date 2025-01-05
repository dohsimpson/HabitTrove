import { Circle, Coins, ArrowRight, CircleCheck, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useState } from 'react'
import { useAtom } from 'jotai'
import { settingsAtom } from '@/lib/atoms'
import { getTodayInTimezone, isSameDate, t2d, d2t, getNow, getCompletedHabitsForDate, getCompletionsForDate } from '@/lib/utils'
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
  const today = getTodayInTimezone(settings.system.timezone)
  const todayCompletions = getCompletedHabitsForDate({
    habits,
    date: getNow({ timezone: settings.system.timezone }),
    timezone: settings.system.timezone
  })

  // Filter daily habits
  const dailyHabits = habits.filter(habit => habit.frequency === 'daily')

  // Get achievable wishlist items sorted by coin cost
  const achievableWishlistItems = wishlistItems
    .filter(item => item.coinCost > coinBalance)
    .sort((a, b) => a.coinCost - b.coinCost)

  const [expandedHabits, setExpandedHabits] = useState(false)
  const [expandedWishlist, setExpandedWishlist] = useState(false)

  return (
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
                {dailyHabits.reduce((sum, habit) => sum + getCompletionsForDate({
                  habit,
                  date: today,
                  timezone: settings.system.timezone
                }), 0)}/
                {dailyHabits.reduce((sum, habit) => sum + (habit.targetCompletions || 1), 0)} Completions
              </Badge>
            </div>
            <ul className={`grid gap-2 transition-all duration-300 ease-in-out ${expandedHabits ? 'max-h-[500px] opacity-100' : 'max-h-[200px] opacity-100'} overflow-hidden`}>
              {dailyHabits
                .sort((a, b) => {
                  const aCompleted = todayCompletions.includes(a);
                  const bCompleted = todayCompletions.includes(b);
                  return aCompleted === bCompleted ? 0 : aCompleted ? 1 : -1;
                })
                .slice(0, expandedHabits ? undefined : 3)
                .map((habit) => {
                  const completionsToday = habit.completions.filter(completion =>
                    isSameDate(t2d({ timestamp: completion, timezone: settings.system.timezone }), t2d({ timestamp: d2t({ dateTime: getNow({ timezone: settings.system.timezone }) }), timezone: settings.system.timezone }))
                  ).length
                  const target = habit.targetCompletions || 1
                  const isCompleted = completionsToday >= target
                  return (
                    <li
                      key={habit.id}
                      className={`flex items-center justify-between text-sm p-2 rounded-md
                      ${isCompleted ? 'bg-secondary/50' : 'bg-secondary/20'}`}
                    >
                      <span className="flex items-center gap-2">
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
                        <span className={isCompleted ? 'line-through' : ''}>
                          <Linkify>
                            {habit.name}
                          </Linkify>
                        </span>
                      </span>
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        {habit.targetCompletions && (
                          <span className="bg-secondary px-1.5 py-0.5 rounded-full">
                            {completionsToday}/{target}
                          </span>
                        )}
                        <span className="flex items-center">
                          <Coins className="h-3 w-3 text-yellow-400 mr-1" />
                          {habit.coinReward}
                        </span>
                      </span>
                    </li>
                  )
                })}
            </ul>
          </div>
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

          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Wishlist Goals</h3>
              <Badge variant="secondary">
                {wishlistItems.filter(item => item.coinCost <= coinBalance).length}/{wishlistItems.length} Redeemable
              </Badge>
            </div>
            {achievableWishlistItems.length > 0 && (
              <div>
                <div className={`space-y-3 transition-all duration-300 ease-in-out ${expandedWishlist ? 'max-h-[500px]' : 'max-h-[200px]'} overflow-hidden`}>
                  {achievableWishlistItems
                    .slice(0, expandedWishlist ? undefined : 1)
                    .map((item) => (
                      <div key={item.id} className="bg-secondary/20 p-3 rounded-md">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm">
                            <Linkify>
                              {item.name}
                            </Linkify>
                          </span>
                          <span className="text-xs flex items-center">
                            <Coins className="h-3 w-3 text-yellow-400 mr-1" />
                            {item.coinCost}
                          </span>
                        </div>
                        <Progress
                          value={(coinBalance / item.coinCost) * 100}
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          {item.coinCost - coinBalance} coins to go
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
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
      </CardContent>
    </Card>
  )
}

