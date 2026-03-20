import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { companies } from '@/drizzle/schema'
import { getCompanies } from '@/lib/queries/companies'

export async function GET() {
  const all = await getCompanies()
  return NextResponse.json(all)
}

export async function POST(req: NextRequest) {
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const [created] = await db
    .insert(companies)
    .values({ name: name.trim() })
    .returning()

  return NextResponse.json(created, { status: 201 })
}
