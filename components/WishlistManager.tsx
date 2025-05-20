'use client'

import { useState, useEffect, useRef } from 'react'
import { useWishlist } from '@/hooks/useWishlist'
import { useTranslations } from 'next-intl'
import { Plus, Gift } from 'lucide-react'
import EmptyState from './EmptyState'
import { Button } from '@/components/ui/button'
import WishlistItem from './WishlistItem'
import AddEditWishlistItemModal from './AddEditWishlistItemModal'
import ConfirmDialog from './ConfirmDialog'
import { WishlistItemType } from '@/lib/types'
import { openWindow } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

export default function WishlistManager() {
  const t = useTranslations('WishlistManager')
  const {
    addWishlistItem,
    editWishlistItem,
    deleteWishlistItem,
    redeemWishlistItem,
    archiveWishlistItem,
    unarchiveWishlistItem,
    canRedeem,
    wishlistItems
  } = useWishlist()

  const activeItems = wishlistItems.filter(item => !item.archived)
  const archivedItems = wishlistItems.filter(item => item.archived)

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

      if (item.link) {
        setTimeout(() => {
          const opened = openWindow(item.link!)
          if (!opened) {
            toast({
              title: t('popupBlockedTitle'),
              description: t('popupBlockedDescription'),
              variant: "destructive"
            })
          }
        }, 300)
      }
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl xs:text-3xl font-bold">{t('title')}</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> {t('addRewardButton')}
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {activeItems.length === 0 ? (
          <div className="col-span-1 lg:col-span-2">
            <EmptyState
              icon={Gift}
              title={t('emptyStateTitle')}
              description={t('emptyStateDescription')}
            />
          </div>
        ) : (
          activeItems.map((item) => (
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
                onArchive={() => archiveWishlistItem(item.id)}
                onUnarchive={() => unarchiveWishlistItem(item.id)}
                canRedeem={canRedeem(item.coinCost)}
              />
            </div>
          ))
        )}

        {archivedItems.length > 0 && (
          <>
            <div className="col-span-1 lg:col-span-2 relative flex items-center my-6">
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600" />
              <span className="mx-4 text-sm text-gray-500 dark:text-gray-400">{t('archivedSectionTitle')}</span>
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600" />
            </div>
            {archivedItems.map((item) => (
              <WishlistItem
                key={item.id}
                item={item}
                onEdit={() => {
                  setEditingItem(item)
                  setIsModalOpen(true)
                }}
                onDelete={() => setDeleteConfirmation({ isOpen: true, itemId: item.id })}
                onRedeem={() => handleRedeem(item)}
                onArchive={() => archiveWishlistItem(item.id)}
                onUnarchive={() => unarchiveWishlistItem(item.id)}
                canRedeem={canRedeem(item.coinCost)}
              />
            ))}
          </>
        )}
      </div>
      <AddEditWishlistItemModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        editingItem={editingItem}
        setEditingItem={setEditingItem}
        addWishlistItem={addWishlistItem}
        editWishlistItem={editWishlistItem}
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
        title={t('deleteDialogTitle')}
        message={t('deleteDialogMessage')}
        confirmText={t('deleteButton')}
      />
    </div>
  )
}
