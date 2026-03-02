import { UserData } from './types'

export function sanitizeUserData(data: UserData): UserData {
  return {
    users: data.users.map(({ password, ...user }) => ({
      ...user,
      hasPassword: !!password,
    })),
  }
}
