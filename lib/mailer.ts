const API_URL = 'https://send.api.mailtrap.io/api/send'

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const token = process.env.MAILER_API_TOKEN
  const fromEmail = process.env.MAILER_FROM_EMAIL
  const fromName = process.env.MAILER_FROM_NAME ?? 'Luncheon'

  if (!token) throw new Error('MAILER_API_TOKEN is not set')
  if (!fromEmail) throw new Error('MAILER_FROM_EMAIL is not set')

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      from: { email: fromEmail, name: fromName },
      to: [{ email: to }],
      subject,
      html,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Mailtrap API error ${res.status}: ${body}`)
  }
}
