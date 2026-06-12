export async function createMolliePaymentLink(
  amount: number,
  description: string,
  webhookUrl?: string,
): Promise<{ url: string; id: string }> {
  const apiKey = process.env.MOLLIE_API_KEY
  if (!apiKey) throw new Error('MOLLIE_API_KEY is not set')

  const res = await fetch('https://api.mollie.com/v2/payment-links', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description,
      amount: { currency: 'EUR', value: amount.toFixed(2) },
      ...(webhookUrl ? { webhookUrl } : {}),
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error('Mollie API error', res.status, JSON.stringify(err))
    throw new Error(`Mollie error ${res.status}: ${err.detail ?? res.statusText}`)
  }

  const data = await res.json()
  return { url: data._links.paymentLink.href as string, id: data.id as string }
}

export async function fetchMolliePaymentLinkPayments(paymentLinkId: string) {
  const apiKey = process.env.MOLLIE_API_KEY
  if (!apiKey) throw new Error('MOLLIE_API_KEY is not set')

  const res = await fetch(`https://api.mollie.com/v2/payment-links/${paymentLinkId}/payments`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  if (!res.ok) return []
  const data = await res.json()
  return (data._embedded?.payments ?? []) as Array<{
    id: string
    status: string
    amount: { value: string; currency: string }
  }>
}

export async function fetchMolliePayment(paymentId: string) {
  const apiKey = process.env.MOLLIE_API_KEY
  if (!apiKey) throw new Error('MOLLIE_API_KEY is not set')

  const res = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  if (!res.ok) return null
  return res.json() as Promise<{
    status: string
    amount: { value: string; currency: string }
    _links: { paymentLink?: { href: string } }
  }>
}
