import Link from 'next/link'
import { Home, Calendar, List, Gift, Coins } from 'lucide-react'

const navItems = [
  { icon: Home, label: 'Dashboard', href: '/' },
  { icon: List, label: 'Habits', href: '/habits' },
  // { icon: Calendar, label: 'Calendar', href: '/calendar' },
  { icon: Gift, label: 'Wishlist', href: '/wishlist' },
  { icon: Coins, label: 'Coins', href: '/coins' },
]

export default function Sidebar() {
  return (
    <div className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 bg-gray-800">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navItems.map((item) => (
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
          </div>
        </div>
      </div>
    </div>
  )
}

