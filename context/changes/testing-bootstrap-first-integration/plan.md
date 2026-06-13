# Bootstrap Test Runner and First Integration Test — Implementation Plan

## Overview

Bootstrap vitest for the Wedding Planner project and write one green integration test proving the guest data flow works end-to-end (POST → DB → GET).

## Current State Analysis

**What exists:**
- Next.js 16 App Router + React 19 + TypeScript + Tailwind 4
- Drizzle ORM + better-sqlite3 (database at `.data/sqlite.db`)
- next-auth v5 (credentials provider, JWT sessions)
- Guest API: `src/app/api/guests/route.ts` (GET, POST with auth check)
- Guest helpers: `src/lib/db/guests.ts` (getGuests, createGuest, etc.)
- Schema: `src/lib/db/schema.ts` (guests table defined)

**What's missing:**
- No test runner installed
- No test configuration
- No test files
- No test database strategy

## Desired End State

After this plan is complete:
- `vitest` and `@vitest/ui` are installed as dev dependencies
- `vitest.config.ts` exists at project root with `@` path alias
- `npm test` script runs vitest
- One integration test at `src/app/api/guests/route.test.ts` proves: POST creates guest → GET returns it
- Test uses fresh `.data/test.db` file, mocks auth via `vi.mock()`
- Test-plan.md §6 cookbook documents the landed pattern

### Key Discoveries:

- Guest API requires auth via `auth()` from `auth.ts` — tests must mock this
- API returns Polish error messages — tests should assert on structure, not text
- Database path is configurable via `DATABASE_PATH` env var — use for test DB
- better-sqlite3 is synchronous — no async connection handling needed

## What We're NOT Doing

- CI/CD wiring (Phase 4 of test-plan.md)
- Error case / validation testing (future iteration)
- Unit tests for DB helpers (future phase)
- Visual/UI testing (explicitly out of scope per test-plan §5)
- Browser automation or e2e tests (overkill for Risk 1)

## Implementation Approach

Three phases, each independently verifiable:
1. **Vitest setup** — install, configure, verify it runs
2. **Test utilities** — test DB helper, auth mock helper
3. **First integration test** — prove the flow, document the pattern

## Critical Implementation Details

- **Auth mock shape**: next-auth v5 JWT sessions return `{ user: { id: string, name: string, email?: string } }` — the mock must match this or the API will fail silently
- **Test DB isolation**: Use `DATABASE_PATH=.data/test.db` env var — never write to the production `.data/sqlite.db` during tests
- **Vitest path alias**: Next.js uses `@/` for `src/` — vitest needs explicit alias in config

---

## Phase 1: Add Vitest Dependencies and Configuration

### Overview

Install vitest, create configuration file, and add npm test script.

### Changes Required:

#### 1. package.json — Add vitest dev dependencies

**File**: `package.json`

**Intent**: Add vitest and @vitest/ui as dev dependencies so tests can run.

**Contract**: Add two entries to `devDependencies`:
- `"vitest": "^3.0.0"` (or current latest)
- `"@vitest/ui": "^3.0.0"`

Also add a test script if not present: `"test": "vitest"`

#### 2. vitest.config.ts — Create test configuration

**File**: `vitest.config.ts`

**Intent**: Configure vitest with path aliases matching Next.js conventions.

**Contract**: Create new file with:
- Path alias `@` → `./src`
- Test timeout configuration (2-5 seconds for integration tests)

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 5000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Success Criteria:

#### Automated Verification:

