import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getConfig } from '@/lib/queries/config'
import {
  countMonthlyRequests,
  createRequest,
  getAdminEmails,
  remainingRequests,
} from '@/lib/queries/shopping'
import { sendEmail } from '@/lib/mailer'

// Requester-supplied text ends up in an admin's inbox, so escape it before it hits HTML.
function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  )
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const participantId = (session?.user as any)?.participantId
  if (!participantId) {
    return NextResponse.json({ error: 'No participant linked to account' }, { status: 400 })
  }

  const body = await req.json()
  const name = String(body.name ?? '').trim()
  const jumboUrl = body.jumboUrl ? String(body.jumboUrl).trim() : null
  const price =
    body.price === '' || body.price === undefined || body.price === null
      ? null
      : String(body.price)

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (price !== null && isNaN(Number(price))) {
    return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
  }

  const cfg = await getConfig()
  const limit = cfg?.shoppingRequestsPerMonth ?? 1
  const used = await countMonthlyRequests(participantId)
  if (remainingRequests(used, limit) <= 0) {
    return NextResponse.json({ error: 'Monthly request limit reached' }, { status: 429 })
  }

  await createRequest({ name, jumboUrl, price, requestedBy: participantId })

  // Email admins (best-effort — don't fail the request if mail is down)
  try {
    const admins = await getAdminEmails()
    // Only surface the link if it's a real http(s) URL — never emit a raw javascript:/data: href.
    const safeUrl = jumboUrl && /^https?:\/\//i.test(jumboUrl) ? escapeHtml(jumboUrl) : null
    const html = `<p>A new shopping list item was requested: <strong>${escapeHtml(name)}</strong></p>` +
      (price ? `<p>Price: €${escapeHtml(price)}</p>` : '') +
      (safeUrl ? `<p><a href="${safeUrl}">Jumbo link</a></p>` : '') +
      `<p>Review it in the admin shopping list.</p>`
    await Promise.all(
      admins.map((email) => sendEmail(email, 'New shopping list request', html))
    )
  } catch (e) {
    console.error('Failed to email admins about shopping request:', e)
  }

  return NextResponse.json({ success: true })
}
