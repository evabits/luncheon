'use client'

// ponytail: client-side pagination over an already-loaded list. Fine for admin
// lists at this scale; switch to query-level limit/offset only if a table ever
// returns thousands of rows.
export const PAGE_SIZE = 25

export function Pagination({ page, total, onPage }: {
  page: number
  total: number
  onPage: (page: number) => void
}) {
  if (total === 0) return null
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const from = page * PAGE_SIZE + 1
  const to = Math.min(total, (page + 1) * PAGE_SIZE)
  const btn = 'px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed'
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400">
      <span>{from}–{to} of {total}</span>
      <div className="flex gap-2">
        <button onClick={() => onPage(page - 1)} disabled={page === 0} className={btn}>Previous</button>
        <button onClick={() => onPage(page + 1)} disabled={page >= pageCount - 1} className={btn}>Next</button>
      </div>
    </div>
  )
}