- `npm install` completes without errors
- `npm test -- --run` executes (may find no tests yet, but shouldn't crash)
- `vitest.config.ts` exists at project root

#### Manual Verification:

- `npm test -- --ui` opens the vitest UI in browser (optional, nice-to-have)

---

## Phase 2: Create Test Database Utilities

### Overview

Create test database helper that uses a separate `.data/test.db` file and can reset the schema between test runs.

### Changes Required:

#### 1. src/lib/db/test-db.ts — Create test database helper

**File**: `src/lib/db/test-db.ts`

**Intent**: Provide a test-safe database connection that uses `.data/test.db` and can reset state.

**Contract**: Create new file with:
- `getTestDb()` — returns drizzle instance connected to test DB
- `resetTestDb()` — deletes test DB file and recreates schema (call before test suite)
- Use `DATABASE_PATH` env var override

```typescript
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { mkdirSync, existsSync, rmSync } from 'fs'
import { dirname } from 'path'
import * as schema from './schema'

const TEST_DB_PATH = process.env.DATABASE_PATH ?? '.data/test.db'

export function getTestDb() {
  mkdirSync(dirname(TEST_DB_PATH), { recursive: true })
  const sqlite = new Database(TEST_DB_PATH)
  sqlite.pragma("journal_mode = WAL")
  sqlite.pragma("foreign_keys = ON")
  return drizzle(sqlite, { schema })
}

export function resetTestDb() {
  if (existsSync(TEST_DB_PATH)) {
    rmSync(TEST_DB_PATH, { force: true })
    // Also remove WAL files if they exist
    rmSync(`${TEST_DB_PATH}-wal`, { force: true })
    rmSync(`${TEST_DB_PATH}-shm`, { force: true })
  }
  mkdirSync(dirname(TEST_DB_PATH), { recursive: true })
  // Re-run migrations or create schema here
  // For Phase 1, just ensure the file exists fresh
}
```

#### 2. src/lib/db/schema.ts — Ensure schema can be created programmatically

**File**: `src/lib/db/schema.ts`

**Intent**: Export schema creation SQL or helper so tests can initialize fresh DB.

**Contract**: No change needed if drizzle-kit handles migrations. Tests will use the migration system or call drizzle's `create` helper.

### Success Criteria:

#### Automated Verification:

- `src/lib/db/test-db.ts` exists
- Test DB file `.data/test.db` can be created
- `resetTestDb()` runs without errors

#### Manual Verification:

- Calling `resetTestDb()` creates empty `.data/test.db`
- Calling `getTestDb()` returns working drizzle instance

---

## Phase 3: Write First Integration Test

### Overview

Write the integration test that proves guest data flow: POST creates guest → GET returns it.

### Changes Required:

#### 1. src/app/api/guests/route.test.ts — Integration test for guest API

**File**: `src/app/api/guests/route.test.ts`

**Intent**: Prove the full data flow works: authenticated POST creates guest, authenticated GET returns it.

**Contract**: Create new test file with:
- Mock for `auth()` returning fake session
- Test: POST valid guest → 201 with guest data
- Test: GET guests → 200 with guest in list
- Use test DB, reset before each test

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resetTestDb, getTestDb } from '@/lib/db/test-db'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Mock next-auth auth function
vi.mock('@/auth', () => ({
  auth: vi.fn(() => Promise.resolve({
    user: { id: '1', name: 'test', email: 'test@example.com' }
  }))
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
```

**Note**: The exact test shape may need adjustment based on how Next.js App Router route handlers work with vitest. The research doc confirms the API structure — the test mocks `auth()` and verifies the flow.

### Success Criteria:

#### Automated Verification:

- `npm test -- --run` executes and the guest API test passes
- Test file exists at `src/app/api/guests/route.test.ts`

#### Manual Verification:

- Test output shows "1 passed" (or "1 test passed")
- Manually running the app and adding a guest still works (no regression)

---

## Phase 4: Document the Pattern in Cookbook

### Overview

Update `context/foundation/test-plan.md` §6 with the landed pattern.

### Changes Required:

#### 1. context/foundation/test-plan.md — Update §6 Cookbook

**File**: `context/foundation/test-plan.md`

**Intent**: Document the bootstrap pattern so Phase 2+ can copy it.

**Contract**: Update §6 section, replacing TBD for Phase 1 with:

```markdown
- **Guest API integration test pattern** — vitest setup for Next.js 16:
  - Config: `vitest.config.ts` with `@` → `./src` alias, node environment
  - Test DB: `.data/test.db` with `resetTestDb()` helper in `src/lib/db/test-db.ts`
  - Auth mock: `vi.mock('@/auth', () => ({ auth: vi.fn(() => mockSession) }))`
  - Test structure: POST → verify 201 → GET → verify guest in list
  - See: `src/app/api/guests/route.test.ts` for working example
```

### Success Criteria:

#### Automated Verification:

- `context/foundation/test-plan.md` §6 no longer has "TBD" for Phase 1

#### Manual Verification:

- Pattern is copy-able for Phase 2 (cost aggregation test)

---

## Testing Strategy

### Unit Tests:

- Not in scope for Phase 1 — integration test is the cheapest useful layer

### Integration Tests:

- Guest API: POST creates → GET returns (this phase)
- Future: Cost aggregation, auth protection, API contract

### Manual Testing Steps:

1. Run `npm test -- --run` — verify test passes
2. Run `npm run dev` — verify app still works
3. Add a guest via UI — verify it appears in guest list

---

## Performance Considerations

- Test DB should be fast (<100ms reset time)
- Vitest parallel execution may require per-test DB isolation (future concern)

---

## Migration Notes

- No migrations needed — test DB is fresh per run

---

## References

- Research: `context/changes/testing-bootstrap-first-integration/research.md`
- Test plan: `context/foundation/test-plan.md`
- Guest API: `src/app/api/guests/route.ts`
- Auth config: `auth.ts`

---

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Add Vitest Dependencies and Configuration

#### Automated

- [x] 1.1 Run `npm install` to add vitest and @vitest/ui — bbe0023
- [x] 1.2 Create `vitest.config.ts` at project root — bbe0023
- [x] 1.3 Add `"test": "vitest"` script to package.json — bbe0023
- [x] 1.4 Verify `npm test -- --run` executes without crashing — bbe0023

#### Manual

- [ ] 1.5 Confirm vitest UI opens with `npm test -- --ui` (optional)

### Phase 2: Create Test Database Utilities

#### Automated

- [x] 2.1 Create `src/lib/db/test-db.ts` with `getTestDb()` and `resetTestDb()` — adbcdcc
- [x] 2.2 Verify test DB file `.data/test.db` can be created — adbcdcc
- [x] 2.3 Verify `resetTestDb()` runs without errors — adbcdcc

#### Manual

- [ ] 2.4 Confirm `getTestDb()` returns working drizzle instance

### Phase 3: Write First Integration Test

#### Automated

- [x] 3.1 Create `src/app/api/guests/route.test.ts` — 1dfbb9f
- [x] 3.2 Mock `auth()` via `vi.mock()` — 1dfbb9f
- [x] 3.3 Write POST → GET integration test — 1dfbb9f
- [x] 3.4 Run `npm test -- --run` and verify test passes — 1dfbb9f

#### Manual

- [ ] 3.5 Verify app still works by adding guest via UI (no regression)

### Phase 4: Document the Pattern in Cookbook

#### Automated

- [x] 4.1 Update `context/foundation/test-plan.md` §6 Cookbook — 55b9fae
- [x] 4.2 Replace TBD for Phase 1 with landed pattern — 55b9fae

#### Manual

- [ ] 4.3 Verify pattern is copy-able for Phase 2
