import { WishlistItemType } from '@/lib/types'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Coins, Edit, Trash2, Gift } from 'lucide-react'

interface WishlistItemProps {
  item: WishlistItemType
  onEdit: () => void
  onDelete: () => void
  onRedeem: () => void
  canRedeem: boolean
  isHighlighted?: boolean
  isRecentlyRedeemed?: boolean
}

export default function WishlistItem({
  item,
  onEdit,
  onDelete,
  onRedeem,
  canRedeem,
  isHighlighted,
  isRecentlyRedeemed
}: WishlistItemProps) {
  return (
    <Card
      id={`wishlist-${item.id}`}
      className={`transition-all duration-500 ${isHighlighted ? 'bg-yellow-100 dark:bg-yellow-900' : ''
        } ${isRecentlyRedeemed ? 'animate-[celebrate_1s_ease-in-out] shadow-lg ring-2 ring-primary' : ''
        }`}
    >
      <CardHeader>
        <CardTitle>{item.name}</CardTitle>
        <CardDescription>{item.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center">
          <Coins className="h-4 w-4 text-yellow-400 mr-1" />
          <span className="text-sm font-medium">{item.coinCost} coins</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>
          <Button variant="outline" size="sm" onClick={onEdit} className="mr-2">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
        <Button
          variant={canRedeem ? "default" : "secondary"}
          size="sm"
          onClick={onRedeem}
          disabled={!canRedeem}
          className={`transition-all duration-300 ${isRecentlyRedeemed ? 'bg-green-500 hover:bg-green-600' : ''
            }`}
        >
          <Gift className={`h-4 w-4 mr-2 ${isRecentlyRedeemed ? 'animate-spin' : ''
            }`} />
          {isRecentlyRedeemed ? 'Redeemed!' : 'Redeem'}
        </Button>
      </CardFooter>
    </Card>
  )
}

