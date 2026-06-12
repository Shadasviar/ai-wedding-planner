import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { eq } from 'drizzle-orm'
import { db } from '.'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Type exports for use in app code
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

// Helper function for auth lookup
export async function findUserByUsername(username: string) {
  return db.select().from(users).where(eq(users.username, username)).get()
}

// Seed data for initial setup (passwords are bcrypt hashes of "wedding2026")
export const SEED_USERS = [
  { username: "admin", password: "$2b$10$db4SJG3xrNTJ5TSSZN6OmupEeVcjB6iqW3pWON9QxZ1nYqZZi298K" },
  { username: "user", password: "$2b$10$2BGY4seHkFm/oFKYsYqR5eTAKq03OjTFo17ZmYxR/4bwMAUxTHEiK" },
]
