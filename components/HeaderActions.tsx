'use client'

import Link from 'next/link'
import { useAtom } from 'jotai'
import { settingsAtom } from '@/lib/atoms'
import { useCoins } from '@/hooks/useCoins'
import { FormattedNumber } from '@/components/FormattedNumber'
import { Coins } from 'lucide-react'
import NotificationBell from './NotificationBell'
import dynamic from 'next/dynamic'
import { Profile } from './Profile'

const TodayEarnedCoins = dynamic(() => import('./TodayEarnedCoins'), { ssr: false })

export default function HeaderActions() {
  const [settings] = useAtom(settingsAtom)
  const { balance } = useCoins()

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Link href="/coins" className="flex items-center gap-1 sm:gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-full transition-colors border border-gray-200 dark:border-gray-600">
        <Coins className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
        <div className="flex items-baseline gap-1 sm:gap-2">
          <FormattedNumber
            amount={balance}
            settings={settings}
            className="text-gray-800 dark:text-gray-100 font-medium text-lg"
          />
          <div className="hidden sm:block">
            <TodayEarnedCoins />
          </div>
        </div>
      </Link>
      <NotificationBell />
      <Profile />
    </div>
  )
}
