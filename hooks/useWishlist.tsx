import { useState, useEffect } from 'react'
import { loadWishlistItems, saveWishlistItems } from '@/app/actions/data'
import { toast } from '@/hooks/use-toast'
import { WishlistItemType } from '@/lib/types'
import { useCoins } from '@/hooks/useCoins'
import { celebrations } from '@/utils/celebrations'

export function useWishlist() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItemType[]>([])
  const { balance, removeAmount } = useCoins()

  useEffect(() => {
    fetchWishlistItems()
  }, [])

  const fetchWishlistItems = async () => {
    const items = await loadWishlistItems()
    setWishlistItems(items)
  }

  const addWishlistItem = async (item: Omit<WishlistItemType, 'id'>) => {
    const newItem = { ...item, id: Date.now().toString() }
    const newItems = [...wishlistItems, newItem]
    setWishlistItems(newItems)
    await saveWishlistItems(newItems)
  }

  const editWishlistItem = async (updatedItem: WishlistItemType) => {
    const newItems = wishlistItems.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    )
    setWishlistItems(newItems)
    await saveWishlistItems(newItems)
  }

  const deleteWishlistItem = async (id: string) => {
    const newItems = wishlistItems.filter(item => item.id !== id)
    setWishlistItems(newItems)
    await saveWishlistItems(newItems)
  }

  const redeemWishlistItem = async (item: WishlistItemType) => {
    if (balance >= item.coinCost) {
      await removeAmount(
        item.coinCost,
        `Redeemed reward: ${item.name}`,
        'WISH_REDEMPTION',
        item.id
      )
      
      // Randomly choose a celebration effect
      const celebrationEffects = [
        celebrations.basic,
        celebrations.fireworks,
        celebrations.shower
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

  return {
    wishlistItems,
    addWishlistItem,
    editWishlistItem,
    deleteWishlistItem,
    redeemWishlistItem,
    canRedeem: (cost: number) => balance >= cost
  }
}
