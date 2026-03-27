import { NextRequest, NextResponse } from 'next/server'
import { getMonthlyBillingWithEmails } from '@/lib/queries/payments'
import { getConfig } from '@/lib/queries/config'
import { sendEmail } from '@/lib/mailer'
import { buildBillEmail } from '@/lib/email-template'

export const dynamic = 'force-dynamic'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret (set CRON_SECRET in env, Vercel injects it automatically)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Default to previous calendar month
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const year = d.getFullYear()
  const month = d.getMonth() + 1

  const [rows, cfg] = await Promise.all([
    getMonthlyBillingWithEmails(year, month),
    getConfig(),
  ])

  const paymentInstructions = cfg?.paymentInstructions ?? null
  const monthName = MONTH_NAMES[month - 1]
  const subject = `Lunch bill — ${monthName} ${year}`

  const results: Array<{ name: string; status: 'sent' | 'skipped' | 'failed'; reason?: string }> = []

  for (const row of rows) {
    if (!row.email) {
      results.push({ name: row.name, status: 'skipped', reason: 'no email' })
      continue
    }
    if (row.lunch_count === 0) {
      results.push({ name: row.name, status: 'skipped', reason: '0 lunches' })
      continue
    }

    try {
      const html = buildBillEmail({
        name: row.name,
        year,
        month,
        sessions: row.sessions,
        totalCost: row.total_cost,
        totalPaid: row.total_paid,
        balance: row.balance,
        paymentInstructions,
      })
      await sendEmail(row.email, subject, html)
      results.push({ name: row.name, status: 'sent' })
    } catch (err) {
      results.push({ name: row.name, status: 'failed', reason: err instanceof Error ? err.message : String(err) })
    }
  }

  const failed = results.filter((r) => r.status === 'failed').length
  const sent = results.filter((r) => r.status === 'sent').length
  const skipped = results.filter((r) => r.status === 'skipped').length

  return NextResponse.json(
    { year, month, sent, skipped, failed, results },
    { status: failed > 0 ? 500 : 200 }
  )
}
