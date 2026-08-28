import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'

const url = process.env.DATABASE_URL_UNPOOLED
if (!url) throw new Error('DATABASE_URL_UNPOOLED is not set')
const sql = neon(url)

const file = process.argv[2]
if (!file) throw new Error('Usage: bun scripts/apply-sql.ts <path-to-sql>')

const statements = readFileSync(file, 'utf8')
  .split('--> statement-breakpoint')
  .map((s) => s.trim())
  .filter(Boolean)

for (const stmt of statements) {
  await sql.query(stmt)
}
console.log(`Applied ${statements.length} statements from ${file}.`)
process.exit(0)
