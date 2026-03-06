import { PublicUserData, UserData } from './types'

export function sanitizeUserData(data: UserData): PublicUserData {
  return {
    users: data.users.map(({ password, ...user }) => ({
      ...user,
      hasPassword: !!password,
    })),
  }
}
