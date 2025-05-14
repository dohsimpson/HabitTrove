import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usersAtom } from '@/lib/atoms'
import { useHelpers } from '@/lib/client-helpers'
import { User, WishlistItemType } from '@/lib/types'
import { useAtom } from 'jotai'
import { Archive, ArchiveRestore, Coins, Edit, Gift, MoreVertical, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'

interface WishlistItemProps {
  item: WishlistItemType
  onEdit: () => void
  onDelete: () => void
  onRedeem: () => void
  onArchive: () => void
  onUnarchive: () => void
  canRedeem: boolean
  isHighlighted?: boolean
  isRecentlyRedeemed?: boolean
  isArchived?: boolean
}

const renderUserAvatars = (item: WishlistItemType, currentUser: User | null, usersData: { users: User[] }) => {
  if (!item.userIds || item.userIds.length <= 1) return null;
  
  return (
    <div className="flex -space-x-2 ml-2 flex-shrink-0">
      {item.userIds?.filter((u) => u !== currentUser?.id).map(userId => {
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

export default function WishlistItem({
  item,
  onEdit,
  onDelete,
  onRedeem,
  onArchive,
  onUnarchive,
  canRedeem,
  isHighlighted,
  isRecentlyRedeemed
}: WishlistItemProps) {
  const { currentUser, hasPermission } = useHelpers()
  const canWrite = hasPermission('wishlist', 'write')
  const canInteract = hasPermission('wishlist', 'interact')
  const [usersData] = useAtom(usersAtom)
  
  return (
    <Card
      id={`wishlist-${item.id}`}
      className={`h-full flex flex-col transition-all duration-500 ${isHighlighted ? 'bg-yellow-100 dark:bg-yellow-900' : ''
        } ${isRecentlyRedeemed ? 'animate-[celebrate_1s_ease-in-out] shadow-lg ring-2 ring-primary' : ''
        } ${item.archived ? 'opacity-75' : ''}`}
    >
      <CardHeader className="flex-none">
        <div className="flex items-center gap-2">
          <CardTitle className={`line-clamp-1 ${item.archived ? 'text-gray-400 dark:text-gray-500' : ''}`}>
            {item.name}
          </CardTitle>
          {item.targetCompletions && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({item.targetCompletions} {item.targetCompletions === 1 ? 'use' : 'uses'} left)
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {item.description && (
              <CardDescription className={`whitespace-pre-line ${item.archived ? 'text-gray-400 dark:text-gray-500' : ''}`}>
                {item.description}
              </CardDescription>
            )}
          </div>
          {renderUserAvatars(item, currentUser as User, usersData)}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex items-center gap-2">
          <Coins className={`h-4 w-4 ${item.archived ? 'text-gray-400 dark:text-gray-500' : 'text-yellow-400'}`} />
          <span className={`text-sm font-medium ${item.archived ? 'text-gray-400 dark:text-gray-500' : ''}`}>
            {item.coinCost} coins
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between gap-2">
        <div className="flex gap-2">
          <Button
            variant={canRedeem ? "default" : "secondary"}
            size="sm"
            onClick={onRedeem}
            disabled={!canRedeem || !canInteract || item.archived}
            className={`transition-all duration-300 w-24 sm:w-auto ${isRecentlyRedeemed ? 'bg-green-500 hover:bg-green-600' : ''} ${item.archived ? 'cursor-not-allowed' : ''}`}
          >
            <Gift className={`h-4 w-4 sm:mr-2 ${isRecentlyRedeemed ? 'animate-spin' : ''}`} />
            <span>
              {isRecentlyRedeemed ? (
                <>
                  <span className="sm:hidden">Done</span>
                  <span className="hidden sm:inline">Redeemed!</span>
                </>
              ) : (
                <>
                  <span className="sm:hidden">Redeem</span>
                  <span className="hidden sm:inline">Redeem</span>
                </>
              )}
            </span>
          </Button>
        </div>
        <div className="flex gap-2">
          {!item.archived && (
            <Button
              variant="edit"
              size="sm"
              onClick={onEdit}
              disabled={!canWrite}
              className="hidden sm:flex"
            >
              <Edit className="h-4 w-4" />
              <span className="ml-2">Edit</span>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!item.archived && (
                <DropdownMenuItem disabled={!canWrite} onClick={onArchive}>
                  <Archive className="mr-2 h-4 w-4" />
                  <span>Archive</span>
                </DropdownMenuItem>
              )}
              {item.archived && (
                <DropdownMenuItem disabled={!canWrite} onClick={onUnarchive}>
                  <ArchiveRestore className="mr-2 h-4 w-4" />
                  <span>Unarchive</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onEdit} className="sm:hidden">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator className="sm:hidden" />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400 cursor-pointer"
                onClick={onDelete}
                disabled={!canWrite}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardFooter>
    </Card>
  )
}

