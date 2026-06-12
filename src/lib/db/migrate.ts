import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { mkdirSync } from 'fs'
import { resolve, dirname } from 'path'

const dbPath = process.env.DATABASE_PATH ?? '.data/sqlite.db'
mkdirSync(dirname(dbPath), { recursive: true })

const sqlite = new Database(dbPath)
const db = drizzle(sqlite)

export function runMigrations() {
  migrate(db, { migrationsFolder: resolve('./drizzle/migrations') })
  console.log('[DB] Migrations completed successfully')
}
