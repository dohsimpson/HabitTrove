import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { getUser } from "./app/actions/data"
import { signInSchema } from "./lib/zod"
import { SafeUser } from "./lib/types"
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        username: {},
        password: {},
      },
      authorize: async (credentials) => {
        const { username, password } = await signInSchema.parseAsync(credentials)
        
        // Pass the plaintext password to getUser for verification
        const user = await getUser(username, password)
 
        if (!user) {
          throw new Error("Invalid credentials.")
        }
 
        const safeUser: SafeUser = { username: user.username, id: user.id, avatarPath: user.avatarPath, isAdmin: user.isAdmin }
        return safeUser
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = (user as SafeUser).id
        token.username = (user as SafeUser).username
        token.avatarPath = (user as SafeUser).avatarPath
        token.isAdmin = (user as SafeUser).isAdmin
      }
      return token
    },
    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.avatarPath = token.avatarPath as string
        session.user.isAdmin = token.isAdmin as boolean
      }
      return session
    }
  }
})