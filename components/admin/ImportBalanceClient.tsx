'use client'

import { useRef, useState } from 'react'

type PreviewRow = {
  csvName: string
  newStartingBalance: string
  participantId: string | null
  participantName: string | null
  currentStartingBalance: string | null
  currentDebt: string | null
  projectedBalance: string | null
  error: string | null
}

type PreviewResult = {
  rows: PreviewRow[]
  validCount: number
  errorCount: number
}

type Status = 'idle' | 'previewing' | 'committing' | 'done'

function Euros({ value }: { value: string | null }) {
  if (value === null) return <span className="text-gray-400">—</span>
  const n = Number(value)
  return (
    <span className={`tabular-nums font-medium ${n > 0 ? 'text-red-600 dark:text-red-400' : n < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
      €{n.toFixed(2)}
    </span>
  )
}

export function ImportBalanceClient() {
  const [csvText, setCsvText] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [commitResult, setCommitResult] = useState<{ updated: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setCsvText((ev.target?.result as string) ?? '')
    reader.readAsText(file)
  }

  async function handlePreview() {
    if (!csvText.trim()) return
    setStatus('previewing')
    setError(null)
    setPreview(null)
    setCommitResult(null)

    try {
      const res = await fetch('/api/admin/participants/import-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'preview', csv: csvText }),
      })
      if (!res.ok) throw new Error('Preview failed')
      const data = await res.json()
      setPreview(data)
    } catch {
      setError('Failed to generate preview. Check your CSV and try again.')
    } finally {
      setStatus('idle')
    }
  }

  async function handleCommit() {
    if (!preview || preview.errorCount > 0) return
    setStatus('committing')
    setError(null)

    try {
      const res = await fetch('/api/admin/participants/import-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'commit', csv: csvText }),
      })
      if (!res.ok) throw new Error('Commit failed')
      const data = await res.json()
      setCommitResult({ updated: data.updated })
      setStatus('done')
      setPreview(null)
    } catch {
      setError('Failed to save balances. Please try again.')
      setStatus('idle')
    }
  }

  function reset() {
    setCsvText('')
    setPreview(null)
    setCommitResult(null)
    setError(null)
    setStatus('idle')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-6">
      {/* Format hint */}
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
        <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">Expected CSV format</p>
        <pre className="font-mono text-xs mt-1 text-gray-500 dark:text-gray-400">name,balance{'\n'}John Smith,45.50{'\n'}Jane_Doe.,120.00</pre>
        <p className="mt-2 text-xs">One row per participant. The header row is optional. Positive balance = owes money.</p>
      </div>

      {/* Input area */}
      {status !== 'done' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="block text-sm text-gray-600 dark:text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-300 dark:file:border-gray-600 file:text-sm file:font-medium file:bg-white dark:file:bg-gray-800 file:text-gray-700 dark:file:text-gray-300 hover:file:bg-gray-50 dark:hover:file:bg-gray-700"
            />
          </div>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={8}
            placeholder="Paste CSV here or upload a file above…"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 resize-y"
          />
          <button
            onClick={handlePreview}
            disabled={!csvText.trim() || status === 'previewing'}
            className="px-4 py-2 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'previewing' ? 'Loading preview…' : 'Preview'}
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Success state */}
      {status === 'done' && commitResult && (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-5 py-4">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              Updated starting balance for {commitResult.updated} participant{commitResult.updated !== 1 ? 's' : ''}.
            </p>
          </div>
          <button
            onClick={reset}
            className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Import another file
          </button>
        </div>
      )}

      {/* Preview table */}
      {preview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="text-green-700 dark:text-green-400 font-medium">{preview.validCount} valid</span>
              {preview.errorCount > 0 && (
                <span className="ml-2 text-red-600 dark:text-red-400 font-medium">{preview.errorCount} error{preview.errorCount !== 1 ? 's' : ''}</span>
              )}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPreview(null)}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Edit CSV
              </button>
              <button
                onClick={handleCommit}
                disabled={preview.errorCount > 0 || status === 'committing'}
                className="px-4 py-1.5 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'committing' ? 'Saving…' : 'Confirm & Save'}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Participant</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Current debt</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Starting balance (now)</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Starting balance (new)</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Projected total</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {preview.rows.map((row, i) => (
                  <tr key={i} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${row.error ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{row.participantName ?? <span className="font-mono text-xs text-gray-400">{row.csvName}</span>}</div>
                      {row.participantName && row.participantName.toLowerCase() !== row.csvName.toLowerCase() && (
                        <div className="text-xs font-mono text-gray-400 mt-0.5">{row.csvName}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Euros value={row.currentDebt} />
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400 tabular-nums">
                      {row.currentStartingBalance != null ? `€${Number(row.currentStartingBalance).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-900 dark:text-white">
                      {row.error ? '—' : `€${Number(row.newStartingBalance).toFixed(2)}`}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Euros value={row.projectedBalance} />
                    </td>
                    <td className="px-4 py-3">
                      {row.error ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                          {row.error}
                        </span>
                      ) : row.currentStartingBalance === row.newStartingBalance ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                          No change
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                          Will update
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
