import { db } from '.'
import { cateringMenuItems, type CateringMenuItem, type NewCateringMenuItem } from './schema'
import { desc, eq } from 'drizzle-orm'

/**
 * Get all menu items ordered by creation date (newest first)
 */
export async function getMenuItems(): Promise<CateringMenuItem[]> {
  return db.select().from(cateringMenuItems).orderBy(desc(cateringMenuItems.createdAt)).all()
}

/**
 * Create a new menu item with validation
 */
export async function createMenuItem(data: NewCateringMenuItem): Promise<CateringMenuItem> {
  // Validate name is not empty
  if (!data.name || !data.name.trim()) {
    throw new Error('Nazwa dania jest wymagana')
  }

  // Validate type is one of the allowed values
  const validTypes = ['przekąska', 'danie_ciepłe', 'przystawka', 'inne']
  if (!validTypes.includes(data.type)) {
    throw new Error('Nieprawidłowy typ dania')
  }

  // Validate customType is provided when type is "inne"
  if (data.type === 'inne' && (!data.customType || !data.customType.trim())) {
    throw new Error('Wpisz własny typ dania')
  }

  const result = db.insert(cateringMenuItems).values(data).returning().get()
  return result
}

/**
 * Update an existing menu item by ID with validation
 */
export async function updateMenuItem(id: number, data: Partial<NewCateringMenuItem>): Promise<CateringMenuItem> {
  // First, get the existing menu item
  const existing = db.select().from(cateringMenuItems).where(eq(cateringMenuItems.id, id)).get()
  if (!existing) {
    throw new Error(`Danie z id ${id} nie istnieje`)
  }

  // Validate name if provided
  if (data.name !== undefined && (!data.name || !data.name.trim())) {
    throw new Error('Nazwa dania jest wymagana')
  }

  // Validate type if provided
  if (data.type !== undefined) {
    const validTypes = ['przekąska', 'danie_ciepłe', 'przystawka', 'inne']
    if (!validTypes.includes(data.type)) {
      throw new Error('Nieprawidłowy typ dania')
    }

    // Validate customType when type is "inne"
    if (data.type === 'inne') {
      const newCustomType = data.customType !== undefined ? data.customType : existing.customType
      if (!newCustomType || !newCustomType.trim()) {
        throw new Error('Wpisz własny typ dania')
      }
    }
  }

  const result = db
    .update(cateringMenuItems)
    .set(data)
    .where(eq(cateringMenuItems.id, id))
    .returning()
    .get()

  if (!result) {
    throw new Error(`Danie z id ${id} nie istnieje`)
  }

  return result
}

/**
 * Delete a menu item by ID
 */
export async function deleteMenuItem(id: number): Promise<void> {
  const result = db
    .delete(cateringMenuItems)
    .where(eq(cateringMenuItems.id, id))
    .run()

  if (result.changes === 0) {
    throw new Error(`Danie z id ${id} nie istnieje`)
  }
}
