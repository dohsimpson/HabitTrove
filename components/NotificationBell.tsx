'use client'

import { useMemo } from 'react'
import { useAtom } from 'jotai'
import { coinsAtom, habitsAtom, wishlistAtom, usersAtom, currentUserAtom } from '@/lib/atoms'
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import NotificationDropdown from './NotificationDropdown';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { updateLastNotificationReadTimestamp } from '@/app/actions/data';
import { d2t, getNow, t2d } from '@/lib/utils';
import { User, CoinTransaction } from '@/lib/types';

export default function NotificationBell() {
  const t = useTranslations('NotificationBell');
  const [currentUser] = useAtom(currentUserAtom);
  const [coinsData] = useAtom(coinsAtom)
  const [habitsData] = useAtom(habitsAtom)
  const [wishlistData] = useAtom(wishlistAtom)
  const [usersData] = useAtom(usersAtom);

  // --- Calculate Unread and Read Notifications ---
  const { unreadNotifications, displayedReadNotifications } = useMemo(() => {
    const unread: CoinTransaction[] = [];
    const read: CoinTransaction[] = [];
    const MAX_READ_NOTIFICATIONS = 10; // Limit the number of past notifications shown

    if (!currentUser || !currentUser.id) {
      return { unreadNotifications: [], displayedReadNotifications: [] };
    }

    const lastReadTimestamp = currentUser.lastNotificationReadTimestamp
      ? t2d({ timestamp: currentUser.lastNotificationReadTimestamp, timezone: 'UTC' })
      : null;

    // Iterate through transactions (assuming they are sorted newest first)
    for (const tx of coinsData.transactions) {
      // Stop processing if we have enough read notifications
      if (read.length >= MAX_READ_NOTIFICATIONS && (!lastReadTimestamp || t2d({ timestamp: tx.timestamp, timezone: 'UTC' }) <= lastReadTimestamp)) {
        break; // Optimization: stop early if we have enough read and are past the unread ones
      }

      // Basic checks: must have a related item and be triggered by someone else
      if (!tx.relatedItemId || tx.userId === currentUser.id) {
        continue;
      }

      // Check if the transaction type indicates a notification-worthy event
      const isRelevantType = tx.type === 'HABIT_COMPLETION' || tx.type === 'TASK_COMPLETION' || tx.type === 'WISH_REDEMPTION';
      if (!isRelevantType) {
        continue;
      }

      // Check if the related item is shared with the current user
      let isShared = false;
      const isHabitCompletion = tx.type === 'HABIT_COMPLETION' || tx.type === 'TASK_COMPLETION';
      const isWishRedemption = tx.type === 'WISH_REDEMPTION';

      if (isHabitCompletion) {
        const habit = habitsData.habits.find(h => h.id === tx.relatedItemId);
        if (habit?.userIds?.includes(currentUser.id) && tx.userId && habit.userIds.includes(tx.userId)) {
          isShared = true;
        }
      } else if (isWishRedemption) {
        const wish = wishlistData.items.find(w => w.id === tx.relatedItemId);
        if (wish?.userIds?.includes(currentUser.id) && tx.userId && wish.userIds.includes(tx.userId)) {
          isShared = true;
        }
      }

      if (!isShared) {
        continue; // Skip if not shared
      }

      // Transaction is relevant, determine if read or unread
      const txTimestamp = t2d({ timestamp: tx.timestamp, timezone: 'UTC' });
      if (!lastReadTimestamp || txTimestamp > lastReadTimestamp) {
        unread.push(tx);
      } else if (read.length < MAX_READ_NOTIFICATIONS) {
        // Only add to read if we haven't hit the limit
        read.push(tx);
      }
    }

    // Transactions are assumed to be sorted newest first from the source
    return { unreadNotifications: unread, displayedReadNotifications: read };
  }, [coinsData.transactions, habitsData.habits, wishlistData.items, currentUser]);
  // --- End Calculate Notifications ---

  const unreadCount = unreadNotifications.length;

  const handleNotificationClick = async () => {
    if (!currentUser || !currentUser.id || unreadCount === 0) return; // Only update if there are unread notifications
    try {
      const nowTimestamp = d2t({ dateTime: getNow({}) });
      await updateLastNotificationReadTimestamp(currentUser.id, nowTimestamp);
    } catch (error) {
      console.error(t('errorUpdateTimestamp'), error);
    }
  };

  return (
    <DropdownMenu onOpenChange={(open) => {
      // Update timestamp only when opening the dropdown and there are unread notifications
      if (open && unreadCount > 0) {
        handleNotificationClick();
      }
    }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-1 ring-white dark:ring-gray-800" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="p-0 w-80 md:w-96">
        <NotificationDropdown
          currentUser={currentUser as User | null} // Cast needed as as currentUser can be undefined
          unreadNotifications={unreadNotifications}
          displayedReadNotifications={displayedReadNotifications}
          habitsData={habitsData} // Pass necessary data down
          wishlistData={wishlistData}
          usersData={usersData}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
