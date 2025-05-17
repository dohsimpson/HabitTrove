'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, Loader2, Pencil, Trash2, X } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useTranslations } from 'next-intl'

interface TransactionNoteEditorProps {
  transactionId: string
  initialNote?: string
  onSave: (id: string, note: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function TransactionNoteEditor({
  transactionId,
  initialNote = '',
  onSave,
  onDelete
}: TransactionNoteEditorProps) {
  const t = useTranslations('TransactionNoteEditor');
  const [isEditing, setIsEditing] = useState(false)
  const [noteText, setNoteText] = useState(initialNote)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    const trimmedNote = noteText.trim()
    if (trimmedNote.length > 200) {
      toast({
        title: t('noteTooLongTitle'),
        description: t('noteTooLongDescription'),
        variant: 'destructive'
      })
      return
    }

    setIsSaving(true)
    try {
      await onSave(transactionId, trimmedNote)
      setIsEditing(false)
    } catch (error) {
      toast({
        title: t('errorSavingNoteTitle'),
        description: t('pleaseTryAgainDescription'),
        variant: 'destructive'
      })
      // Revert to initial value on error
      setNoteText(initialNote)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsSaving(true)
    try {
      await onDelete(transactionId)
      setNoteText(initialNote)
      setIsEditing(false)
    } catch (error) {
      toast({
        title: t('errorDeletingNoteTitle'),
        description: t('pleaseTryAgainDescription'),
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 mt-1">
        <Input
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder={t('addNotePlaceholder')}
          className="w-64"
          maxLength={200}
        />
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 transition-colors"
            title={t('saveNoteTitle')}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setNoteText(initialNote)
              setIsEditing(false)
            }}
            disabled={isSaving}
            className="text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
            title={t('cancelButtonTitle')}
          >
            <X className="h-4 w-4" />
          </Button>
          {initialNote && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isSaving}
              className="text-gray-600 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-400 transition-colors"
              title={t('deleteNoteTitle')}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="group flex items-center gap-2 mt-1">
      {noteText && (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {noteText}
        </span>
      )}
      <button
        onClick={() => setIsEditing(true)}
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        aria-label={t('editNoteAriaLabel')}
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  )
}
