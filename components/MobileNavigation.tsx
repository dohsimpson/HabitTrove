import Link from 'next/link'
import { Home, Calendar, List, Gift, Coins } from 'lucide-react'

const navItems = [
  { icon: Home, label: 'Dashboard', href: '/' },
  { icon: List, label: 'Habits', href: '/habits' },
  { icon: Calendar, label: 'Calendar', href: '/calendar' },
  { icon: Gift, label: 'Wishlist', href: '/wishlist' },
  { icon: Coins, label: 'Coins', href: '/coins' },
]

export default function MobileNavigation() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex flex-col items-center py-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

