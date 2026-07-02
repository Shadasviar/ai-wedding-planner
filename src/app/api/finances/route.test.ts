/**
 * Finances API Integration Tests
 *
 * These tests verify the API endpoint shape and auth protection.
 * For aggregation logic tests, see: src/lib/db/finances.test.ts
 */
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import { resetTestDb } from '@/lib/db/test-db'

// Mock auth module BEFORE importing the route
vi.mock('@root/auth', () => ({
  auth: vi.fn(() => Promise.resolve({
    user: { id: '1', name: 'test', email: 'test@example.com' }
  })),
  handlers: {},
  signIn: vi.fn(),
  signOut: vi.fn()
}))

describe('Finances API', () => {
  beforeEach(() => {
    resetTestDb()
  })

  afterAll(() => {
    vi.clearAllMocks()
  })

  it('returns 200 and breakdown shape when authenticated', async () => {
    const { GET } = await import('./route')

    const getRequest = new Request('http://localhost:3000/api/finances')
    const getResponse = await GET(getRequest)

    // Should be 200 because auth is mocked to return a valid user
    expect(getResponse.status).toBe(200)

    const breakdown = await getResponse.json()

    // Verify response shape (Risk #5: API schema drift)
    expect(breakdown).toHaveProperty('services')
    expect(breakdown).toHaveProperty('catering')
    expect(breakdown).toHaveProperty('guests')
    expect(breakdown).toHaveProperty('total')

    // All values should be numbers
    expect(typeof breakdown.services).toBe('number')
    expect(typeof breakdown.catering).toBe('number')
    expect(typeof breakdown.guests).toBe('number')
    expect(typeof breakdown.total).toBe('number')
  })
})