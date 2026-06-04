import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAllActiveParticipantsForImport, setStartingBalances } from '@/lib/queries/payments'

function normalizeName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\.+$/, '').trim().toLowerCase()
}

function parseCSV(csv: string) {
  const lines = csv.split('\n').map((l) => l.trim()).filter(Boolean)
  const rows: Array<{ csvName: string; rawBalance: string }> = []

  for (const line of lines) {
    const commaIdx = line.indexOf(',')
    if (commaIdx === -1) continue
    const csvName = line.slice(0, commaIdx).trim()
    const rawBalance = line.slice(commaIdx + 1).trim()
    // Skip header row
    if (csvName.toLowerCase() === 'name' && rawBalance.toLowerCase() === 'balance') continue
    if (!csvName) continue
    rows.push({ csvName, rawBalance })
  }

  return rows
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { action, csv } = body as { action: 'preview' | 'commit'; csv: string }

  if (!csv || typeof csv !== 'string') {
    return NextResponse.json({ error: 'Missing csv' }, { status: 400 })
  }

  const allParticipants = await getAllActiveParticipantsForImport()

  // Build normalized-name lookup map; detect collisions
  const nameMap = new Map<string, {
    id: string
    name: string
    startingBalance: string
    currentDebt: string   // cumulative balance currently (includes existing starting_balance)
  } | 'collision'>()

  for (const p of allParticipants) {
    const key = normalizeName(p.name)
    if (nameMap.has(key)) {
      nameMap.set(key, 'collision')
    } else {
      nameMap.set(key, {
        id: p.id,
        name: p.name,
        startingBalance: p.starting_balance ?? '0',
        currentDebt: p.cumulative_balance ?? '0',
      })
    }
  }

  const parsed = parseCSV(csv)

  type PreviewRow = {
    csvName: string
    newStartingBalance: string
    participantId: string | null
    participantName: string | null
    currentStartingBalance: string | null
    currentDebt: string | null          // total owed right now
    projectedBalance: string | null     // total owed after applying the new starting balance
    error: string | null
  }

  const previewRows: PreviewRow[] = parsed.map(({ csvName, rawBalance }) => {
    const balanceNum = parseFloat(rawBalance.replace(',', '.'))
    if (isNaN(balanceNum) || !isFinite(balanceNum)) {
      return {
        csvName,
        newStartingBalance: rawBalance,
        participantId: null,
        participantName: null,
        currentStartingBalance: null,
        currentDebt: null,
        projectedBalance: null,
        error: 'Invalid number',
      }
    }

    const key = normalizeName(csvName)
    const match = nameMap.get(key)

    if (!match) {
      return {
        csvName,
        newStartingBalance: balanceNum.toFixed(2),
        participantId: null,
        participantName: null,
        currentStartingBalance: null,
        currentDebt: null,
        projectedBalance: null,
        error: 'Unknown participant',
      }
    }
    if (match === 'collision') {
      return {
        csvName,
        newStartingBalance: balanceNum.toFixed(2),
        participantId: null,
        participantName: null,
        currentStartingBalance: null,
        currentDebt: null,
        projectedBalance: null,
        error: 'Ambiguous name (multiple participants match)',
      }
    }

    const currentDebt = Number(match.currentDebt)
    const currentStarting = Number(match.startingBalance)
    const delta = balanceNum - currentStarting
    const projected = currentDebt + delta

    return {
      csvName,
      newStartingBalance: balanceNum.toFixed(2),
      participantId: match.id,
      participantName: match.name,
      currentStartingBalance: currentStarting.toFixed(2),
      currentDebt: currentDebt.toFixed(2),
      projectedBalance: projected.toFixed(2),
      error: null,
    }
  })

  const validRows = previewRows.filter((r) => r.error === null)
  const errorCount = previewRows.length - validRows.length

  if (action === 'preview') {
    return NextResponse.json({ rows: previewRows, validCount: validRows.length, errorCount })
  }

  if (action === 'commit') {
    if (errorCount > 0) {
      return NextResponse.json({ error: 'Cannot commit with errors present' }, { status: 400 })
    }

    const entries = validRows.map((r) => ({
      id: r.participantId!,
      oldAmount: r.currentStartingBalance!,
      newAmount: r.newStartingBalance,
    }))

    await setStartingBalances(entries)
    const updated = entries.filter((e) => e.oldAmount !== e.newAmount).length

    return NextResponse.json({ ok: true, updated })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
