import { db } from '../db'
import {
  shoppingItems,
  shoppingItemFlags,
  shoppingRequests,
  shoppingRequestVotes,
  users,
} from '@/drizzle/schema'
import { and, eq, gte, lt, sql, inArray, desc } from 'drizzle-orm'

// ---- Pure helpers (unit-tested) ----

export function currentMonthRange(now: Date): { start: string; end: string } {
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth() // 0-11
  const start = `${y}-${String(m + 1).padStart(2, '0')}-01`
  const end =
    m === 11 ? `${y + 1}-01-01` : `${y}-${String(m + 2).padStart(2, '0')}-01`
  return { start, end }
}

export function remainingRequests(used: number, limit: number): number {
  return Math.max(0, limit - used)
}

export function summarizeFlags(levels: ('low' | 'out')[]): {
  low: number
  out: number
} {
  return {
    low: levels.filter((l) => l === 'low').length,
    out: levels.filter((l) => l === 'out').length,
  }
}
