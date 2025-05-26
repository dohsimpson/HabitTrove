'use client'

import { Home, Calendar, Gift, Coins } from 'lucide-react'
import { useAtom } from 'jotai'
import { browserSettingsAtom } from '@/lib/atoms'
import { useEffect, useState, ElementType } from 'react'
import { useTranslations } from 'next-intl'
import { HabitIcon, TaskIcon } from '@/lib/constants'
import { useHelpers } from '@/lib/client-helpers'
import MobileNavDisplay from './MobileNavDisplay'
import DesktopNavDisplay from './DesktopNavDisplay'

type ViewPort = 'main' | 'mobile'

export interface NavItemType {
  icon: ElementType;
  label: string;
  href: string;
  position: 'main' | 'bottom';
}

interface NavigationProps {
  className?: string
  viewPort: ViewPort
}

export default function Navigation({ className, viewPort }: NavigationProps) {
  const t = useTranslations('Navigation')
  const [isMobileView, setIsMobileView] = useState(false)
  const [browserSettings] = useAtom(browserSettingsAtom)
  const isTasksView = browserSettings.viewType === 'tasks'
  const { isIOS } = useHelpers()

  const currentNavItems: NavItemType[] = [
    { icon: Home, label: t('dashboard'), href: '/', position: 'main' },
    {
      icon: isTasksView ? TaskIcon : HabitIcon,
      label: isTasksView ? t('tasks') : t('habits'),
      href: '/habits',
      position: 'main'
    },
    { icon: Calendar, label: t('calendar'), href: '/calendar', position: 'main' },
    { icon: Gift, label: t('wishlist'), href: '/wishlist', position: 'main' },
    { icon: Coins, label: t('coins'), href: '/coins', position: 'main' },
  ]

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1024)
    }

    // Set initial value
    handleResize()

    // Add event listener
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (viewPort === 'mobile' && isMobileView) {
    return <MobileNavDisplay navItems={currentNavItems} isIOS={isIOS} />
  }

  if (viewPort === 'main' && !isMobileView) {
    return <DesktopNavDisplay navItems={currentNavItems} className={className} />
  }

  return null // Explicitly return null if no view matches
}
