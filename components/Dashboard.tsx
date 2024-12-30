'use client'

import { loadCoinsData } from '@/app/actions/data'
import { useHabits } from '@/hooks/useHabits'
import { useWishlist } from '@/hooks/useWishlist'
import { useEffect, useState } from 'react'
import CoinBalance from './CoinBalance'
import DailyOverview from './DailyOverview'
import HabitOverview from './HabitOverview'
import HabitStreak from './HabitStreak'

export default function Dashboard() {
  const { habits, completeHabit, undoComplete } = useHabits()
  const [coinBalance, setCoinBalance] = useState(0)
  const { wishlistItems } = useWishlist()

  useEffect(() => {
    const loadData = async () => {
      const coinsData = await loadCoinsData()
      setCoinBalance(coinsData.balance)
    }
    loadData()
  }, [])

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
          onComplete={async (habit) => {
            const newBalance = await completeHabit(habit)
            if (newBalance !== null) {
              setCoinBalance(newBalance)
            }
          }}
          onUndo={async (habit) => {
            const newBalance = await undoComplete(habit)
            if (newBalance !== null) {
              setCoinBalance(newBalance)
            }
          }}
        />

        {/* <HabitHeatmap habits={habits} /> */}
      </div>
    </div>
  )
}

