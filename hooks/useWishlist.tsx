import { useAtom } from 'jotai'
import { useTranslations } from 'next-intl'
import { wishlistAtom, coinsAtom } from '@/lib/atoms'
import { saveWishlistItems, removeCoins } from '@/app/actions/data'
import { toast } from '@/hooks/use-toast'
import { WishlistItemType } from '@/lib/types'
import { celebrations } from '@/utils/celebrations'
import { checkPermission } from '@/lib/utils'
import { useHelpers } from '@/lib/client-helpers'
import { useCoins } from './useCoins'

function handlePermissionCheck(
  user: any, // Consider using a more specific type like SafeUser | User | undefined
  resource: 'habit' | 'wishlist' | 'coins',
  action: 'write' | 'interact',
  tCommon: (key: string, values?: Record<string, any>) => string
): boolean {
  if (!user) {
    toast({
      title: tCommon("authenticationRequiredTitle"),
      description: tCommon("authenticationRequiredDescription"),
      variant: "destructive",
    })
    return false
  }
  
  if (!user.isAdmin && !checkPermission(user.permissions, resource, action)) {
    toast({
      title: tCommon("permissionDeniedTitle"),
      description: tCommon("permissionDeniedDescription", { action, resource }),
      variant: "destructive",
    })
    return false
  }
  
  return true
}

export function useWishlist() {
  const t = useTranslations('useWishlist');
  const tCommon = useTranslations('Common');
  const { currentUser: user } = useHelpers()
  const [wishlist, setWishlist] = useAtom(wishlistAtom)
  const [coins, setCoins] = useAtom(coinsAtom)
  const { balance } = useCoins()

  const addWishlistItem = async (item: Omit<WishlistItemType, 'id'>) => {
    if (!handlePermissionCheck(user, 'wishlist', 'write', tCommon)) return
    const newItem = { ...item, id: Date.now().toString() }
    const newItems = [...wishlist.items, newItem]
    const newWishListData = { items: newItems }
    setWishlist(newWishListData)
    await saveWishlistItems(newWishListData)
  }

  const editWishlistItem = async (updatedItem: WishlistItemType) => {
    if (!handlePermissionCheck(user, 'wishlist', 'write', tCommon)) return
    const newItems = wishlist.items.map(item =>
      item.id === updatedItem.id ? updatedItem : item
    )
    const newWishListData = { items: newItems }
    setWishlist(newWishListData)
    await saveWishlistItems(newWishListData)
  }

  const deleteWishlistItem = async (id: string) => {
    if (!handlePermissionCheck(user, 'wishlist', 'write', tCommon)) return
    const newItems = wishlist.items.filter(item => item.id !== id)
    const newWishListData = { items: newItems }
    setWishlist(newWishListData)
    await saveWishlistItems(newWishListData)
  }

  const redeemWishlistItem = async (item: WishlistItemType) => {
    if (!handlePermissionCheck(user, 'wishlist', 'interact', tCommon)) return false
    if (balance >= item.coinCost) {
      // Check if item has target completions and if we've reached the limit
      if (item.targetCompletions && item.targetCompletions <= 0) {
        toast({
          title: t("redemptionLimitReachedTitle"),
          description: t("redemptionLimitReachedDescription", { itemName: item.name }),
          variant: "destructive",
        })
        return false
      }

      const data = await removeCoins({
        amount: item.coinCost,
        description: `Redeemed reward: ${item.name}`,
        type: 'WISH_REDEMPTION',
        relatedItemId: item.id
      })
      setCoins(data)

      // Update target completions if set
      if (item.targetCompletions !== undefined) {
        const newItems = wishlist.items.map(wishlistItem => {
          if (wishlistItem.id === item.id) {
            const newTarget = wishlistItem.targetCompletions! - 1
            // If target reaches 0, archive the item
            if (newTarget <= 0) {
              return { 
                ...wishlistItem, 
                targetCompletions: undefined,
                archived: true
              }
            }
            return { 
              ...wishlistItem, 
              targetCompletions: newTarget 
            }
          }
          return wishlistItem
        })
        const newWishListData = { items: newItems }
        setWishlist(newWishListData)
        await saveWishlistItems(newWishListData)
      }

      // Randomly choose a celebration effect
      const celebrationEffects = [
        celebrations.emojiParty
      ]
      const randomEffect = celebrationEffects[Math.floor(Math.random() * celebrationEffects.length)]
      randomEffect()

      toast({
        title: t("rewardRedeemedTitle"),
        description: t("rewardRedeemedDescription", { itemName: item.name, itemCoinCost: item.coinCost }),
      })

      return true
    } else {
      toast({
        title: t("notEnoughCoinsTitle"),
        description: t("notEnoughCoinsDescription", { coinsNeeded: item.coinCost - balance }),
        variant: "destructive",
      })
      return false
    }
  }

  const canRedeem = (cost: number) => balance >= cost

  const archiveWishlistItem = async (id: string) => {
    if (!handlePermissionCheck(user, 'wishlist', 'write', tCommon)) return
    const newItems = wishlist.items.map(item =>
      item.id === id ? { ...item, archived: true } : item
    )
    const newWishListData = { items: newItems }
    setWishlist(newWishListData)
    await saveWishlistItems(newWishListData)
  }

  const unarchiveWishlistItem = async (id: string) => {
    if (!handlePermissionCheck(user, 'wishlist', 'write', tCommon)) return
    const newItems = wishlist.items.map(item =>
      item.id === id ? { ...item, archived: false } : item
    )
    const newWishListData = { items: newItems }
    setWishlist(newWishListData)
    await saveWishlistItems(newWishListData)
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
