import { useAtom } from 'jotai'
import { wishlistAtom, coinsAtom } from '@/lib/atoms'
import { saveWishlistItems, removeCoins } from '@/app/actions/data'
import { toast } from '@/hooks/use-toast'
import { WishlistItemType } from '@/lib/types'
import { celebrations } from '@/utils/celebrations'

export function useWishlist() {
  const [wishlist, setWishlist] = useAtom(wishlistAtom)
  const [coins, setCoins] = useAtom(coinsAtom)
  const balance = coins.balance

  const addWishlistItem = async (item: Omit<WishlistItemType, 'id'>) => {
    const newItem = { ...item, id: Date.now().toString() }
    const newItems = [...wishlist.items, newItem]
    setWishlist({ items: newItems })
    await saveWishlistItems(newItems)
  }

  const editWishlistItem = async (updatedItem: WishlistItemType) => {
    const newItems = wishlist.items.map(item =>
      item.id === updatedItem.id ? updatedItem : item
    )
    setWishlist({ items: newItems })
    await saveWishlistItems(newItems)
  }

  const deleteWishlistItem = async (id: string) => {
    const newItems = wishlist.items.filter(item => item.id !== id)
    setWishlist({ items: newItems })
    await saveWishlistItems(newItems)
  }

  const redeemWishlistItem = async (item: WishlistItemType) => {
    if (balance >= item.coinCost) {
      const data = await removeCoins({
        amount: item.coinCost,
        description: `Redeemed reward: ${item.name}`,
        type: 'WISH_REDEMPTION',
        relatedItemId: item.id
      })
      setCoins(data)

      // Randomly choose a celebration effect
      const celebrationEffects = [
        celebrations.emojiParty
      ]
      const randomEffect = celebrationEffects[Math.floor(Math.random() * celebrationEffects.length)]
      randomEffect()

      toast({
        title: "🎉 Reward Redeemed!",
        description: `You've redeemed "${item.name}" for ${item.coinCost} coins.`,
      })

      return true
    } else {
      toast({
        title: "Not enough coins",
        description: `You need ${item.coinCost - balance} more coins to redeem this reward.`,
        variant: "destructive",
      })
      return false
    }
  }

  const canRedeem = (cost: number) => balance >= cost

  const archiveWishlistItem = async (id: string) => {
    const newItems = wishlist.items.map(item => 
      item.id === id ? { ...item, archived: true } : item
    )
    setWishlist({ items: newItems })
    await saveWishlistItems(newItems)
  }

  const unarchiveWishlistItem = async (id: string) => {
    const newItems = wishlist.items.map(item => 
      item.id === id ? { ...item, archived: undefined } : item
    )
    setWishlist({ items: newItems })
    await saveWishlistItems(newItems)
  }

  return {
    addWishlistItem,
    editWishlistItem,
    deleteWishlistItem,
    redeemWishlistItem,
    archiveWishlistItem,
    unarchiveWishlistItem,
    canRedeem,
    wishlistItems: wishlist.items
  }
}
