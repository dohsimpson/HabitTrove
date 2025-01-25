'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Settings, Info, User, Moon, Sun, Palette } from "lucide-react"
import Link from "next/link"
import { useAtom } from "jotai"
import { settingsAtom } from "@/lib/atoms"
import AboutModal from "./AboutModal"
import { useState } from "react"
import { useTheme } from "next-themes"

export function Profile() {
  const [settings] = useAtom(settingsAtom)
  const [showAbout, setShowAbout] = useState(false)
  const { theme, setTheme } = useTheme()

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={settings?.profile?.avatarPath ? `/api/avatars/${settings.profile.avatarPath.split('/').pop()}` : '/avatars/default.png'} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px] p-2">
          <DropdownMenuItem className="cursor-pointer px-2 py-1.5" asChild>
            <Link
              href="/settings"
              aria-label='settings'
              className="flex items-center w-full gap-3"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer px-2 py-1.5" asChild>
            <button
              onClick={() => setShowAbout(true)}
              className="flex items-center w-full gap-3"
            >
              <Info className="h-4 w-4" />
              <span>About</span>
            </button>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer px-2 py-1.5">
            <div className="flex items-center justify-between w-full gap-3">
              <div className="flex items-center gap-3">
                <Palette className="h-4 w-4" />
                <span>Theme</span>
              </div>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`
                  w-12 h-6 rounded-full relative transition-all duration-300 ease-in-out
                  hover:scale-105 shadow-inner
                  ${theme === 'dark' 
                    ? 'bg-blue-600/90 hover:bg-blue-600' 
                    : 'bg-gray-200 hover:bg-gray-300'
                  }
                `}
              >
                <div className={`
                  w-5 h-5 rounded-full absolute top-0.5 left-0.5
                  transition-all duration-300 ease-in-out
                  shadow-md bg-white
                  ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}
                `}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {theme === 'dark' ? (
                      <Moon className="h-3 w-3 text-gray-600" />
                    ) : (
                      <Sun className="h-3 w-3 text-gray-600" />
                    )}
                  </div>
                </div>
              </button>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </>
  )
}