import { auth } from '@/auth'
import 'server-only'
import { User, UserId } from './types'
import { loadUsersData } from '@/app/actions/data'
import { randomBytes, scryptSync } from 'crypto'

export async function getCurrentUserId(): Promise<UserId | undefined> {
  const session = await auth()
  const user = session?.user
  return user?.id
}

export async function getCurrentUser(): Promise<User | undefined> {
  const currentUserId = await getCurrentUserId()
  if (!currentUserId) {
    return undefined
  }
  const usersData = await loadUsersData()
  return usersData.users.find((u) => u.id === currentUserId)
}
export function saltAndHashPassword(password: string, salt?: string): string {
  if (password.length === 0) throw new Error('Password must not be empty')
  salt = salt || randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password?: string, storedHash?: string): boolean {
  // if both password and storedHash is undefined, return true
  if (!password && !storedHash) return true
  // else if either password or storedHash is undefined, return false
  if (!password || !storedHash) return false

  // Split the stored hash into its salt and hash components
  const [salt, hash] = storedHash.split(':')
  // Hash the input password with the same salt
  const newHash = saltAndHashPassword(password, salt).split(':')[1]
  // Compare the new hash with the stored hash
  return newHash === hash
}
