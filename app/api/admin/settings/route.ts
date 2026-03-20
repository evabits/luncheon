import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { config } from '@/drizzle/schema'
import { getConfig } from '@/lib/queries/config'

export async function GET() {
  const cfg = await getConfig()
  return NextResponse.json(cfg)
}

export async function PATCH(req: NextRequest) {
  const { costPerLunch } = await req.json()

  if (costPerLunch === undefined || isNaN(Number(costPerLunch))) {
    return NextResponse.json({ error: 'Invalid cost' }, { status: 400 })
  }

  const existing = await getConfig()

  if (existing) {
    const [updated] = await db
      .update(config)
      .set({ costPerLunch: String(costPerLunch), updatedAt: new Date() })
      .returning()
    return NextResponse.json(updated)
  }

  const [created] = await db
    .insert(config)
    .values({ costPerLunch: String(costPerLunch) })
    .returning()
  return NextResponse.json(created)
}
