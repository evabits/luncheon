import QRCode from 'qrcode'

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

export async function generateQrDataUri(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, { width: 200, margin: 1 })
}
