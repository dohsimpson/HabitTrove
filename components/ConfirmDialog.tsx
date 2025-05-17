import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
}: ConfirmDialogProps) {
  const t = useTranslations('ConfirmDialog');
  const finalConfirmText = confirmText || t('confirmButton');
  const finalCancelText = cancelText || t('cancelButton');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>{message}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {finalCancelText}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {finalConfirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
