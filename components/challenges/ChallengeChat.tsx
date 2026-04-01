'use client'

import { useState, useRef, useEffect } from 'react'
import { useAtom } from 'jotai'
import { useTranslations } from 'next-intl'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { usersAtom, currentUserAtom } from '@/lib/atoms'
import { ChallengeMessage } from '@/lib/types'

interface ChallengeChatProps {
  messages: ChallengeMessage[]
  onSend: (text: string) => Promise<boolean>
  disabled?: boolean
}

export default function ChallengeChat({ messages, onSend, disabled }: ChallengeChatProps) {
  const t = useTranslations('Challenges')
  const [users] = useAtom(usersAtom)
  const [currentUser] = useAtom(currentUserAtom)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const getUserName = (userId: string): string => {
    const user = users.users.find(u => u.id === userId)
    return user?.username ?? userId
  }

  const handleSend = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    const success = await onSend(text.trim())
    if (success) setText('')
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (messages.length === 0 && disabled) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          {t('noMessagesYet')}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <Card className="flex-1">
        <CardContent className="p-3 max-h-[400px] overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              {t('noMessagesYet')}
            </p>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isMe = msg.userId === currentUser?.id
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs text-muted-foreground mb-0.5">
                      {getUserName(msg.userId)}
                    </span>
                    <div
                      className={`px-3 py-1.5 rounded-lg text-sm max-w-[80%] ${
                        isMe
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {msg.messageText}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </CardContent>
      </Card>

      {!disabled && (
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('messagePlaceholder')}
            disabled={sending}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!text.trim() || sending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
