import { db } from '.'
import { users } from './schema'

export function validateDatabase() {
  try {
    // Try to query the users table
    db.select().from(users).limit(1).all()
    console.log('[DB] Database validation passed')
  } catch (error) {
    console.error('[DB] Database validation failed:', error)
    console.error('[DB] Run `npm run db:migrate` to create missing tables')
    process.exit(1)
  }
}
