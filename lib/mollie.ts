export async function createMolliePaymentLink(amount: number, description: string): Promise<string> {
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
      amount: {
        currency: 'EUR',
        value: amount.toFixed(2),
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Mollie error ${res.status}: ${err.detail ?? res.statusText}`)
  }

  const data = await res.json()
  return data._links.paymentLink.href as string
}
