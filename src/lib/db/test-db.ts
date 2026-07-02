import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { mkdirSync, existsSync, rmSync, readdirSync } from 'fs'
import { dirname, resolve, basename } from 'path'
import * as schema from './schema'

const TEST_DB_DIR = process.env.DATABASE_PATH ?? '.data/test-db'

// Generate unique DB path per test file to avoid race conditions
function getUniqueTestDbName(): string {
  // Try to get the current test file name from stack trace
  const stack = new Error().stack
  const testFileMatch = stack?.match(/\/([^/]+)\.test\.ts/)
  const uniqueName = testFileMatch ? testFileMatch[1] : `test-${process.pid}`
  return `${TEST_DB_DIR}/${uniqueName}.db`
}

export function getTestDb() {
  const dbPath = getUniqueTestDbName()
  mkdirSync(dirname(dbPath), { recursive: true })
  const sqlite = new Database(dbPath)
  sqlite.pragma("journal_mode = DELETE")
  sqlite.pragma("foreign_keys = ON")
  const db = drizzle(sqlite, { schema })
  return db
}

export function resetTestDb() {
  const dbPath = getUniqueTestDbName()

  // Remove only this test's database file, not the whole directory
  if (existsSync(dbPath)) {
    rmSync(dbPath, { force: true })
  }
  mkdirSync(dirname(dbPath), { recursive: true })

  // Run migrations to create schema
  const sqlite = new Database(dbPath)
  sqlite.pragma("journal_mode = DELETE")
  sqlite.pragma("foreign_keys = ON")
  const db = drizzle(sqlite, { schema })
  migrate(db, { migrationsFolder: resolve('./drizzle/migrations') })
  sqlite.close()
}
