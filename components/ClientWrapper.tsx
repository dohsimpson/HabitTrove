'use client'

import { ReactNode } from 'react'
import { useAtom } from 'jotai'
import { pomodoroAtom } from '@/lib/atoms'
import PomodoroTimer from './PomodoroTimer'

export default function ClientWrapper({ children }: { children: ReactNode }) {
  const [pomo] = useAtom(pomodoroAtom)

  return (
    <>
      {children}
      {pomo.show && (
        <PomodoroTimer />
      )}
    </>
  )
}
