import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resetTestDb } from '@/lib/db/test-db'

// Mock @root/auth - this is what the route file imports
vi.mock('@root/auth', () => ({
  auth: vi.fn(() => Promise.resolve({
    user: { id: '1', name: 'test', email: 'test@example.com' }
  })),
  handlers: {},
  signIn: vi.fn(),
  signOut: vi.fn()
}))

describe('Guests API', () => {
  beforeEach(() => {
    resetTestDb()
  })

  it('creates a guest via POST and returns it in GET', async () => {
    // Import route handlers after mock is set up
    const { POST, GET } = await import('./route')

    // Create guest
    const createRequest = new Request('http://localhost:3000/api/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'John Doe', spouseName: 'Jane Doe' })
    })
    const createResponse = await POST(createRequest)
    expect(createResponse.status).toBe(201)
    const created = await createResponse.json()
    // Verify response shape (Risk #5: API schema drift)
    expect(created).toHaveProperty('id')
    expect(created).toHaveProperty('name')
    expect(created).toHaveProperty('spouseName')
    expect(created).toHaveProperty('childrenCount')
    expect(created).toHaveProperty('comingAlone')
    expect(created).toHaveProperty('createdAt')
    expect(created.name).toBe('John Doe')

    // Verify via GET
    const getRequest = new Request('http://localhost:3000/api/guests')
    const getResponse = await GET(getRequest)
    expect(getResponse.status).toBe(200)
    const guests = await getResponse.json()
    expect(Array.isArray(guests)).toBe(true)
    expect(guests.some((g: any) => g.name === 'John Doe')).toBe(true)
  })
})
