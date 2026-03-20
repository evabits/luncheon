import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { kioskTokens, kioskSetupCodes } from '@/drizzle/schema'
import { desc } from 'drizzle-orm'

export async function GET() {
  const tokens = await db
    .select({
      id: kioskTokens.id,
      label: kioskTokens.label,
      createdAt: kioskTokens.createdAt,
      lastUsed: kioskTokens.lastUsed,
    })
    .from(kioskTokens)
    .orderBy(desc(kioskTokens.createdAt))

  return NextResponse.json(tokens)
}

export async function POST(req: NextRequest) {
  const { label } = await req.json()

  // Generate a short readable setup code
  const code = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

  await db.insert(kioskSetupCodes).values({ code, label, expiresAt })

  return NextResponse.json({ setupCode: code, expiresAt })
}
