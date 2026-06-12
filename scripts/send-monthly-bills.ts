/**
 * Send monthly lunch billing emails to all participants with an email address.
 *
 * Defaults to the previous calendar month. Override with:
 *   bun scripts/send-monthly-bills.ts --year 2026 --month 2
 */

import { getMonthlyBillingWithEmails } from '../lib/queries/payments'
import { getConfig } from '../lib/queries/config'
import { sendEmail } from '../lib/mailer'
import { buildBillEmail } from '../lib/email-template'
import { createMolliePaymentLink } from '../lib/mollie'
import { insertPaymentLink } from '../lib/queries/payment-links'

function parseArgs(): { year: number; month: number } {
  const args = process.argv.slice(2)
  let year: number | undefined
  let month: number | undefined

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--year' && args[i + 1]) year = parseInt(args[++i], 10)
    if (args[i] === '--month' && args[i + 1]) month = parseInt(args[++i], 10)
  }

  if (year === undefined || month === undefined) {
    const now = new Date()
    // Default to previous calendar month
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    year = d.getFullYear()
    month = d.getMonth() + 1
  }

  return { year, month }
}

async function main() {
  const { year, month } = parseArgs()
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  console.log(`Sending bills for ${monthNames[month - 1]} ${year}...\n`)

  const [rows, cfg] = await Promise.all([
    getMonthlyBillingWithEmails(year, month),
    getConfig(),
  ])

  const paymentInstructions = cfg?.paymentInstructions ?? null

  let sent = 0
  let skipped = 0
  let failed = 0

  for (const row of rows) {
    if (!row.email) {
      console.log(`✗ skipped (no email): ${row.name}`)
      skipped++
      continue
    }

    if (Number(row.cumulative_balance) <= 0) {
      console.log(`✗ skipped (no balance): ${row.name}`)
      skipped++
      continue
    }

    try {
      const totalDue = Number(row.cumulative_balance)
      let paymentUrl: string | null = null
      if (process.env.MOLLIE_API_KEY && totalDue > 0) {
        try {
          const description = `Lunch ${monthNames[month - 1]} ${year} - ${row.name}`
          const appUrl = process.env.APP_URL
          const webhookUrl = appUrl ? `${appUrl}/api/webhooks/mollie` : undefined
          const { url, id } = await createMolliePaymentLink(totalDue, description, webhookUrl)
          paymentUrl = url
          await insertPaymentLink(id, row.id, year, month, row.cumulative_balance)
        } catch (mollieErr) {
          console.error(`[send-monthly-bills] Mollie payment link failed for ${row.name}:`, mollieErr instanceof Error ? mollieErr.message : String(mollieErr))
        }
      }

      const html = buildBillEmail({
        name: row.name,
        year,
        month,
        sessions: row.sessions,
        totalCost: row.total_cost,
        totalPaid: row.total_paid,
        previousBalance: row.previous_balance,
        totalDue: row.cumulative_balance,
        paymentInstructions,
        paymentUrl,
      })

      await sendEmail(
        row.email,
        `Lunch bill — ${monthNames[month - 1]} ${year}`,
        html,
      )

      console.log(`✓ sent to ${row.email} (${row.name})`)
      sent++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`✗ failed: ${row.name} <${row.email}>: ${message}`)
      failed++
    }
  }

  console.log(`\nDone. sent=${sent} skipped=${skipped} failed=${failed}`)

  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
