import { Circle, Coins, ArrowRight, CircleCheck, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useAtom } from 'jotai'
import { settingsAtom } from '@/lib/atoms'
import { getTodayInTimezone } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { WishlistItemType } from '@/lib/types'
import { Habit } from '@/lib/types'

interface UpcomingItemsProps {
  habits: Habit[]
  wishlistItems: WishlistItemType[]
  coinBalance: number
  onComplete: (habit: Habit) => void
  onUndo: (habit: Habit) => void
}

export default function DailyOverview({
  habits,
  wishlistItems,
  coinBalance,
  onComplete,
  onUndo
}: UpcomingItemsProps) {
  const [settings] = useAtom(settingsAtom)
  const today = getTodayInTimezone(settings.system.timezone)
  const todayCompletions = habits.filter(habit =>
    habit.completions.includes(today)
  )

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
                {todayCompletions.length}/{dailyHabits.length} Complete
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
                  const isCompleted = todayCompletions.includes(habit)
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
                              onUndo(habit);
                            } else {
                              onComplete(habit);
                            }
                          }}
                          className="hover:opacity-70 transition-opacity"
                        >
                          {isCompleted ? (
                            <CircleCheck className="h-4 w-4 text-green-500" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                        </button>
                        <span className={isCompleted ? 'line-through' : ''}>
                          {habit.name}
                        </span>
                      </span>
                      <span className="flex items-center text-xs text-muted-foreground">
                        <Coins className="h-3 w-3 text-yellow-400 mr-1" />
                        {habit.coinReward}
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
                          <span className="text-sm">{item.name}</span>
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

