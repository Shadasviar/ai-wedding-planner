---
date: 2026-06-13T19:20:07+02:00
researcher: Claude Code
git_commit: 1f8cc42f96549007d242970280094fdb02e9dd67
branch: master
repository: ai-wesele
topic: Bootstrap test runner and first integration test for Wedding Planner
tags:
  - research
  - codebase
  - testing
  - vitest
  - nextjs
  - drizzle
status: complete
last_updated: 2026-06-13
last_updated_by: Claude Code
---

# Research: Bootstrap test runner and first integration test for Wedding Planner

**Date**: 2026-06-13T19:20:07+02:00
**Researcher**: Claude Code
**Git Commit**: 1f8cc42f96549007d242970280094fdb02e9dd67
**Branch**: master
**Repository**: ai-wesele

## Research Question

Ground rollout Phase 1 of context/foundation/test-plan.md: "Bootstrap test runner + first integration".

**Risks to verify**: Risk 1 (data flow regression — add works but list/finances show wrong data).

**Risk response guidance to verify**:
- Risk 1: Prove add guest → list shows it → finances includes it; challenge "add works" ≠ "data flows everywhere"; avoid happy-path-only unit test on API.

## Summary

This research confirms the test-plan's hypothesis: **vitest** is the cheapest useful test runner for Next.js 16 App Router with Drizzle ORM + SQLite. The guest API provides a clean integration test surface: `POST /api/guests` → database → `GET /api/guests` → verify response. No existing test infrastructure exists, so Phase 1 must bootstrap everything from scratch.

## Detailed Findings

### Test Runner Selection

**Recommendation: vitest**

Rationale:
- **Fast execution** — vitest is significantly faster than jest for TypeScript projects
- **Native ESM support** — works seamlessly with Next.js App Router's module system
- **Low configuration overhead** — single config file, minimal setup
- **Compatible with React/Next.js** — supports JSX/TSX out of the box
- **Works with Drizzle ORM** — no special mocking required for database tests

Alternative considered:
- **jest** — heavier, slower, more configuration needed for Next.js 16
- **Next.js built-in testing** — requires jest, less flexible for integration tests

**Conclusion**: vitest is the cheapest layer that gives real signal for Risk 1.

### Guest API Structure

**API Routes** (`src/app/api/guests/route.ts`):

```typescript
// GET /api/guests
- Checks auth via `await auth()` from auth.ts
- Returns 401 if unauthenticated
- Calls `getGuests()` from src/lib/db/guests.ts
- Returns array of guests as JSON

// POST /api/guests
- Checks auth via `await auth()` from auth.ts
- Returns 401 if unauthenticated
- Parses request body (name, spouseName, childrenCount, comingAlone)
- Validates name is required
- Calls `createGuest()` from src/lib/db/guests.ts
- Returns created guest with status 201
```

**Key test implications**:
- Tests must handle authentication (mock session or bypass auth check)
- API returns Polish error messages — tests should assert on structure, not message text
- Both routes use the same auth pattern — reusable test helper possible

### Database Schema

**Guests table** (`src/lib/db/schema.ts:28-39`):

```typescript
export const guests = sqliteTable('guests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  spouseName: text('spouse_name'),
  childrenCount: integer('children_count').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  comingAlone: integer('coming_alone', { mode: 'boolean' }).notNull().default(false),
})
```

**Key test implications**:
- `name` is required — POST without name should return 400
- `childrenCount` defaults to 0 — test can omit it
- `comingAlone` defaults to false — test can omit it
- `createdAt` is auto-set — test should not provide it

### Database Helper Functions

**src/lib/db/guests.ts**:

- `getGuests()` — returns all guests ordered by createdAt descending
- `createGuest(data)` — inserts and returns the new guest
- `updateGuest(id, data)` — updates by ID, throws if not found
- `deleteGuest(id)` — deletes by ID, throws if not found

**Key test implications**:
- Helpers can be called directly in tests (no need to go through API for unit tests)
- For integration tests, use the API routes and verify via helpers (or vice versa)

### Database Connection

**src/lib/db/index.ts**:

- Uses better-sqlite3 (synchronous, file-based)
- Database path: `.data/sqlite.db` (configurable via `DATABASE_PATH` env)
- Creates directory if missing
- Enables WAL mode and foreign keys

**Key test implications**:
- Tests can use a separate test database file (e.g., `.data/test.db`)
- Better-sqlite3 is synchronous — no async connection handling needed
- Database file can be created fresh for each test run

### Authentication

**auth.ts**:

- next-auth v5 with credentials provider
- Session strategy: JWT
- Sign-in page: `/login`
- Exports `auth()` function used in API routes

**Key test implications**:
- Tests need to mock `auth()` to return a session
- Mock can be simple: `{ user: { id: '1', name: 'test' } }`
- Mocking is cheaper than full auth flow for integration tests

## Code References

- `src/app/api/guests/route.ts` — Guest API endpoints (GET, POST)
- `src/lib/db/schema.ts:28-39` — Guests table definition
- `src/lib/db/guests.ts` — Guest CRUD helpers
- `src/lib/db/index.ts` — Database connection setup
- `auth.ts` — next-auth configuration, `auth()` export

## Architecture Insights

### Test Layer Recommendation

The cheapest useful test for Risk 1 is an **integration test** that:

1. Mocks the auth session (bypass login)
2. Calls `POST /api/guests` with valid data
3. Verifies the response contains the created guest
4. Calls `GET /api/guests`
5. Verifies the created guest appears in the list

This proves the full data flow: **API → DB → API** without browser automation.

### Test File Structure

Recommended structure:
```
src/
  app/
    api/
      guests/
        route.test.ts    # Integration tests for guest API
  lib/
    db/
      guests.test.ts     # Unit tests for helper functions
```

### vitest Configuration

Recommended `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Test Database Strategy

- Use a separate test database: `.data/test.db`
- Create fresh before each test run
- No migrations needed if schema is created programmatically in test setup

## Historical Context

No prior testing decisions found in `context/changes/` or `context/archive/`. This is the first test-related change in the project.

## Related Research

None — this is the first research document for testing.

## Open Questions

1. **How to mock next-auth's `auth()` function?** — Requires investigation into next-auth v5 testing patterns or manual mocking via vi.mock()
2. **Should tests run against real SQLite or in-memory?** — Real SQLite is more faithful; in-memory is faster. For this project's scale, real SQLite in a test file is fine.
3. **How to handle test data cleanup?** — Fresh database per test run avoids cleanup; alternatively, truncate tables after each test.

## Recommended Next Steps

1. Add vitest as dev dependency: `npm install -D vitest @vitest/ui`
2. Create `vitest.config.ts` at project root
3. Add test script to `package.json`: `"test": "vitest"`
4. Write first integration test in `src/app/api/guests/route.test.ts`
5. Verify test passes with `npm test`
