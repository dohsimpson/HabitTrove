import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SmilePlus } from 'lucide-react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { WishlistItemType } from '@/lib/types'

interface AddEditWishlistItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (item: Omit<WishlistItemType, 'id'>) => void
  item?: WishlistItemType | null
}

export default function AddEditWishlistItemModal({ isOpen, onClose, onSave, item }: AddEditWishlistItemModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [coinCost, setCoinCost] = useState(1)

  useEffect(() => {
    if (item) {
      setName(item.name)
      setDescription(item.description)
      setCoinCost(item.coinCost)
    } else {
      setName('')
      setDescription('')
      setCoinCost(1)
    }
  }, [item])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ name, description, coinCost })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Reward' : 'Add New Reward'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
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
                      onEmojiSelect={(emoji: any) => {
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
              <Label htmlFor="coinCost" className="text-right">
                Coin Cost
              </Label>
              <Input
                id="coinCost"
                type="number"
                value={coinCost}
                onChange={(e) => setCoinCost(parseInt(e.target.value === "" ? "0" : e.target.value))}
                className="col-span-3"
                min={1}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">{item ? 'Save Changes' : 'Add Reward'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

