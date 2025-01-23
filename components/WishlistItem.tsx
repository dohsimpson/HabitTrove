import { WishlistItemType } from '@/lib/types'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import { Coins, Edit, Trash2, Gift, MoreVertical, Archive, ArchiveRestore } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
  return (
    <Card
      id={`wishlist-${item.id}`}
      className={`h-full flex flex-col transition-all duration-500 ${isHighlighted ? 'bg-yellow-100 dark:bg-yellow-900' : ''
        } ${isRecentlyRedeemed ? 'animate-[celebrate_1s_ease-in-out] shadow-lg ring-2 ring-primary' : ''
        } ${item.archived ? 'opacity-75' : ''}`}
    >
      <CardHeader className="flex-none">
        <CardTitle className={`line-clamp-1 ${item.archived ? 'text-gray-400 dark:text-gray-500' : ''}`}>{item.name}</CardTitle>
        {item.description && (
          <CardDescription className={`whitespace-pre-line ${item.archived ? 'text-gray-400 dark:text-gray-500' : ''}`}>
            {item.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex items-center">
          <Coins className={`h-4 w-4 mr-1 ${item.archived ? 'text-gray-400 dark:text-gray-500' : 'text-yellow-400'}`} />
          <span className={`text-sm font-medium ${item.archived ? 'text-gray-400 dark:text-gray-500' : ''}`}>{item.coinCost} coins</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between gap-2">
        <div className="flex gap-2">
          <Button
            variant={canRedeem ? "default" : "secondary"}
            size="sm"
            onClick={onRedeem}
            disabled={!canRedeem || item.archived}
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
                <DropdownMenuItem onClick={onArchive}>
                  <Archive className="mr-2 h-4 w-4" />
                  <span>Archive</span>
                </DropdownMenuItem>
              )}
              {item.archived && (
                <DropdownMenuItem onClick={onUnarchive}>
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

