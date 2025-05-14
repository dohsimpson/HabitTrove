'use client'

import { useCoins } from '@/hooks/useCoins'
import { habitsAtom, wishlistAtom } from '@/lib/atoms'
import { useAtom } from 'jotai'
import CoinBalance from './CoinBalance'
import DailyOverview from './DailyOverview'
import HabitStreak from './HabitStreak'

export default function Dashboard() {
  const [habitsData] = useAtom(habitsAtom)
  const habits = habitsData.habits
  const { balance } = useCoins()
  const [wishlist] = useAtom(wishlistAtom)
  const wishlistItems = wishlist.items

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CoinBalance coinBalance={balance} />
        <HabitStreak habits={habits} />
        <DailyOverview
          wishlistItems={wishlistItems}
          habits={habits}
          coinBalance={balance}
        />

        {/* <HabitHeatmap habits={habits} /> */}
      </div>
    </div>
  )
}

