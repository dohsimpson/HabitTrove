'use client'

import { useState } from 'react'
import { useAtom } from 'jotai'
import { settingsAtom } from '@/lib/atoms'
import { Bell, Menu, Settings, User, Info } from 'lucide-react'
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
  return (
    <>
      <header className={`border-b bg-white dark:bg-gray-800 shadow-sm ${className || ''}`}>
        <div className="mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Logo />
            </Link>
            <div className="flex items-center gap-2">
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

