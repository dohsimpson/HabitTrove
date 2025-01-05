import { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { settingsAtom } from '@/lib/atoms'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="targetCompletions" className="text-right">
                Daily Target
              </Label>
              <Input
                id="targetCompletions"
                type="number"
                value={targetCompletions || ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  setTargetCompletions(isNaN(value) ? 1 : Math.max(1, value))
                }}
                className="col-span-3"
                min={1}
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

