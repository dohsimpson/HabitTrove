'use client'

import { signOut } from "@/app/actions/user"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import { settingsAtom, userSelectAtom } from "@/lib/atoms"
import { useHelpers } from "@/lib/client-helpers"
import { useAtom } from "jotai"
import { ArrowRightLeft, Crown, Info, LogOut, Moon, Palette, Settings, Sun, User } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { useState } from "react"
import AboutModal from "./AboutModal"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import UserForm from './UserForm'

export function Profile() {
  const [settings] = useAtom(settingsAtom)
  const [userSelect, setUserSelect] = useAtom(userSelectAtom)
  const [isEditing, setIsEditing] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const { theme, setTheme } = useTheme()
  const { currentUser: user } = useHelpers()
  const [open, setOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account",
      })
      setTimeout(() => window.location.reload(), 300);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatarPath && `/api/avatars/${user.avatarPath.split('/').pop()}` || ""} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px] p-2">
          <div className="px-2 py-1.5 mb-2 border-b">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatarPath && `/api/avatars/${user.avatarPath.split('/').pop()}` || ""} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col mr-4">
                <span className="text-sm font-semibold flex items-center gap-1">
                  {user?.username || "Guest"}
                  {user?.isAdmin && <Crown className="h-3 w-3 text-yellow-500" />}
                </span>
                {user && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpen(false);
                      setIsEditing(true);
                    }}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors text-left"
                  >
                    Edit profile
                  </button>
                )}
              </div>
              {user && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                    handleSignOut();
                  }}
                  className="border border-primary/50 text-primary rounded-md p-1.5 transition-colors hover:bg-primary/10 hover:border-primary active:scale-95"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <DropdownMenuItem className="cursor-pointer px-2 py-1.5" onClick={() => {
            setOpen(false);  // Close the dropdown
            setUserSelect(true);  // Open the user select modal
          }}>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                <span>Switch user</span>
              </div>
            </div>
          </DropdownMenuItem>
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
                onClick={(e) => {
                  e.stopPropagation();
                  setTheme(theme === 'dark' ? 'light' : 'dark');
                }}
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

      {/* Add the UserForm dialog */}
      {isEditing && user && (
        <Dialog open={isEditing} onOpenChange={() => setIsEditing(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <UserForm
              userId={user.id}
              onCancel={() => setIsEditing(false)}
              onSuccess={() => {
                setIsEditing(false);
                window.location.reload();
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
