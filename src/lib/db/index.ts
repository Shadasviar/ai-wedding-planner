import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { mkdirSync } from 'fs'
import { dirname } from 'path'

const dbPath = process.env.DATABASE_PATH ?? '.data/sqlite.db'
mkdirSync(dirname(dbPath), { recursive: true })

const sqlite = new Database(dbPath)

// Test connection immediately - fail loudly if DB is corrupt
try {
  sqlite.pragma("journal_mode = WAL")
  sqlite.pragma("foreign_keys = ON")
} catch (error) {
  console.error(`[DB] Failed to initialize database at ${dbPath}`)
  throw error
}

import * as schema from './schema'

export const db = drizzle(sqlite, { schema })
