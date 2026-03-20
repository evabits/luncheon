import { db } from './db'
import { kioskTokens } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'

export async function hashToken(raw: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(raw)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function validateKioskToken(raw: string): Promise<string | null> {
  const hash = await hashToken(raw)
  const [token] = await db
    .select({ id: kioskTokens.id })
    .from(kioskTokens)
    .where(eq(kioskTokens.tokenHash, hash))
    .limit(1)

  if (!token) return null

  // Update last_used in background (don't await to keep middleware fast)
  db.update(kioskTokens)
    .set({ lastUsed: new Date() })
    .where(eq(kioskTokens.id, token.id))
    .execute()
    .catch(() => {})

  return token.id
}

export function generateSecureToken(): string {
  const bytes = new Uint8Array(48)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
