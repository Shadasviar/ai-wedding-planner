import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { resetTestDb, getTestDb } from '@/lib/db/test-db'
import { services, catering, guests } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import {
  getFinancesBreakdownInternal,
  getTotalServicesCostInternal,
  getTotalGuestCostInternal,
  getTotalCateringCostInternal,
} from '@/lib/db/finances'

describe('Finances aggregation', () => {
  let db: ReturnType<typeof getTestDb>

  beforeAll(() => {
    resetTestDb()
  })

  beforeEach(() => {
    db = getTestDb()
    // Clear all tables before each test
    db.delete(services).run()
    db.delete(catering).run()
    db.delete(guests).run()
  })

  describe('getTotalServicesCostInternal', () => {
    it('returns 0 when no services exist', async () => {
      const cost = await getTotalServicesCostInternal(db)
      expect(cost).toBe(0)
    })

    it('sums all service costs', async () => {
      db.insert(services).values({ name: 'Photographer', cost: 1000, paidAmount: 500 }).run()
      db.insert(services).values({ name: 'Florist', cost: 500, paidAmount: 250 }).run()

      const cost = await getTotalServicesCostInternal(db)
      expect(cost).toBe(1500)
    })
  })

  describe('getTotalCateringCostInternal', () => {
    it('returns 0 when no catering settings exist', async () => {
      const cost = await getTotalCateringCostInternal(db)
      expect(cost).toBe(0)
    })

    it('calculates cost as costPerPlate × totalSeats', async () => {
      db.insert(catering).values({ id: 1, costPerPlate: 100 }).run()
      db.insert(guests).values({ name: 'John Doe', comingAlone: false, childrenCount: 0 }).run()
      db.insert(guests).values({ name: 'Jane Smith', comingAlone: true, childrenCount: 2 }).run()

      // Guest 1: 1 + 1 (partner) + 0 = 2 seats
      // Guest 2: 1 + 0 (comingAlone) + 2 = 3 seats
      // Total: 5 seats × 100 = 500
      const cost = await getTotalCateringCostInternal(db)
      expect(cost).toBe(500)
    })
  })

  describe('getTotalGuestCostInternal', () => {
    it('returns 0 when no catering settings exist', async () => {
      db.insert(guests).values({ name: 'John Doe', comingAlone: false, childrenCount: 0 }).run()

      const cost = await getTotalGuestCostInternal(db)
      expect(cost).toBe(0) // No costPerPlate set
    })

    it('calculates cost same as catering (seats × costPerPlate)', async () => {
      db.insert(catering).values({ id: 1, costPerPlate: 50 }).run()
      db.insert(guests).values({ name: 'Test Guest', comingAlone: false, childrenCount: 1 }).run()

      // 1 + 1 (partner) + 1 (child) = 3 seats × 50 = 150
      const cost = await getTotalGuestCostInternal(db)
      expect(cost).toBe(150)
    })
  })

  describe('getFinancesBreakdownInternal', () => {
    it('returns zeros for all categories when empty', async () => {
      const breakdown = await getFinancesBreakdownInternal(db)

      expect(breakdown.services).toBe(0)
      expect(breakdown.catering).toBe(0)
      expect(breakdown.guests).toBe(0)
      expect(breakdown.total).toBe(0)
    })

    it('aggregates costs from all three sources', async () => {
      // Services
      db.insert(services).values({ name: 'Photographer', cost: 1000, paidAmount: 500 }).run()

      // Catering
      db.insert(catering).values({ id: 1, costPerPlate: 100 }).run()

      // Guests (2 seats: 1 + partner)
      db.insert(guests).values({ name: 'John Doe', comingAlone: false, childrenCount: 0 }).run()

      const breakdown = await getFinancesBreakdownInternal(db)

      expect(breakdown.services).toBe(1000)
      expect(breakdown.catering).toBe(200) // 100 × 2 seats
      expect(breakdown.guests).toBe(200) // 100 × 2 seats
      expect(breakdown.total).toBe(1400)
    })

    it('updates when services change', async () => {
      db.insert(services).values({ name: 'DJ', cost: 500, paidAmount: 250 }).run()

      let breakdown = await getFinancesBreakdownInternal(db)
      expect(breakdown.services).toBe(500)

      db.insert(services).values({ name: 'Florist', cost: 300, paidAmount: 150 }).run()

      breakdown = await getFinancesBreakdownInternal(db)
      expect(breakdown.services).toBe(800)
      expect(breakdown.total).toBe(800)
    })

    it('updates when catering costPerPlate changes', async () => {
      db.insert(catering).values({ id: 1, costPerPlate: 50 }).run()
      db.insert(guests).values({ name: 'Guest', comingAlone: false, childrenCount: 0 }).run()

      let breakdown = await getFinancesBreakdownInternal(db)
      expect(breakdown.catering).toBe(100) // 50 × 2
      expect(breakdown.guests).toBe(100)

      db.update(catering).set({ costPerPlate: 100 }).where(eq(catering.id, 1)).run()

      breakdown = await getFinancesBreakdownInternal(db)
      expect(breakdown.catering).toBe(200) // 100 × 2
      expect(breakdown.guests).toBe(200)
    })
  })
})