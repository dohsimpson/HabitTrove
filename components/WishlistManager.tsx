'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Gift } from 'lucide-react'
import EmptyState from './EmptyState'
import { Button } from '@/components/ui/button'
import WishlistItem from './WishlistItem'
import AddEditWishlistItemModal from './AddEditWishlistItemModal'
import ConfirmDialog from './ConfirmDialog'
import { WishlistItemType } from '@/lib/types'
import { useWishlist } from '@/hooks/useWishlist'

export default function WishlistManager() {
  const {
    wishlistItems,
    addWishlistItem,
    editWishlistItem,
    deleteWishlistItem,
    redeemWishlistItem,
    canRedeem
  } = useWishlist()

  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null)
  const [recentlyRedeemedId, setRecentlyRedeemedId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WishlistItemType | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean, itemId: string | null }>({
    isOpen: false,
    itemId: null
  })

  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    // Check URL for highlight parameter
    const params = new URLSearchParams(window.location.search)
    const highlightId = params.get('highlight')
    if (highlightId) {
      setHighlightedItemId(highlightId)
      // Scroll the element into view after a short delay to ensure rendering
      setTimeout(() => {
        const element = itemRefs.current[highlightId]
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
      // Remove highlight after animation
      setTimeout(() => setHighlightedItemId(null), 2000)
    }
  }, [])


  const handleRedeem = async (item: WishlistItemType) => {
    const success = await redeemWishlistItem(item)
    if (success) {
      setRecentlyRedeemedId(item.id)
      setTimeout(() => {
        setRecentlyRedeemedId(null)
      }, 3000)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Wishlist</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Reward
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {wishlistItems.length === 0 ? (
          <div className="col-span-2">
            <EmptyState
              icon={Gift}
              title="Your wishlist is empty"
              description="Add rewards that you'd like to earn with your coins"
            />
          </div>
        ) : (
          wishlistItems.map((item) => (
            <div
              key={item.id}
              ref={(el) => {
                if (el) {
                  itemRefs.current[item.id] = el
                }
              }}
            >
              <WishlistItem
                item={item}
                isHighlighted={item.id === highlightedItemId}
                isRecentlyRedeemed={item.id === recentlyRedeemedId}
                onEdit={() => {
                  setEditingItem(item)
                  setIsModalOpen(true)
                }}
                onDelete={() => setDeleteConfirmation({ isOpen: true, itemId: item.id })}
                onRedeem={() => handleRedeem(item)}
                canRedeem={canRedeem(item.coinCost)}
              />
            </div>
          ))
        )}
      </div>
      <AddEditWishlistItemModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingItem(null)
        }}
        onSave={(item) => {
          if (editingItem) {
            editWishlistItem({ ...item, id: editingItem.id })
          } else {
            addWishlistItem(item)
          }
          setIsModalOpen(false)
          setEditingItem(null)
        }}
        item={editingItem}
      />
      <ConfirmDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, itemId: null })}
        onConfirm={() => {
          if (deleteConfirmation.itemId) {
            deleteWishlistItem(deleteConfirmation.itemId)
          }
          setDeleteConfirmation({ isOpen: false, itemId: null })
        }}
        title="Delete Reward"
        message="Are you sure you want to delete this reward? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  )
}
