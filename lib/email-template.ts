const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface BillTemplateOptions {
  name: string
  year: number
  month: number
  sessions: Array<{ date: string; cost: string }>
  totalCost: string
  totalPaid: string
  balance: string
  paymentInstructions: string | null
}

export function buildBillEmail(opts: BillTemplateOptions): string {
  const { name, year, month, sessions, totalCost, totalPaid, balance, paymentInstructions } = opts
  const monthName = MONTH_NAMES[month - 1]

  const rows = sessions
    .map(
      (s) => `
      <tr>
        <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;">${s.date}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">€${s.cost}</td>
      </tr>`
    )
    .join('')

  const paymentBlock = paymentInstructions
    ? `
    <div style="margin-top:24px;padding:16px;background:#f9f9f9;border-radius:8px;">
      <p style="margin:0 0 8px;font-weight:600;color:#374151;">Payment instructions</p>
      <p style="margin:0;white-space:pre-line;color:#4b5563;">${paymentInstructions}</p>
    </div>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:sans-serif;color:#111827;max-width:560px;margin:0 auto;padding:32px 16px;">
  <h1 style="font-size:22px;font-weight:700;margin-bottom:4px;">Lunch bill — ${monthName} ${year}</h1>
  <p style="color:#6b7280;margin-top:0;">Hi ${name}, here is your lunch summary for ${monthName} ${year}.</p>

  <table style="width:100%;border-collapse:collapse;margin-top:20px;">
    <thead>
      <tr style="background:#f3f4f6;">
        <th style="padding:8px 12px;text-align:left;font-size:13px;color:#6b7280;">Date</th>
        <th style="padding:8px 12px;text-align:right;font-size:13px;color:#6b7280;">Cost</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
    <tfoot>
      <tr>
        <td style="padding:10px 12px;font-weight:600;">${sessions.length} lunch${sessions.length !== 1 ? 'es' : ''}</td>
        <td style="padding:10px 12px;text-align:right;font-weight:600;">€${totalCost}</td>
      </tr>
    </tfoot>
  </table>

  <table style="width:100%;border-collapse:collapse;margin-top:16px;background:#f9fafb;border-radius:8px;overflow:hidden;">
    <tr>
      <td style="padding:8px 12px;color:#6b7280;">Total charged</td>
      <td style="padding:8px 12px;text-align:right;">€${totalCost}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;color:#6b7280;">Payments received</td>
      <td style="padding:8px 12px;text-align:right;">€${totalPaid}</td>
    </tr>
    <tr style="font-weight:700;font-size:16px;">
      <td style="padding:10px 12px;">Balance due</td>
      <td style="padding:10px 12px;text-align:right;">€${balance}</td>
    </tr>
  </table>

  ${paymentBlock}

  <p style="margin-top:32px;font-size:12px;color:#9ca3af;">This email was generated automatically by Luncheon.</p>
</body>
</html>`
}
