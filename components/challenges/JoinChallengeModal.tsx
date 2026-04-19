'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface JoinChallengeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onJoin: (code: string) => Promise<boolean>
}

export default function JoinChallengeModal({ open, onOpenChange, onJoin }: JoinChallengeModalProps) {
  const t = useTranslations('Challenges')
  const [code, setCode] = useState('')
  const [joining, setJoining] = useState(false)

  const handleJoin = async () => {
    if (!code.trim()) return
    setJoining(true)
    const success = await onJoin(code.trim())
    setJoining(false)
    if (success) {
      setCode('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('joinTitle')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="joinCode">{t('joinCodeLabel')}</Label>
            <Input
              id="joinCode"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t('joinCodePlaceholder')}
              maxLength={8}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancelButton')}
          </Button>
          <Button onClick={handleJoin} disabled={!code.trim() || joining}>
            {t('joinButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
