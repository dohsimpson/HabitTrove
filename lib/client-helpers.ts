// client helpers
'use-client'

import { useSession } from "next-auth/react"
import { User, UserId } from './types'
import { useAtom } from 'jotai'
import { usersAtom } from './atoms'

export function useHelpers() {
  const { data: session, status } = useSession()
  const currentUser = session?.user
  const [usersData] = useAtom(usersAtom)
  const currentUserData = usersData.users.find((u) => u.id === currentUser?.id)

  return {
    currentUser,
    currentUserData,
    usersData,
    status
  }
}