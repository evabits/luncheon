import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { restockItem } from '@/lib/queries/shopping'

export async function POST(req: NextRequest) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await restockItem(id)
  return NextResponse.json({ success: true })
}
