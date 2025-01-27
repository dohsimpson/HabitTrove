import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { SmilePlus, Info } from 'lucide-react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { WishlistItemType } from '@/lib/types'

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
  const [name, setName] = useState(editingItem?.name || '')
  const [description, setDescription] = useState(editingItem?.description || '')
  const [coinCost, setCoinCost] = useState(editingItem?.coinCost || 1)
  const [targetCompletions, setTargetCompletions] = useState<number | undefined>(editingItem?.targetCompletions)
  const [link, setLink] = useState(editingItem?.link || '')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

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
      newErrors.name = 'Name is required'
    }
    if (coinCost < 1) {
      newErrors.coinCost = 'Coin cost must be at least 1'
    }
    if (targetCompletions !== undefined && targetCompletions < 1) {
      newErrors.targetCompletions = 'Target completions must be at least 1'
    }
    if (link && !isValidUrl(link)) {
      newErrors.link = 'Please enter a valid URL'
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
      link: link.trim() || undefined
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Edit Reward' : 'Add New Reward'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
              </Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1"
                  required
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                    >
                      <SmilePlus className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Picker
                      data={data}
                      onEmojiSelect={(emoji: { native: string }) => {
                        setName(prev => `${prev}${emoji.native}`)
                        // Focus back on input after selection
                        const input = document.getElementById('name') as HTMLInputElement
                        input?.focus()
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
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
                  Cost
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
                      onChange={(e) => setCoinCost(parseInt(e.target.value === "" ? "0" : e.target.value))}
                      min={0}
                      required
                      className="w-20 text-center border-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => setCoinCost(prev => prev + 1)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    coins
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="flex items-center gap-2 justify-end">
                <Label htmlFor="targetCompletions">
                  Redeemable
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
                    times
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
                Link
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
          </div>
          <DialogFooter>
            <Button type="submit">{editingItem ? 'Save Changes' : 'Add Reward'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

