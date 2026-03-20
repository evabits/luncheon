import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { db } from './db'
import { users } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1)

        if (!user) return null

        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          participantId: user.participantId,
          mustChangePassword: user.mustChangePassword,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.participantId = (user as any).participantId
        token.mustChangePassword = (user as any).mustChangePassword
      }
      return token
    },
    session({ session, token }) {
      ;(session.user as any).role = token.role
      ;(session.user as any).participantId = token.participantId
      ;(session.user as any).mustChangePassword = token.mustChangePassword
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})
