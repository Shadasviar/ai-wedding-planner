import { db } from '.'
import { catering, type Catering } from './schema'
import { eq } from 'drizzle-orm'
import { guests } from './schema'

/**
 * Get catering settings (single row with id=1)
 */
export async function getCateringSettings(): Promise<Catering | undefined> {
  return db.select().from(catering).where(eq(catering.id, 1)).get()
}

/**
 * Update or create catering settings (single-row pattern)
 */
export async function updateCateringSettings(data: { costPerPlate: number }): Promise<Catering> {
  // Validate cost >= 0
  if (typeof data.costPerPlate !== 'number' || isNaN(data.costPerPlate) || data.costPerPlate < 0) {
    throw new Error('Koszt za talerz nie może być ujemny')
  }

  // Check if row exists
  const existing = await getCateringSettings()

  if (existing) {
    // Update existing row
    const result = db
      .update(catering)
      .set(data)
      .where(eq(catering.id, 1))
      .returning()
      .get()
    return result
  } else {
    // Insert new row with id=1
    const result = db
      .insert(catering)
      .values({ id: 1, ...data })
      .returning()
      .get()
    return result
  }
}

/**
 * Get total catering cost: costPerPlate × totalSeats
 * totalSeats = each guest (1) + partner slot if not comingAlone (1 or 0) + children
 */
export async function getTotalCateringCost(): Promise<number> {
  const settings = await getCateringSettings()
  const costPerPlate = settings?.costPerPlate ?? 0

  const allGuests = db.select().from(guests).all()
  const totalSeats = allGuests.reduce((sum: number, g: typeof allGuests[0]) => {
    return sum + 1 + (g.comingAlone ? 0 : 1) + (g.childrenCount || 0)
  }, 0)

  return costPerPlate * totalSeats
}
