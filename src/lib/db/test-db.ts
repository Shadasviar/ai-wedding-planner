import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { mkdirSync, existsSync, rmSync } from 'fs'
import { dirname, resolve } from 'path'
import * as schema from './schema'

const TEST_DB_DIR = process.env.DATABASE_PATH ?? '.data/test-db'
const TEST_DB_PATH = `${TEST_DB_DIR}/test.db`

export function getTestDb() {
  mkdirSync(dirname(TEST_DB_PATH), { recursive: true })
  const sqlite = new Database(TEST_DB_PATH)
  sqlite.pragma("journal_mode = WAL")
  sqlite.pragma("foreign_keys = ON")
  return drizzle(sqlite, { schema })
}

export function resetTestDb() {
  // Remove entire test DB directory for clean state
  if (existsSync(TEST_DB_DIR)) {
    rmSync(TEST_DB_DIR, { recursive: true, force: true })
  }
  mkdirSync(TEST_DB_DIR, { recursive: true })

  // Run migrations to create schema
  const sqlite = new Database(TEST_DB_PATH)
  sqlite.pragma("journal_mode = WAL")
  sqlite.pragma("foreign_keys = ON")
  const db = drizzle(sqlite)
  migrate(db, { migrationsFolder: resolve('./drizzle/migrations') })
}
