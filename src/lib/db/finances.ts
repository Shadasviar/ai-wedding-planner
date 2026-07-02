import { db } from '.'
import { services, guests, catering } from './schema'
import { eq, type SQLWrapper } from 'drizzle-orm'

// Internal functions that accept a db instance (for testing)
async function getTotalServicesCostInternal(db: SQLWrapper): Promise<number> {
  const allServices = db.select().from(services).all()
  return allServices.reduce((sum: number, s: typeof allServices[0]) => {
    return sum + (s.cost || 0)
  }, 0)
}

async function getTotalGuestCostInternal(db: SQLWrapper): Promise<number> {
  const settings = db.select().from(catering).where(eq(catering.id, 1)).get()
  const costPerPlate = settings?.costPerPlate ?? 0

  const allGuests = db.select().from(guests).all()
  const totalSeats = allGuests.reduce((sum: number, g: typeof allGuests[0]) => {
    return sum + 1 + (g.comingAlone ? 0 : 1) + (g.childrenCount || 0)
  }, 0)

  return costPerPlate * totalSeats
}

async function getTotalCateringCostInternal(db: SQLWrapper): Promise<number> {
  const settings = db.select().from(catering).where(eq(catering.id, 1)).get()
  const costPerPlate = settings?.costPerPlate ?? 0

  const allGuests = db.select().from(guests).all()
  const totalSeats = allGuests.reduce((sum: number, g: typeof allGuests[0]) => {
    return sum + 1 + (g.comingAlone ? 0 : 1) + (g.childrenCount || 0)
  }, 0)

  return costPerPlate * totalSeats
}

async function getFinancesBreakdownInternal(db: SQLWrapper): Promise<{
  services: number
  catering: number
  guests: number
  total: number
}> {
  const [servicesCost, cateringCost, guestsCost] = await Promise.all([
    getTotalServicesCostInternal(db),
    getTotalCateringCostInternal(db),
    getTotalGuestCostInternal(db),
  ])

  return {
    services: servicesCost,
    catering: cateringCost,
    guests: guestsCost,
    total: servicesCost + cateringCost + guestsCost,
  }
}

// Public API functions using default db instance
/**
 * Get total services cost (sum of all service costs)
 */
export async function getTotalServicesCost(): Promise<number> {
  return getTotalServicesCostInternal(db)
}

/**
 * Get total guest-related catering cost: totalSeats × costPerPlate
 * totalSeats = each guest (1) + partner slot if not comingAlone (1 or 0) + children
 *
 * This reuses the same logic as getTotalCateringCost() but returns only the guest portion.
 */
export async function getTotalGuestCost(): Promise<number> {
  return getTotalGuestCostInternal(db)
}

/**
 * Get total catering cost (same as existing getTotalCateringCost for consistency)
 * Exported here for unified API surface
 */
export async function getTotalCateringCost(): Promise<number> {
  return getTotalCateringCostInternal(db)
}

/**
 * Get complete finances breakdown with all cost sources
 */
export async function getFinancesBreakdown(): Promise<{
  services: number
  catering: number
  guests: number
  total: number
}> {
  return getFinancesBreakdownInternal(db)
}

// Export internal functions for testing
export {
  getTotalServicesCostInternal,
  getTotalGuestCostInternal,
  getTotalCateringCostInternal,
  getFinancesBreakdownInternal,
}
