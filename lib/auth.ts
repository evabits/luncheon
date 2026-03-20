import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { db } from './db'
import { users, oauthAccounts } from '@/drizzle/schema'
import { eq, and } from 'drizzle-orm'
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

        if (!user || !user.passwordHash) return null

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
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const email = user.email!
        const allowedDomains = (process.env.GOOGLE_ALLOWED_DOMAIN ?? 'evabits.com').split(',')
        const emailDomain = email.split('@')[1]
        if (!allowedDomains.includes(emailDomain)) {
          return '/login?error=wrong_domain'
        }

        // Check existing OAuth link
        const [existingOauth] = await db
          .select()
          .from(oauthAccounts)
          .where(and(
            eq(oauthAccounts.provider, 'google'),
            eq(oauthAccounts.providerAccountId, account.providerAccountId!),
          ))
          .limit(1)

        if (existingOauth) {
          const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, existingOauth.userId))
            .limit(1)
          if (existingUser) {
            user.id = existingUser.id
            ;(user as any).role = existingUser.role
            ;(user as any).participantId = existingUser.participantId
            ;(user as any).mustChangePassword = false
            return true
          }
        }

        // Check existing user by email
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1)

        if (existingUser) {
          await db.insert(oauthAccounts).values({
            userId: existingUser.id,
            provider: 'google',
            providerAccountId: account.providerAccountId!,
          })
          user.id = existingUser.id
          ;(user as any).role = existingUser.role
          ;(user as any).participantId = existingUser.participantId
          ;(user as any).mustChangePassword = false
          return true
        }

        // Auto-provision new user
        const [newUser] = await db.insert(users).values({
          email,
          passwordHash: null,
          role: 'user',
          mustChangePassword: false,
        }).returning()

        await db.insert(oauthAccounts).values({
          userId: newUser.id,
          provider: 'google',
          providerAccountId: account.providerAccountId!,
        })

        user.id = newUser.id
        ;(user as any).role = newUser.role
        ;(user as any).participantId = null
        ;(user as any).mustChangePassword = false
        return true
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = (user as any).role
        token.participantId = (user as any).participantId
        token.mustChangePassword = (user as any).mustChangePassword
      }
      // For Google sign-ins, mutations to `user` in signIn callback may not propagate.
      // Re-fetch from DB on first OAuth sign-in to ensure role/participantId are set.
      if (account?.provider === 'google') {
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, token.email!))
          .limit(1)
        if (dbUser) {
          token.role = dbUser.role
          token.participantId = dbUser.participantId
          token.mustChangePassword = false
        }
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
