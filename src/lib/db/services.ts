import { db } from '.'
import { services, type Service, type NewService } from './schema'
import { desc, eq } from 'drizzle-orm'

/**
 * Get all services ordered by creation date (newest first)
 */
export async function getServices(): Promise<Service[]> {
  return db.select().from(services).orderBy(desc(services.createdAt)).all()
}

/**
 * Create a new service with validation
 */
export async function createService(data: NewService): Promise<Service> {
  // Validate cost >= 0
  if ((data.cost ?? 0) < 0) {
    throw new Error('Koszt nie może być ujemny')
  }

  // Validate paidAmount >= 0
  if ((data.paidAmount ?? 0) < 0) {
    throw new Error('Opłacona kwota nie może być ujemna')
  }

  // Validate paidAmount <= cost
  const cost = data.cost ?? 0
  const paidAmount = data.paidAmount ?? 0
  if (paidAmount > cost) {
    throw new Error('Opłacona kwota nie może przekraczać całkowitej kwoty')
  }

  const result = db.insert(services).values(data).returning().get()
  return result
}

/**
 * Update an existing service by ID with validation
 */
export async function updateService(id: number, data: Partial<NewService>): Promise<Service> {
  // First, get the existing service to validate against
  const existing = db.select().from(services).where(eq(services.id, id)).get()
  if (!existing) {
    throw new Error(`Service with id ${id} not found`)
  }

  // Validate cost if provided
  const newCost = data.cost !== undefined ? data.cost : existing.cost
  const newPaidAmount = data.paidAmount !== undefined ? data.paidAmount : existing.paidAmount

  if (newCost < 0) {
    throw new Error('Koszt nie może być ujemny')
  }

  if (newPaidAmount < 0) {
    throw new Error('Opłacona kwota nie może być ujemna')
  }

  if (newPaidAmount > newCost) {
    throw new Error('Opłacona kwota nie może przekraczać całkowitej kwoty')
  }

  const result = db
    .update(services)
    .set(data)
    .where(eq(services.id, id))
    .returning()
    .get()

  if (!result) {
    throw new Error(`Service with id ${id} not found`)
  }

  return result
}

/**
 * Delete a service by ID
 */
export async function deleteService(id: number): Promise<void> {
  const result = db
    .delete(services)
    .where(eq(services.id, id))
    .run()

  if (result.changes === 0) {
    throw new Error(`Service with id ${id} not found`)
  }
}
