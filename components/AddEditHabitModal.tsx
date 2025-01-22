'use client'

import { useState, useEffect } from 'react'
import { RRule, RRuleSet, rrulestr } from 'rrule'
import { useAtom } from 'jotai'
import { settingsAtom, browserSettingsAtom } from '@/lib/atoms'
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
import { d2s, d2t, getISODate, getNow, parseNaturalLanguageDate, parseNaturalLanguageRRule, parseRRule, serializeRRule } from '@/lib/utils'
import { INITIAL_DUE, INITIAL_RECURRENCE_RULE } from '@/lib/constants'
import * as chrono from 'chrono-node';
import { DateTime } from 'luxon'

interface AddEditHabitModalProps {
  onClose: () => void
  onSave: (habit: Omit<Habit, 'id'>) => Promise<void>
  habit?: Habit | null
}

export default function AddEditHabitModal({ onClose, onSave, habit }: AddEditHabitModalProps) {
  const [settings] = useAtom(settingsAtom)
  const [browserSettings] = useAtom(browserSettingsAtom)
  const isTasksView = browserSettings.viewType === 'tasks'
  const [name, setName] = useState(habit?.name || '')
  const [description, setDescription] = useState(habit?.description || '')
  const [coinReward, setCoinReward] = useState(habit?.coinReward || 1)
  const [targetCompletions, setTargetCompletions] = useState(habit?.targetCompletions || 1)
  const isRecurRule = !isTasksView
  const origRuleText = isRecurRule ? parseRRule(habit?.frequency || INITIAL_RECURRENCE_RULE).toText() : habit?.frequency || INITIAL_DUE
  const [ruleText, setRuleText] = useState<string>(origRuleText)
  const now = getNow({ timezone: settings.system.timezone })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave({
      name,
      description,
      coinReward,
      targetCompletions: targetCompletions > 1 ? targetCompletions : undefined,
      completions: habit?.completions || [],
      frequency: isRecurRule ? serializeRRule(parseNaturalLanguageRRule(ruleText)) : d2t({ dateTime: parseNaturalLanguageDate({ text: ruleText, timezone: settings.system.timezone }) }),
      isTask: isTasksView ? true : undefined
    })
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{habit ? `Edit ${isTasksView ? 'Task' : 'Habit'}` : `Add New ${isTasksView ? 'Task' : 'Habit'}`}</DialogTitle>
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
                When
              </Label>
              <div className="col-span-3 space-y-2">
                <Input
                  id="recurrence"
                  value={ruleText}
                  onChange={(e) => setRuleText(e.target.value)}
                // placeholder="e.g. 'every weekday' or 'every 2 weeks on Monday, Wednesday'"
                />
              </div>
              <div className="col-start-2 col-span-3 text-sm text-muted-foreground">
                <span>
                  {(() => {
                    try {
                      return isRecurRule ? parseNaturalLanguageRRule(ruleText).toText() : d2s({ dateTime: parseNaturalLanguageDate({ text: ruleText, timezone: settings.system.timezone }), timezone: settings.system.timezone, format: DateTime.DATE_MED_WITH_WEEKDAY })
                    } catch (e: unknown) {
                      return `Invalid rule: ${e instanceof Error ? e.message : 'Invalid recurrence rule'}`
                    }
                  })()}
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
          </div>
          <DialogFooter>
            <Button type="submit">{habit ? 'Save Changes' : `Add ${isTasksView ? 'Task' : 'Habit'}`}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

