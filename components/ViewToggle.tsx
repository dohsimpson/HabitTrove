'use client'

import { cn } from '@/lib/utils'
import { useAtom } from 'jotai'
import { CheckSquare, ListChecks } from 'lucide-react'
import { browserSettingsAtom } from '@/lib/atoms'
import type { ViewType } from '@/lib/types'
import { HabitIcon, TaskIcon } from '@/lib/constants'

interface ViewToggleProps {
  defaultView?: ViewType
  className?: string
}

export function ViewToggle({
  defaultView = 'habits',
  className
}: ViewToggleProps) {
  const [browserSettings, setBrowserSettings] = useAtom(browserSettingsAtom)

  const handleViewChange = (checked: boolean) => {
    const newView = checked ? 'tasks' : 'habits'
    setBrowserSettings({
      ...browserSettings,
      viewType: newView,
    })
  }

  return (
    <div className={cn('inline-flex rounded-full bg-muted/50 h-8', className)}>
      <div className="relative flex gap-0.5 rounded-full bg-background p-0.5 h-full">
        <button
          onClick={() => handleViewChange(false)}
          className={cn(
            'relative z-10 rounded-full px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2',
            browserSettings.viewType === 'habits' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <HabitIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Habits</span>
        </button>
        <button
          onClick={() => handleViewChange(true)}
          className={cn(
            'relative z-10 rounded-full px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2',
            browserSettings.viewType === 'tasks' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <TaskIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Tasks</span>
        </button>
        <div
          className={cn(
            'absolute left-0.5 top-0.5 h-[calc(100%-0.25rem)] rounded-full bg-primary transition-transform',
            browserSettings.viewType === 'habits' ? 'w-[calc(50%-0.125rem)]' : 'w-[calc(50%-0.125rem)] translate-x-[calc(100%+0.125rem)]'
          )}
        />
      </div>
    </div>
  )
}
