// client helpers
'use-client'

import { useAtom } from 'jotai'
import { useSession } from "next-auth/react"
import { usersAtom } from './atoms'
import { checkPermission } from './utils'

export function useHelpers() {
  const { data: session, status } = useSession()
  const currentUserId = session?.user.id
  const [usersData] = useAtom(usersAtom)
  const currentUser = usersData.users.find((u) => u.id === currentUserId)
  // detect iOS: https://stackoverflow.com/a/9039885
  function iOS() {
    return typeof navigator !== "undefined" && ([
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod',
    ].includes(navigator.platform)
    // iPad on iOS 13 detection
    || (navigator.userAgent.includes("Mac") && "ontouchend" in document))
  }  

  return {
    currentUserId,
    currentUser,
    usersData,
    status,
    hasPermission: (resource: 'habit' | 'wishlist' | 'coins', action: 'write' | 'interact') => currentUser?.isAdmin ||
      checkPermission(currentUser?.permissions, resource, action),
    isIOS: iOS(),
  }
}
