import { drizzle } from 'drizzle-orm/neon-http'
import { migrate } from 'drizzle-orm/neon-http/migrator'
import { neon } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL_UNPOOLED
if (!url) throw new Error('DATABASE_URL_UNPOOLED is not set')

const db = drizzle(neon(url))

await migrate(db, { migrationsFolder: './drizzle/migrations' })
console.log('Migrations applied.')
process.exit(0)
