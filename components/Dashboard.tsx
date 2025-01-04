'use client'

import { useAtom } from 'jotai'
import { wishlistAtom, habitsAtom, settingsAtom, coinsAtom } from '@/lib/atoms'
import CoinBalance from './CoinBalance'
import DailyOverview from './DailyOverview'
import HabitStreak from './HabitStreak'
import { useHabits } from '@/hooks/useHabits'

export default function Dashboard() {
  const { completeHabit, undoComplete } = useHabits()
  const [habitsData] = useAtom(habitsAtom)
  const habits = habitsData.habits
  const [settings] = useAtom(settingsAtom)
  const [coins] = useAtom(coinsAtom)
  const coinBalance = coins.balance
  const [wishlist] = useAtom(wishlistAtom)
  const wishlistItems = wishlist.items

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CoinBalance coinBalance={coinBalance} />
        {/* <HabitOverview /> */}
        <HabitStreak habits={habits} />
        <DailyOverview
          wishlistItems={wishlistItems}
          habits={habits}
          coinBalance={coinBalance}
          onComplete={completeHabit}
          onUndo={undoComplete}
        />

        {/* <HabitHeatmap habits={habits} /> */}
      </div>
    </div>
  )
}

