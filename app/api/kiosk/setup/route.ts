import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { kioskSetupCodes, kioskTokens } from '@/drizzle/schema'
import { eq, and, gt, isNull } from 'drizzle-orm'
import { generateSecureToken, hashToken } from '@/lib/kiosk-auth'

export async function POST(req: NextRequest) {
  const { code, label } = await req.json()
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

  const [setupCode] = await db
    .select()
    .from(kioskSetupCodes)
    .where(
      and(
        eq(kioskSetupCodes.code, code),
        gt(kioskSetupCodes.expiresAt, new Date()),
        isNull(kioskSetupCodes.usedAt)
      )
    )
    .limit(1)

  if (!setupCode) {
    return NextResponse.json({ error: 'Invalid or expired setup code' }, { status: 400 })
  }

  // Mark code as used
  await db
    .update(kioskSetupCodes)
    .set({ usedAt: new Date() })
    .where(eq(kioskSetupCodes.id, setupCode.id))

  // Generate device token
  const rawToken = generateSecureToken()
  const tokenHash = await hashToken(rawToken)

  await db.insert(kioskTokens).values({
    tokenHash,
    label: label || setupCode.label || 'Kiosk Device',
  })

  const res = NextResponse.json({ success: true })
  res.cookies.set('kiosk_token', rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  })

  return res
}
