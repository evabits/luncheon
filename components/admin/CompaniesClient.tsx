'use client'

import { useState } from 'react'

interface Company {
  id: string
  name: string
  createdAt: Date
}

export function CompaniesClient({ initialCompanies }: { initialCompanies: Company[] }) {
  const [companies, setCompanies] = useState(initialCompanies)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    setError('')
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to add company')
      }
      const created = await res.json()
      setCompanies((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      setNewName('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAdding(false)
    }
  }

  function startEdit(company: Company) {
    setEditingId(company.id)
    setEditName(company.name)
    setError('')
  }

  async function handleRename(id: string) {
    if (!editName.trim()) return
    setError('')
    try {
      const res = await fetch(`/api/admin/companies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to rename company')
      }
      const updated = await res.json()
      setCompanies((prev) =>
        prev.map((c) => (c.id === id ? updated : c)).sort((a, b) => a.name.localeCompare(b.name))
      )
      setEditingId(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete company "${name}"? This cannot be undone.`)) return
    setError('')
    try {
      const res = await fetch(`/api/admin/companies/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to delete company')
      }
      setCompanies((prev) => prev.filter((c) => c.id !== id))
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">Add Company</h3>
        <form onSubmit={handleAdd} className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Company name"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          />
          <button
            type="submit"
            disabled={adding || !newName.trim()}
            className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50"
          >
            {adding ? 'Adding...' : 'Add'}
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </div>

      {companies.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Name</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {companies.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    {editingId === c.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(c.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        autoFocus
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white bg-white dark:bg-gray-800 text-sm w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400"
                      />
                    ) : (
                      <span className="font-medium text-gray-900 dark:text-white">{c.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right flex justify-end gap-2">
                    {editingId === c.id ? (
                      <>
                        <button
                          onClick={() => handleRename(c.id)}
                          className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-sm px-2 py-1 rounded hover:bg-green-50 dark:hover:bg-green-900/30"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(c)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {companies.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">No companies yet. Add one above.</p>
      )}
    </div>
  )
}
