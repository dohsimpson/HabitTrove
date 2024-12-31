'use client'

import Link from 'next/link'
import { Home, Calendar, List, Gift, Coins, Settings, Info } from 'lucide-react'
import { useState } from 'react'
import AboutModal from './AboutModal'

const navItems = [
  { icon: Home, label: 'Dashboard', href: '/', position: 'main' },
  { icon: List, label: 'Habits', href: '/habits', position: 'main' },
  { icon: Calendar, label: 'Calendar', href: '/calendar', position: 'main' },
  { icon: Gift, label: 'Wishlist', href: '/wishlist', position: 'main' },
  { icon: Coins, label: 'Coins', href: '/coins', position: 'main' },
  { icon: Info, label: 'About', href: '#', position: 'bottom', onClick: (setShow: (show: boolean) => void) => setShow(true) },
]

interface NavigationProps {
  className?: string
  isMobile?: boolean
}

export default function Navigation({ className, isMobile = false }: NavigationProps) {
  const [showAbout, setShowAbout] = useState(false)
  if (isMobile) {
    return (
      <>
        <div className="pb-16" /> {/* Add padding at the bottom to prevent content from being hidden */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg">
          <div className="flex justify-around">
            {[...navItems.filter(item => item.position === 'main'), ...navItems.filter(item => item.position === 'bottom')].map((item) => 
              item.onClick ? (
                <button
                  key={item.label}
                  onClick={() => item.onClick?.(setShowAbout)}
                  className="flex flex-col items-center py-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
                >
                  <item.icon className="h-6 w-6" />
                  <span className="text-xs mt-1">{item.label}</span>
                </button>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex flex-col items-center py-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
                >
                  <item.icon className="h-6 w-6" />
                  <span className="text-xs mt-1">{item.label}</span>
                </Link>
              )
            )}
          </div>
        </nav>
        <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      </>
    )
  }

  return (
    <div className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 bg-gray-800">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navItems.filter(item => item.position === 'main').map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group flex items-center px-2 py-2 text-sm leading-6 font-medium rounded-md text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  <item.icon className="mr-4 flex-shrink-0 h-6 w-6 text-gray-400" aria-hidden="true" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="px-2 pb-2">
              <button
                onClick={() => setShowAbout(true)}
                className="w-full group flex items-center px-2 py-2 text-sm leading-6 font-medium rounded-md text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <Info className="mr-4 flex-shrink-0 h-6 w-6 text-gray-400" aria-hidden="true" />
                About
              </button>
            </div>
          </div>
        </div>
      </div>
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </div>
  )
}
