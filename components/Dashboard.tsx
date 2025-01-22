'use client'

import { useAtom } from 'jotai'
import { wishlistAtom, habitsAtom, settingsAtom, coinsAtom } from '@/lib/atoms'
import DailyOverview from './DailyOverview'
import HabitStreak from './HabitStreak'
import CoinBalance from './CoinBalance'
import { useHabits } from '@/hooks/useHabits'
import { ViewToggle } from './ViewToggle'

export default function Dashboard() {
  const [habitsData] = useAtom(habitsAtom)
  const habits = habitsData.habits
  const [settings] = useAtom(settingsAtom)
  const [coins] = useAtom(coinsAtom)
  const coinBalance = coins.balance
  const [wishlist] = useAtom(wishlistAtom)
  const wishlistItems = wishlist.items

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <ViewToggle />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CoinBalance coinBalance={coinBalance} />
        <HabitStreak habits={habits} />
        <DailyOverview
          wishlistItems={wishlistItems}
          habits={habits}
          coinBalance={coinBalance}
        />

        {/* <HabitHeatmap habits={habits} /> */}
      </div>
    </div>
  )
}

