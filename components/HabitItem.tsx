import { Habit, SafeUser, User, Permission } from '@/lib/types'
import { useAtom } from 'jotai'
import { settingsAtom, pomodoroAtom, browserSettingsAtom, usersAtom, currentUserAtom } from '@/lib/atoms'
import { getTodayInTimezone, isSameDate, t2d, d2t, getNow, d2s, getCompletionsForToday, isTaskOverdue, convertMachineReadableFrequencyToHumanReadable } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Coins, Edit, Check, Undo2, MoreVertical, Pin } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useEffect, useState } from 'react'
import { useHabits } from '@/hooks/useHabits'
import { useTranslations } from 'next-intl'
import { INITIAL_RECURRENCE_RULE, RECURRENCE_RULE_MAP } from '@/lib/constants'
import { DateTime } from 'luxon'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { hasPermission } from '@/lib/utils'
import { HabitContextMenuItems } from './HabitContextMenuItems'

interface HabitItemProps {
  habit: Habit
  onEdit: () => void
  onDelete: () => void
}

const renderUserAvatars = (habit: Habit, currentUser: User | null, usersData: { users: User[] }) => {
  if (!habit.userIds || habit.userIds.length <= 1) return null;

  return (
    <div className="flex -space-x-2 ml-2 flex-shrink-0">
      {habit.userIds?.filter((u) => u !== currentUser?.id).map(userId => {
        const user = usersData.users.find(u => u.id === userId)
        if (!user) return null
        return (
          <Avatar key={user.id} className="h-6 w-6">
            <AvatarImage src={user?.avatarPath && `/api/avatars/${user.avatarPath.split('/').pop()}` || ""} />
            <AvatarFallback>{user.username[0]}</AvatarFallback>
          </Avatar>
        )
      })}
    </div>
  );
};


export default function HabitItem({ habit, onEdit, onDelete }: HabitItemProps) {
  const { completeHabit, undoComplete, archiveHabit, unarchiveHabit, saveHabit } = useHabits()
  const [settings] = useAtom(settingsAtom)
  const [_, setPomo] = useAtom(pomodoroAtom)
  const completionsToday = getCompletionsForToday({ habit, timezone: settings.system.timezone })
  const target = habit.targetCompletions || 1
  const isCompletedToday = completionsToday >= target
  const [isHighlighted, setIsHighlighted] = useState(false)
  const t = useTranslations('HabitItem');
  const [usersData] = useAtom(usersAtom)
  const [currentUser] = useAtom(currentUserAtom)
  const canWrite = hasPermission(currentUser, 'habit', 'write')
  const canInteract = hasPermission(currentUser, 'habit', 'interact')
  const [browserSettings] = useAtom(browserSettingsAtom)
  const isTasksView = browserSettings.viewType === 'tasks'
  const isRecurRule = !isTasksView

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const highlightId = params.get('highlight')

    if (highlightId === habit.id) {
      setIsHighlighted(true)
      // Scroll the element into view after a short delay to ensure rendering
      setTimeout(() => {
        const element = document.getElementById(`habit-${habit.id}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
      // Remove highlight after animation
      const timer = setTimeout(() => setIsHighlighted(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [habit.id])

  return (
    <Card
      id={`habit-${habit.id}`}
      className={`h-full flex flex-col transition-all duration-500 ${isHighlighted ? 'bg-yellow-100 dark:bg-yellow-900' : ''} ${habit.archived ? 'opacity-75' : ''}`}
    >
      <CardHeader className="flex-none">
        <div className="flex justify-between items-start">
          <CardTitle className={`line-clamp-1 ${habit.archived ? 'text-gray-400 dark:text-gray-500' : ''} flex items-center ${isTasksView ? 'w-full' : ''} justify-between`}>
            <div className="flex items-center gap-1">
              {habit.pinned && (
                <Pin className="h-4 w-4 text-yellow-500" />
              )}
              <span>{habit.name}</span>
            </div>
            {isTaskOverdue(habit, settings.system.timezone) && (
              <span className="ml-2 inline-flex items-center rounded-md bg-red-50 dark:bg-red-900/30 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-400 ring-1 ring-inset ring-red-600/10 dark:ring-red-500/20">
                {t('overdue')}
              </span>
            )}
          </CardTitle>
          {renderUserAvatars(habit, currentUser as User, usersData)}
        </div>
        {habit.description && (
          <CardDescription className={`whitespace-pre-line mt-2 ${habit.archived ? 'text-gray-400 dark:text-gray-500' : ''}`}>
            {habit.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        <p className={`text-sm ${habit.archived ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500'}`}>
          {t('whenLabel', {
            frequency: convertMachineReadableFrequencyToHumanReadable({
              frequency: habit.frequency,
              isRecurRule,
              timezone: settings.system.timezone
            })
          })}
        </p>
        <div className="flex items-center mt-2">
          <Coins className={`h-4 w-4 mr-1 ${habit.archived ? 'text-gray-400 dark:text-gray-500' : 'text-yellow-400'}`} />
          <span className={`text-sm font-medium ${habit.archived ? 'text-gray-400 dark:text-gray-500' : ''}`}>{t('coinsPerCompletion', { count: habit.coinReward })}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between gap-2">
        <div className="flex gap-2">
          <div className="relative">
            <Button
              variant={isCompletedToday ? "secondary" : "default"}
              size="sm"
              onClick={async () => await completeHabit(habit)}
              disabled={!canInteract || habit.archived || (isCompletedToday && completionsToday >= target)}
              className={`overflow-hidden w-24 sm:w-auto ${habit.archived ? 'cursor-not-allowed' : ''}`}
            >
              <Check className="h-4 w-4 sm:mr-2" />
              <span>
                {isCompletedToday ? (
                  target > 1 ? (
                    <>
                      <span className="sm:hidden">{t('completedStatusCountMobile', { completed: completionsToday, target })}</span>
                      <span className="hidden sm:inline">{t('completedStatusCount', { completed: completionsToday, target })}</span>
                    </>
                  ) : (
                    t('completedStatus')
                  )
                ) : (
                  target > 1 ? (
                    <>
                      <span className="sm:hidden">{t('completeButtonCountMobile', { completed: completionsToday, target })}</span>
                      <span className="hidden sm:inline">{t('completeButtonCount', { completed: completionsToday, target })}</span>
                    </>
                  ) : t('completeButton')
                )}
              </span>
              {habit.targetCompletions && habit.targetCompletions > 1 && (
                <div
                  className="absolute bottom-0 left-0 h-1 bg-white/50"
                  style={{
                    width: `${(completionsToday / target) * 100}%`
                  }}
                />
              )}
            </Button>
          </div>
          {completionsToday > 0 && !habit.archived && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => await undoComplete(habit)}
              disabled={!canWrite}
              className="w-10 sm:w-auto"
            >
              <Undo2 className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">{t('undoButton')}</span>
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {!habit.archived && (
            <Button
              variant="edit"
              size="sm"
              onClick={onEdit}
              disabled={!canWrite}
              className="hidden sm:flex"
            >
              <Edit className="h-4 w-4" />
              <span className="ml-2">{t('editButton')}</span>
            </Button>
          )}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <HabitContextMenuItems
                habit={habit}
                onEditRequest={onEdit}
                onDeleteRequest={onDelete}
                context="habit-item"
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardFooter>
    </Card>
  )
}

