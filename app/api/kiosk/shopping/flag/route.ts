import { NextRequest, NextResponse } from 'next/server'
import { itemExists, setKioskFlag } from '@/lib/queries/shopping'

// No auth code here: middleware.ts already requires a valid kiosk_token cookie for
// all /api/kiosk/* routes (except setup). The kiosk has no per-user identity, so the
// flag carries no participant — it's a single shared signal per item.
export async function POST(req: NextRequest) {
  const { itemId, level } = await req.json()
  if (!itemId) return NextResponse.json({ error: 'Missing itemId' }, { status: 400 })
  if (level !== null && level !== 'low' && level !== 'out') {
    return NextResponse.json({ error: 'Invalid level' }, { status: 400 })
  }
  if (!(await itemExists(itemId))) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }
  await setKioskFlag(itemId, level)
  return NextResponse.json({ success: true })
}
