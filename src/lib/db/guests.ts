import { db } from '.'
import { guests, type Guest, type NewGuest } from './schema'
import { desc, eq } from 'drizzle-orm'

/**
 * Get all guests ordered by creation date (newest first)
 */
export async function getGuests(): Promise<Guest[]> {
  return db.select().from(guests).orderBy(desc(guests.createdAt)).all()
}

/**
 * Create a new guest
 */
export async function createGuest(data: NewGuest): Promise<Guest> {
  const result = db.insert(guests).values(data).returning().get()
  return result
}

/**
 * Update an existing guest by ID
 */
export async function updateGuest(id: number, data: Partial<NewGuest>): Promise<Guest> {
  const result = db
    .update(guests)
    .set(data)
    .where(eq(guests.id, id))
    .returning()
    .get()

  if (!result) {
    throw new Error(`Guest with id ${id} not found`)
  }

  return result
}

/**
 * Delete a guest by ID
 */
export async function deleteGuest(id: number): Promise<void> {
  const result = db
    .delete(guests)
    .where(eq(guests.id, id))
    .run()

  if (result.changes === 0) {
    throw new Error(`Guest with id ${id} not found`)
  }
}
