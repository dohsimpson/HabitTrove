'use client'

import { useEffect, useState } from 'react'
import { useAtom } from 'jotai'
import { coinsAtom, settingsAtom, browserSettingsAtom } from '@/lib/atoms'
import { useCoins } from '@/hooks/useCoins'
import { FormattedNumber } from '@/components/FormattedNumber'
import { Menu, Settings, User, Info, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import NotificationBell from './NotificationBell'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Profile } from './Profile'
import { useHelpers } from '@/lib/client-helpers'

interface HeaderProps {
  className?: string
}

const TodayEarnedCoins = dynamic(() => import('./TodayEarnedCoins'), { ssr: false })

export default function Header({ className }: HeaderProps) {
  const [settings] = useAtom(settingsAtom)
  const [browserSettings] = useAtom(browserSettingsAtom)
  const { balance } = useCoins()
  return (
    <>
      <header className={`border-b bg-white dark:bg-gray-800 shadow-sm ${className || ''}`}>
        <div className="mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="mr-3 sm:mr-4">
              <Logo />
            </Link>
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
          </div>
        </div>
      </header>
    </>
  )
}

