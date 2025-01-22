'use client'

import { cn } from '@/lib/utils'
import { useAtom } from 'jotai'
import { CheckSquare, ListChecks } from 'lucide-react'
import { transientSettingsAtom } from '@/lib/atoms'
import type { ViewType } from '@/lib/types'

interface ViewToggleProps {
  defaultView?: ViewType
  className?: string
}

export function ViewToggle({
  defaultView = 'habits',
  className
}: ViewToggleProps) {
  const [transientSettings, setTransientSettings] = useAtom(transientSettingsAtom)

  const handleViewChange = (checked: boolean) => {
    const newView = checked ? 'tasks' : 'habits'
    setTransientSettings({
      ...transientSettings,
      viewType: newView,
    })
  }

  return (
    <div className={cn('inline-flex rounded-full bg-muted/50', className)}>
      <div className="relative flex gap-0.5 rounded-full bg-background p-0.5">
        <button
          onClick={() => handleViewChange(false)}
          className={cn(
            'relative z-10 rounded-full px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1',
            transientSettings.viewType === 'habits' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <ListChecks className="h-3 w-3" />
          <span className="hidden sm:inline">Habits</span>
        </button>
        <button
          onClick={() => handleViewChange(true)}
          className={cn(
            'relative z-10 rounded-full px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1',
            transientSettings.viewType === 'tasks' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <CheckSquare className="h-3 w-3" />
          <span className="hidden sm:inline">Tasks</span>
        </button>
        <div
          className={cn(
            'absolute left-0.5 top-0.5 h-[calc(100%-0.25rem)] rounded-full bg-primary transition-transform',
            transientSettings.viewType === 'habits' ? 'w-[calc(50%-0.125rem)]' : 'w-[calc(50%-0.125rem)] translate-x-[calc(100%+0.125rem)]'
          )}
        />
      </div>
    </div>
  )
}
