import QRCode from 'qrcode'
import { put } from '@vercel/blob'

export function buildEpcPayload(iban: string, name: string, amount: number, remittance: string): string {
  return [
    'BCD',
    '002',
    '1',
    'SCT',
    '',
    name.slice(0, 70),
    iban,
    amount > 0 ? `EUR${amount.toFixed(2)}` : '',
    '',
    '',
    remittance.slice(0, 140),
  ].join('\n')
}

export async function uploadQrImage(payload: string, filename: string): Promise<string> {
  const buffer = await QRCode.toBuffer(payload, { width: 200, margin: 1 })
  const blob = await put(`qr/${filename}`, buffer, { access: 'public', contentType: 'image/png' })
  return blob.url
}
