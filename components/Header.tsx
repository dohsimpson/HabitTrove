'use client'

import { useState } from 'react'
import { useAtom } from 'jotai'
import { settingsAtom, coinsAtom } from '@/lib/atoms'
import { Bell, Menu, Settings, User, Info, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import AboutModal from './AboutModal'
import Link from 'next/link'

interface HeaderProps {
  className?: string
}

export default function Header({ className }: HeaderProps) {
  const [showAbout, setShowAbout] = useState(false)
  const [settings] = useAtom(settingsAtom)
  const [coins] = useAtom(coinsAtom)
  return (
    <>
      <header className={`border-b bg-white dark:bg-gray-800 shadow-sm ${className || ''}`}>
        <div className="mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Logo />
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/coins" className="flex items-center gap-1 px-2 py-1 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900 dark:hover:bg-amber-800 rounded-full transition-colors">
                <Coins className="text-amber-500 dark:text-amber-300" />
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  {coins.balance}
                </span>
              </Link>
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="h-5 w-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    {/* <Menu className="h-5 w-5" /> */}
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={settings?.profile?.avatarPath ? `/api/avatars/${settings.profile.avatarPath.split('/').pop()}` : '/avatars/default.png'} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2">
                  <DropdownMenuItem className="cursor-pointer px-3 py-2" asChild>
                    <Link
                      href="/settings"
                      aria-label='settings'
                      className="flex items-center w-full gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer px-3 py-2" asChild>
                    <button
                      onClick={() => setShowAbout(true)}
                      className="flex items-center w-full gap-2"
                    >
                      <Info className="h-4 w-4" />
                      <span>About</span>
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </>
  )
}

