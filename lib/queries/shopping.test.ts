import { test, expect } from 'bun:test'
import { currentMonthRange, remainingRequests, summarizeFlags, safeHttpUrl } from './shopping'

test('currentMonthRange returns first-of-month to first-of-next-month (UTC)', () => {
  expect(currentMonthRange(new Date('2026-08-28T10:00:00Z'))).toEqual({
    start: '2026-08-01',
    end: '2026-09-01',
  })
})

test('currentMonthRange rolls the year over in December', () => {
  expect(currentMonthRange(new Date('2026-12-15T00:00:00Z'))).toEqual({
    start: '2026-12-01',
    end: '2027-01-01',
  })
})

test('remainingRequests never goes negative', () => {
  expect(remainingRequests(0, 1)).toBe(1)
  expect(remainingRequests(1, 1)).toBe(0)
  expect(remainingRequests(3, 1)).toBe(0)
  expect(remainingRequests(2, 5)).toBe(3)
})

test('summarizeFlags counts each level', () => {
  expect(summarizeFlags(['low', 'low', 'out', 'low'])).toEqual({ low: 3, out: 1 })
  expect(summarizeFlags([])).toEqual({ low: 0, out: 0 })
})

test('safeHttpUrl keeps http(s) urls and rejects other schemes', () => {
  expect(safeHttpUrl('https://jumbo.com/x')).toBe('https://jumbo.com/x')
  expect(safeHttpUrl('  http://jumbo.com  ')).toBe('http://jumbo.com')
  expect(safeHttpUrl('javascript:alert(1)')).toBe(null)
  expect(safeHttpUrl('data:text/html,x')).toBe(null)
  expect(safeHttpUrl('   ')).toBe(null)
  expect(safeHttpUrl(null)).toBe(null)
})
