import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { getUser } from "./app/actions/data"
import { signInSchema } from "./lib/zod"
import { SafeUser, SessionUser } from "./lib/types"
 
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
 
        const safeUser: SessionUser = { id: user.id }
        return safeUser
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = (user as SessionUser).id
      }
      return token
    },
    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.id = token.id as string
      }
      return session
    }
  }
})