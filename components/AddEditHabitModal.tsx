'use client'

import { useState } from 'react'
import { RRule, RRuleSet, rrulestr } from 'rrule'
import { useAtom } from 'jotai'
import { settingsAtom, browserSettingsAtom, usersAtom } from '@/lib/atoms'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Info, SmilePlus, Zap } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { Habit, SafeUser } from '@/lib/types'
import { convertHumanReadableFrequencyToMachineReadable, convertMachineReadableFrequencyToHumanReadable, d2s, d2t, serializeRRule } from '@/lib/utils'
import { INITIAL_DUE, INITIAL_RECURRENCE_RULE, QUICK_DATES, RECURRENCE_RULE_MAP } from '@/lib/constants'
import * as chrono from 'chrono-node';
import { DateTime } from 'luxon'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useHelpers } from '@/lib/client-helpers'

interface AddEditHabitModalProps {
  onClose: () => void
  onSave: (habit: Omit<Habit, 'id'>) => Promise<void>
  habit?: Habit | null
  isTask: boolean
}

export default function AddEditHabitModal({ onClose, onSave, habit, isTask }: AddEditHabitModalProps) {
  const [settings] = useAtom(settingsAtom)
  const [name, setName] = useState(habit?.name || '')
  const [description, setDescription] = useState(habit?.description || '')
  const [coinReward, setCoinReward] = useState(habit?.coinReward || 1)
  const [targetCompletions, setTargetCompletions] = useState(habit?.targetCompletions || 1)
  const isRecurRule = !isTask
  // Initialize ruleText with the actual frequency string or default, not the display text
  const initialRuleText = habit?.frequency ? convertMachineReadableFrequencyToHumanReadable({ 
    frequency: habit.frequency,
    isRecurRule, 
    timezone: settings.system.timezone
  }) : (isRecurRule ? INITIAL_RECURRENCE_RULE : INITIAL_DUE);
  const [ruleText, setRuleText] = useState<string>(initialRuleText)
  const { currentUser } = useHelpers()
  const [isQuickDatesOpen, setIsQuickDatesOpen] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>((habit?.userIds || []).filter(id => id !== currentUser?.id))
  const [usersData] = useAtom(usersAtom)
  const users = usersData.users

  function getFrequencyUpdate() {
    if (ruleText === initialRuleText && habit?.frequency) {
      // If text hasn't changed and original frequency exists, return it
      return habit.frequency;
    }

    const parsedResult = convertHumanReadableFrequencyToMachineReadable({
      text: ruleText,
      timezone: settings.system.timezone,
      isRecurring: isRecurRule
    });

    if (parsedResult.result) {
      return isRecurRule
        ? serializeRRule(parsedResult.result as RRule)
        : d2t({
          dateTime: parsedResult.result as DateTime,
          timezone: settings.system.timezone
        });
    } else {
      return 'invalid';
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave({
      name,
      description,
      coinReward,
      targetCompletions: targetCompletions > 1 ? targetCompletions : undefined,
      completions: habit?.completions || [],
      frequency: getFrequencyUpdate(),
      userIds: selectedUserIds.length > 0 ? selectedUserIds.concat(currentUser?.id || []) : (currentUser && [currentUser.id])
    })
  }

  const { result, message: errorMessage } = convertHumanReadableFrequencyToMachineReadable({ text: ruleText, timezone: settings.system.timezone, isRecurring: isRecurRule });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{habit ? `Edit ${isTask ? 'Task' : 'Habit'}` : `Add New ${isTask ? 'Task' : 'Habit'}`}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
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
                        setName(prev => {
                          // Add space before emoji if there isn't one already
                          const space = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
                          return `${prev}${space}${emoji.native}`;
                        })
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
              <Label htmlFor="recurrence" className="text-right">
                When *
              </Label>
              {/* date input (task) */}
              <div className="col-span-3 space-y-2">
                <div className="flex gap-2">
                  <Input
                    id="recurrence"
                    value={ruleText}
                    onChange={(e) => setRuleText(e.target.value)}
                    required
                  />
                  {isTask && (
                    <Popover open={isQuickDatesOpen} onOpenChange={setIsQuickDatesOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <Zap className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-3 w-[280px] max-h-[40vh] overflow-y-auto" align="start">
                        <div className="space-y-1">
                          <div className="grid grid-cols-2 gap-2">
                            {QUICK_DATES.map((date) => (
                              <Button
                                key={date.value}
                                variant="outline"
                                className="justify-start h-9 px-3 hover:bg-primary hover:text-primary-foreground transition-colors"
                                onClick={() => {
                                  setRuleText(date.value);
                                  setIsQuickDatesOpen(false);
                                }}
                              >
                                {date.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
              {/* rrule input (habit) */}
              <div className="col-start-2 col-span-3 text-sm">
                <span className={errorMessage ? 'text-destructive' : 'text-muted-foreground'}>
                  {errorMessage ? errorMessage : convertMachineReadableFrequencyToHumanReadable({ frequency: result, isRecurRule, timezone: settings.system.timezone })}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="flex items-center gap-2 justify-end">
                <Label htmlFor="targetCompletions">
                  Complete
                </Label>
              </div>
              <div className="col-span-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setTargetCompletions(prev => Math.max(1, prev - 1))}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                    >
                      -
                    </button>
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
                      className="w-20 text-center border-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => setTargetCompletions(prev => Math.min(10, prev + 1))}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    times
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="flex items-center gap-2 justify-end">
                <Label htmlFor="coinReward">
                  Reward
                </Label>
              </div>
              <div className="col-span-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setCoinReward(prev => Math.max(0, prev - 1))}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                    >
                      -
                    </button>
                    <Input
                      id="coinReward"
                      type="number"
                      value={coinReward}
                      onChange={(e) => setCoinReward(parseInt(e.target.value === "" ? "0" : e.target.value))}
                      min={0}
                      required
                      className="w-20 text-center border-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => setCoinReward(prev => prev + 1)}
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
            {users && users.length > 1 && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="flex items-center justify-end gap-2">
                  <Label htmlFor="sharing-toggle">Share</Label>
                </div>
                <div className="col-span-3">
                  <div className="flex flex-wrap gap-2">
                    {users.filter((u) => u.id !== currentUser?.id).map(user => (
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
            <Button type="submit" disabled={errorMessage !== null}>{habit ? 'Save Changes' : `Add ${isTask ? 'Task' : 'Habit'}`}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

