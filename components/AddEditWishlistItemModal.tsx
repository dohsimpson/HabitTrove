import { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { useTranslations } from 'next-intl'
import { usersAtom, currentUserAtom } from '@/lib/atoms'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { WishlistItemType } from '@/lib/types'
import EmojiPickerButton from './EmojiPickerButton'
import ModalOverlay from './ModalOverlay'
import { MAX_COIN_LIMIT } from '@/lib/constants'

interface AddEditWishlistItemModalProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  editingItem: WishlistItemType | null
  setEditingItem: (item: WishlistItemType | null) => void
  addWishlistItem: (item: Omit<WishlistItemType, 'id'>) => void
  editWishlistItem: (item: WishlistItemType) => void
}

export default function AddEditWishlistItemModal({
  isOpen,
  setIsOpen,
  editingItem,
  setEditingItem,
  addWishlistItem,
  editWishlistItem
}: AddEditWishlistItemModalProps) {
  const t = useTranslations('AddEditWishlistItemModal')
  const [name, setName] = useState(editingItem?.name || '')
  const [description, setDescription] = useState(editingItem?.description || '')
  const [coinCost, setCoinCost] = useState(editingItem?.coinCost || 1)
  const [targetCompletions, setTargetCompletions] = useState<number | undefined>(editingItem?.targetCompletions)
  const [link, setLink] = useState(editingItem?.link || '')
  const [currentUser] = useAtom(currentUserAtom)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>((editingItem?.userIds || []).filter(id => id !== currentUser?.id))
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [usersData] = useAtom(usersAtom)

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name)
      setDescription(editingItem.description)
      setCoinCost(editingItem.coinCost)
      setTargetCompletions(editingItem.targetCompletions)
      setLink(editingItem.link || '')
    } else {
      setName('')
      setDescription('')
      setCoinCost(1)
      setTargetCompletions(undefined)
      setLink('')
    }
    setErrors({})
  }, [editingItem])

  const validate = () => {
    const newErrors: { [key: string]: string } = {}
    if (!name.trim()) {
      newErrors.name = t('errorNameRequired')
    }
    if (coinCost < 1) {
      newErrors.coinCost = t('errorCoinCostMin')
    } else if (coinCost > MAX_COIN_LIMIT) {
      newErrors.coinCost = t('errorCoinCostMax', { max: MAX_COIN_LIMIT })
    }
    if (targetCompletions !== undefined && targetCompletions < 1) {
      newErrors.targetCompletions = t('errorTargetCompletionsMin')
    }
    if (link && !isValidUrl(link)) {
      newErrors.link = t('errorInvalidUrl')
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setEditingItem(null)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const itemData = {
      name,
      description,
      coinCost,
      targetCompletions: targetCompletions || undefined,
      link: link.trim() || undefined,
      userIds: selectedUserIds.length > 0 ? selectedUserIds.concat(currentUser?.id || []) : (currentUser && [currentUser.id])
    }

    if (editingItem) {
      editWishlistItem({ ...itemData, id: editingItem.id })
    } else {
      addWishlistItem(itemData)
    }

    setIsOpen(false)
    setEditingItem(null)
  }

  return (
    <>
      <ModalOverlay />
      <Dialog open={true} onOpenChange={handleClose} modal={false}>
        <DialogContent> {/* DialogContent from shadcn/ui is typically z-50, ModalOverlay is z-40 */}
          <DialogHeader>
            <DialogTitle>{editingItem ? t('editTitle') : t('addTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  {t('nameLabel')}
                </Label>
                <div className="col-span-3 flex gap-2">
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1"
                    required
                  />
                  <EmojiPickerButton
                    inputIdToFocus="name"
                    onEmojiSelect={(emoji) => {
                      setName(prev => {
                        const space = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
                        return `${prev}${space}${emoji}`;
                      })
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  {t('descriptionLabel')}
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="flex items-center gap-2 justify-end">
                  <Label htmlFor="coinReward">
                    {t('costLabel')}
                  </Label>
                </div>
                <div className="col-span-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setCoinCost(prev => Math.max(0, prev - 1))}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                      >
                        -
                      </button>
                      <Input
                        id="coinReward"
                        type="number"
                        value={coinCost}
                        onChange={(e) => {
                          const value = parseInt(e.target.value === "" ? "0" : e.target.value)
                          setCoinCost(Math.min(value, MAX_COIN_LIMIT))
                        }}
                        min={0}
                        max={MAX_COIN_LIMIT}
                        required
                        className="w-20 text-center border-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => setCoinCost(prev => Math.min(prev + 1, MAX_COIN_LIMIT))}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {t('coinsSuffix')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="flex items-center gap-2 justify-end">
                  <Label htmlFor="targetCompletions">
                    {t('redeemableLabel')}
                  </Label>
                </div>
                <div className="col-span-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setTargetCompletions(prev => prev !== undefined && prev > 1 ? prev - 1 : undefined)}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                      >
                        -
                      </button>
                      <Input
                        id="targetCompletions"
                        type="number"
                        value={targetCompletions || ''}
                        onChange={(e) => {
                          const value = e.target.value
                          setTargetCompletions(value && value !== "0" ? parseInt(value) : undefined)
                        }}
                        min={0}
                        placeholder="∞"
                        className="w-20 text-center border-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => setTargetCompletions(prev => Math.min(10, (prev || 0) + 1))}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {t('timesSuffix')}
                    </span>
                  </div>
                  {errors.targetCompletions && (
                    <div className="text-sm text-red-500">
                      {errors.targetCompletions}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="link" className="text-right">
                  {t('linkLabel')}
                </Label>
                <div className="col-span-3">
                  <Input
                    id="link"
                    type="url"
                    placeholder="https://..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="col-span-3"
                  />
                  {errors.link && (
                    <div className="text-sm text-red-500">
                      {errors.link}
                    </div>
                  )}
                </div>
              </div>
              {usersData.users && usersData.users.length > 1 && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="flex items-center justify-end gap-2">
                    <Label htmlFor="sharing-toggle">{t('shareLabel')}</Label>
                  </div>
                  <div className="col-span-3">
                    <div className="flex flex-wrap gap-2">
                      {usersData.users.filter((u) => u.id !== currentUser?.id).map(user => (
                        <Avatar
                          key={user.id}
                          className={`h-8 w-8 border-2 cursor-pointer
                          ${selectedUserIds.includes(user.id)
                              ? 'border-primary'
                              : 'border-muted'
                            }`}
                          title={user.username}
                          onClick={() => {
                            setSelectedUserIds(prev =>
                              prev.includes(user.id)
                                ? prev.filter(id => id !== user.id)
                                : [...prev, user.id]
                            )
                          }}
                        >
                          <AvatarImage src={user?.avatarPath && `/api/avatars/${user.avatarPath.split('/').pop()}` || ""} />
                          <AvatarFallback>{user.username[0]}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="submit">{editingItem ? t('saveButton') : t('addButton')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

