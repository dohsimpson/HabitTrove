import { Habit } from '@/lib/types';
import { useHabits } from '@/hooks/useHabits';
import { useAtom } from 'jotai';
import { pomodoroAtom, settingsAtom } from '@/lib/atoms';
import { d2t, getNow, isHabitDueToday } from '@/lib/utils';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ContextMenuItem, ContextMenuSeparator } from '@/components/ui/context-menu';
import { Timer, Calendar, Pin, Edit, Archive, ArchiveRestore, Trash2 } from 'lucide-react';
import { useHelpers } from '@/lib/client-helpers'; // For permission checks if needed, though useHabits handles most
import { useTranslations } from 'next-intl';

interface HabitContextMenuItemsProps {
  habit: Habit;
  onEditRequest: () => void;
  onDeleteRequest: () => void;
  context?: 'daily-overview' | 'habit-item';
  onClose?: () => void; // Optional: To close the dropdown if an action is taken
}

export function HabitContextMenuItems({
  habit,
  onEditRequest,
  onDeleteRequest,
  context = 'habit-item',
  onClose,
}: HabitContextMenuItemsProps) {
  const t = useTranslations('HabitContextMenuItems');
  const { saveHabit, archiveHabit, unarchiveHabit } = useHabits();
  const [settings] = useAtom(settingsAtom);
  const [, setPomo] = useAtom(pomodoroAtom);
  const { hasPermission } = useHelpers(); // Assuming useHabits handles permissions for its actions

  const canWrite = hasPermission('habit', 'write'); // For UI disabling if not handled by useHabits' actions
  const canInteract = hasPermission('habit', 'interact');

  const MenuItemComponent = context === 'daily-overview' ? ContextMenuItem : DropdownMenuItem;
  const MenuSeparatorComponent = context === 'daily-overview' ? ContextMenuSeparator : DropdownMenuSeparator;

  const taskIsDueToday = habit.isTask ? isHabitDueToday({ habit, timezone: settings.system.timezone }) : false;

  const handleAction = (action: () => void) => {
    action();
    onClose?.();
  };

  return (
    <>
      {!habit.archived && (
        <MenuItemComponent
          disabled={!canInteract}
          onClick={() => handleAction(() => {
            setPomo((prev) => ({
              ...prev,
              show: true,
              selectedHabitId: habit.id,
            }));
          })}
        >
          <Timer className="mr-2 h-4 w-4" />
          <span>{t('startPomodoro')}</span>
        </MenuItemComponent>
      )}

      {/* "Move to Today" option: Show if task is not due today */}
      {habit.isTask && !habit.archived && !taskIsDueToday && (
        <MenuItemComponent
          disabled={!canWrite}
          onClick={() => handleAction(() => {
            const today = getNow({ timezone: settings.system.timezone });
            saveHabit({ ...habit, frequency: d2t({ dateTime: today }) });
          })}
        >
          <Calendar className="mr-2 h-4 w-4" />
          <span>{t('moveToToday')}</span>
        </MenuItemComponent>
      )}

      {/* "Move to Tomorrow" option: Show if task is due today OR not due today */}
      {habit.isTask && !habit.archived && (
        <MenuItemComponent
          disabled={!canWrite}
          onClick={() => handleAction(() => {
            const tomorrow = getNow({ timezone: settings.system.timezone }).plus({ days: 1 });
            saveHabit({ ...habit, frequency: d2t({ dateTime: tomorrow }) });
          })}
        >
          <Calendar className="mr-2 h-4 w-4" />
          <span>{t('moveToTomorrow')}</span>
        </MenuItemComponent>
      )}

      {!habit.archived && (
        <MenuItemComponent
          disabled={!canWrite}
          onClick={() => handleAction(() => saveHabit({ ...habit, pinned: !habit.pinned }))}
        >
          <Pin className="mr-2 h-4 w-4" />
          <span>{t(habit.pinned ? 'unpin' : 'pin')}</span>
        </MenuItemComponent>
      )}

      {context === 'habit-item' && !habit.archived && ( // Edit button visible in dropdown only for habit-item context on small screens
        <MenuItemComponent
          onClick={() => handleAction(onEditRequest)}
          className="sm:hidden" // Kept the sm:hidden for HabitItem specific responsive behavior
          disabled={!canWrite}
        >
          <Edit className="mr-2 h-4 w-4" />
          <span>{t('edit')}</span>
        </MenuItemComponent>
      )}

      {context === 'daily-overview' && !habit.archived && ( // Edit button always visible in dropdown for daily-overview context
         <MenuItemComponent
          onClick={() => handleAction(onEditRequest)}
          disabled={!canWrite}
        >
          <Edit className="mr-2 h-4 w-4" />
          <span>{t('edit')}</span>
        </MenuItemComponent>
      )}


      {!habit.archived && (
        <MenuItemComponent
          disabled={!canWrite}
          onClick={() => handleAction(() => archiveHabit(habit.id))}
        >
          <Archive className="mr-2 h-4 w-4" />
          <span>{t('archive')}</span>
        </MenuItemComponent>
      )}

      {habit.archived && (
        <MenuItemComponent
          disabled={!canWrite}
          onClick={() => handleAction(() => unarchiveHabit(habit.id))}
        >
          <ArchiveRestore className="mr-2 h-4 w-4" />
          <span>{t('unarchive')}</span>
        </MenuItemComponent>
      )}
      
      {context === 'habit-item' && !habit.archived && <MenuSeparatorComponent className="sm:hidden" />}

      {(context === 'daily-overview' || habit.archived) && <MenuSeparatorComponent />}


      <MenuItemComponent
        onClick={() => handleAction(onDeleteRequest)}
        className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
        disabled={!canWrite} // Assuming delete is a write operation
      >
        <Trash2 className="mr-2 h-4 w-4" />
        <span>{t('delete')}</span>
      </MenuItemComponent>
    </>
  );
}
