'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SmilePlus } from 'lucide-react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

interface EmojiPickerButtonProps {
  onEmojiSelect: (emoji: string) => void
  inputIdToFocus?: string // Optional: ID of the input to focus after selection
}

export default function EmojiPickerButton({ onEmojiSelect, inputIdToFocus }: EmojiPickerButtonProps) {
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)

  return (
    <Popover modal={true} open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8" // Consistent sizing
        >
          <SmilePlus className="h-4 w-4" /> {/* Consistent icon size */}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[300px] p-0"
        onCloseAutoFocus={(event) => {
          if (inputIdToFocus) {
            event.preventDefault();
            const input = document.getElementById(inputIdToFocus) as HTMLInputElement;
            input?.focus();
          }
        }}
      >
        <Picker
          data={data}
          onEmojiSelect={(emoji: { native: string }) => {
            onEmojiSelect(emoji.native);
            setIsEmojiPickerOpen(false);
            // Focus is handled by onCloseAutoFocus
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
