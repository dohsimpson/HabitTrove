import { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { settingsAtom } from '@/lib/atoms'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info, SmilePlus } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { Habit } from '@/lib/types'

interface AddEditHabitModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (habit: Omit<Habit, 'id'>) => void
  habit?: Habit | null
}

export default function AddEditHabitModal({ isOpen, onClose, onSave, habit }: AddEditHabitModalProps) {
  const [settings] = useAtom(settingsAtom)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [coinReward, setCoinReward] = useState(1)
  const [targetCompletions, setTargetCompletions] = useState(1)

  useEffect(() => {
    if (habit) {
      setName(habit.name)
      setDescription(habit.description)
      setFrequency(habit.frequency)
      setCoinReward(habit.coinReward)
      setTargetCompletions(habit.targetCompletions || 1)
    } else {
      setName('')
      setDescription('')
      setFrequency('daily')
      setCoinReward(1)
    }
  }, [habit])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name,
      description,
      frequency,
      coinReward,
      targetCompletions: targetCompletions > 1 ? targetCompletions : undefined,
      completions: habit?.completions || []
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{habit ? 'Edit Habit' : 'Add New Habit'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <div className='flex col-span-3 gap-2'>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                      <SmilePlus className="h-8 w-8" />
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
              <Label htmlFor="frequency" className="text-right">
                Frequency
              </Label>
              <Select value={frequency} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setFrequency(value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="flex items-center gap-2 justify-end">
                <Label htmlFor="targetCompletions">
                  Daily Target
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent className='text-sm'>
                      <p>How many times you want to complete this habit each day.<br />For example: drink 7 glasses of water or take 3 walks<br /><br />You'll only receive the coin reward after reaching the daily target.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    id="targetCompletions"
                    type="number"
                    value={targetCompletions}
                    onChange={(e) => {
                      const value = parseInt(e.target.value)
                      setTargetCompletions(isNaN(value) ? 1 : Math.max(1, value))
                    }}
                    min={1}
                    max={10}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">
                    times per day
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="coinReward" className="text-right">
                Coin Reward
              </Label>
              <Input
                id="coinReward"
                type="number"
                value={coinReward}
                onChange={(e) => setCoinReward(parseInt(e.target.value === "" ? "0" : e.target.value))}
                className="col-span-3"
                min={1}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">{habit ? 'Save Changes' : 'Add Habit'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

