'use client'

import { loadCoinsData, addCoins, removeCoins } from '@/app/actions/data'
import { useAtom } from 'jotai'
import { wishlistAtom, habitsAtom, settingsAtom } from '@/lib/atoms'
import { getTodayInTimezone } from '@/lib/utils'
import { useEffect, useState } from 'react'
import CoinBalance from './CoinBalance'
import DailyOverview from './DailyOverview'
import HabitOverview from './HabitOverview'
import HabitStreak from './HabitStreak'

export default function Dashboard() {
  const [habitsData, setHabitsData] = useAtom(habitsAtom)
  const habits = habitsData.habits
  const [settings] = useAtom(settingsAtom)
  const [coinBalance, setCoinBalance] = useState(0)
  const [wishlist] = useAtom(wishlistAtom)
  const wishlistItems = wishlist.items

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
            const today = getTodayInTimezone(settings.system.timezone)
            if (!habit.completions.includes(today)) {
              const updatedHabit = {
                ...habit,
                completions: [...habit.completions, today]
              }
              const updatedHabits = habits.map(h =>
                h.id === habit.id ? updatedHabit : h
              )
              setHabitsData({ habits: updatedHabits })
              const coinsData = await addCoins(habit.coinReward, `Completed habit: ${habit.name}`, 'HABIT_COMPLETION', habit.id)
              setCoinBalance(coinsData.balance)
            }
          }}
          onUndo={async (habit) => {
            const today = getTodayInTimezone(settings.system.timezone)
            const updatedHabit = {
              ...habit,
              completions: habit.completions.filter(date => date !== today)
            }
            const updatedHabits = habits.map(h =>
              h.id === habit.id ? updatedHabit : h
            )
            setHabitsData({ habits: updatedHabits })
            const coinsData = await removeCoins(habit.coinReward, `Undid habit completion: ${habit.name}`, 'HABIT_UNDO', habit.id)
            setCoinBalance(coinsData.balance)
          }}
        />

        {/* <HabitHeatmap habits={habits} /> */}
      </div>
    </div>
  )
}

