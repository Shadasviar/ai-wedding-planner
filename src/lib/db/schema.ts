import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Type exports for use in app code
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

// Helper function for auth lookup (lazy import to avoid circular dependency)
export async function findUserByUsername(username: string) {
  const { db } = await import('.')
  const { eq } = await import('drizzle-orm')
  return db.select().from(users).where(eq(users.username, username)).get()
}

// Seed data for initial setup (passwords are bcrypt hashes of "wedding2026")
export const SEED_USERS = [
  { username: "admin", password: "$2b$10$db4SJG3xrNTJ5TSSZN6OmupEeVcjB6iqW3pWON9QxZ1nYqZZi298K" },
  { username: "user", password: "$2b$10$2BGY4seHkFm/oFKYsYqR5eTAKq03OjTFo17ZmYxR/4bwMAUxTHEiK" },
]

// Guests table for wedding guest management
export const guests = sqliteTable('guests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  spouseName: text('spouse_name'),
  childrenCount: integer('children_count').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  comingAlone: integer('coming_alone', { mode: 'boolean' }).notNull().default(false),
})

// Type exports for use in app code
export type Guest = typeof guests.$inferSelect
export type NewGuest = typeof guests.$inferInsert

// Services table for wedding vendor/service management
export const services = sqliteTable('services', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  cost: integer('cost').notNull().default(0),
  paidAmount: integer('paid_amount').notNull().default(0),
  notes: text('notes').notNull().default(''),
  deadline: text('deadline'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Type exports for use in app code
export type Service = typeof services.$inferSelect
export type NewService = typeof services.$inferInsert
