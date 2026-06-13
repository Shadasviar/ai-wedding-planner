import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { mkdirSync, existsSync, rmSync } from 'fs'
import { dirname } from 'path'
import * as schema from './schema'

const TEST_DB_PATH = process.env.DATABASE_PATH ?? '.data/test.db'

export function getTestDb() {
  mkdirSync(dirname(TEST_DB_PATH), { recursive: true })
  const sqlite = new Database(TEST_DB_PATH)
  sqlite.pragma("journal_mode = WAL")
  sqlite.pragma("foreign_keys = ON")
  return drizzle(sqlite, { schema })
}

export function resetTestDb() {
  if (existsSync(TEST_DB_PATH)) {
    rmSync(TEST_DB_PATH, { force: true })
    // Also remove WAL files if they exist
    rmSync(`${TEST_DB_PATH}-wal`, { force: true })
    rmSync(`${TEST_DB_PATH}-shm`, { force: true })
  }
  mkdirSync(dirname(TEST_DB_PATH), { recursive: true })
  // Re-run migrations or create schema here
  // For Phase 1, just ensure the file exists fresh
}
