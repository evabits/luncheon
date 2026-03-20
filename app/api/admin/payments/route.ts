import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { recordPayment } from '@/lib/queries/payments'

interface PaymentEntry {
  participantId: string
  year: number
  month: number
  amount: string
  note?: string
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()

  let entries: PaymentEntry[]
  if (Array.isArray(body.payments)) {
    entries = body.payments
  } else {
    entries = [{ participantId: body.participantId, year: body.year, month: body.month, amount: body.amount, note: body.note }]
  }

  for (const entry of entries) {
    if (!entry.participantId || typeof entry.year !== 'number' || typeof entry.month !== 'number') {
      return NextResponse.json({ error: 'Invalid entry' }, { status: 400 })
    }
    if (entry.month < 1 || entry.month > 12) {
      return NextResponse.json({ error: 'Invalid month' }, { status: 400 })
    }
    const amt = Number(entry.amount)
    if (isNaN(amt) || amt <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 })
    }
  }

  for (const entry of entries) {
    await recordPayment(entry.participantId, entry.year, entry.month, String(Number(entry.amount).toFixed(2)), entry.note)
  }

  return NextResponse.json({ ok: true, count: entries.length })
}
