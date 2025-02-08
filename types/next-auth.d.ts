import 'next-auth'
import { SafeUser } from '@/lib/types'

declare module 'next-auth' {
  interface Session {
    user: SafeUser
  }
}