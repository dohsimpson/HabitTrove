// client helpers
'use-client'

import { useSession } from "next-auth/react"
import { User, UserId } from './types'
import { useAtom } from 'jotai'
import { usersAtom } from './atoms'
import { checkPermission } from './utils'

export function useHelpers() {
  const { data: session, status } = useSession()
  const currentUserId = session?.user.id
  const [usersData] = useAtom(usersAtom)
  const currentUser = usersData.users.find((u) => u.id === currentUserId)

  return {
    currentUserId,
    currentUser,
    usersData,
    status,
    hasPermission: (resource: 'habit' | 'wishlist' | 'coins', action: 'write' | 'interact') => currentUser?.isAdmin ||
      checkPermission(currentUser?.permissions, resource, action)
  }
}
