import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createItem, updateItem, removeItem } from '@/lib/queries/shopping'

async function requireAdmin() {
  const session = await auth()
  return (session?.user as any)?.role === 'admin'
}

function parsePrice(v: unknown): string | null {
  if (v === '' || v === undefined || v === null) return null
  return String(v)
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const name = String(body.name ?? '').trim()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  const price = parsePrice(body.price)
  if (price !== null && isNaN(Number(price))) {
    return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
  }
  await createItem({ name, jumboUrl: body.jumboUrl ? String(body.jumboUrl).trim() : null, price })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const id = String(body.id ?? '')
  const name = String(body.name ?? '').trim()
  if (!id || !name) return NextResponse.json({ error: 'Missing id or name' }, { status: 400 })
  const price = parsePrice(body.price)
  if (price !== null && isNaN(Number(price))) {
    return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
  }
  await updateItem(id, { name, jumboUrl: body.jumboUrl ? String(body.jumboUrl).trim() : null, price })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await removeItem(id)
  return NextResponse.json({ success: true })
}
