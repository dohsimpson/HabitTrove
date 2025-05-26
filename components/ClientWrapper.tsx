'use client'

import { ReactNode, Suspense, useEffect, useState } from 'react'
import { useAtom } from 'jotai'
import { aboutOpenAtom, pomodoroAtom, userSelectAtom } from '@/lib/atoms'
import PomodoroTimer from './PomodoroTimer'
import UserSelectModal from './UserSelectModal'
import { useSession } from 'next-auth/react'
import AboutModal from './AboutModal'
import LoadingSpinner from './LoadingSpinner'

export default function ClientWrapper({ children }: { children: ReactNode }) {
  const [pomo] = useAtom(pomodoroAtom)
  const [userSelect, setUserSelect] = useAtom(userSelectAtom)
  const [aboutOpen, setAboutOpen] = useAtom(aboutOpenAtom)
  const { data: session, status } = useSession()
  const currentUserId = session?.user.id
  const [isMounted, setIsMounted] = useState(false);

  // block client-side hydration until mounted (this is crucial to wait for all jotai atoms to load), to prevent SSR hydration errors in the children components
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'loading') return
    if (!currentUserId && !userSelect) {
      setUserSelect(true)
    }
  }, [currentUserId, status, userSelect])

  if (!isMounted) {
    return <LoadingSpinner />
  }
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
