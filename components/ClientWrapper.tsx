'use client'

import { ReactNode, useEffect } from 'react'
import { useAtom } from 'jotai'
import { aboutOpenAtom, pomodoroAtom, userSelectAtom } from '@/lib/atoms'
import PomodoroTimer from './PomodoroTimer'
import UserSelectModal from './UserSelectModal'
import { useSession } from 'next-auth/react'
import AboutModal from './AboutModal'

export default function ClientWrapper({ children }: { children: ReactNode }) {
  const [pomo] = useAtom(pomodoroAtom)
  const [userSelect, setUserSelect] = useAtom(userSelectAtom)
  const [aboutOpen, setAboutOpen] = useAtom(aboutOpenAtom)
  const { data: session, status } = useSession()
  const currentUserId = session?.user.id

  useEffect(() => {
    if (status === 'loading') return
    if (!currentUserId && !userSelect) {
      setUserSelect(true)
    }
  }, [currentUserId, status, userSelect])

  return (
    <>
      {children}
      {pomo.show && (
        <PomodoroTimer />
      )}
      {userSelect && (
        <UserSelectModal onClose={() => setUserSelect(false)} />
      )}
      {aboutOpen && (
        <AboutModal onClose={() => setAboutOpen(false)} />
      )}
    </>
  )
}
