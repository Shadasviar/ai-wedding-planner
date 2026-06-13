# Bootstrap Test Runner and First Integration Test — Plan Brief

> Full plan: `context/changes/testing-bootstrap-first-integration/plan.md`
> Research: `context/changes/testing-bootstrap-first-integration/research.md`

## What & Why

Bootstrap vitest for the Wedding Planner project and write one green integration test proving the guest data flow works end-to-end (POST → DB → GET). This retires Risk 1 from the test plan: "A new slice breaks the guest data flow — add works, but list/finances show wrong or no data."

## Starting Point

No test infrastructure exists — zero config, zero test files. The guest API (`src/app/api/guests/route.ts`) already works with auth protection and Drizzle ORM. Research confirmed vitest is the cheapest useful test runner for this stack.

## Desired End State

- `vitest` and `@vitest/ui` installed as dev dependencies
- `vitest.config.ts` at project root with `@` → `./src` alias
- `npm test` script runs vitest
- One integration test at `src/app/api/guests/route.test.ts` proves: POST creates guest → GET returns it
- Test uses fresh `.data/test.db`, mocks auth via `vi.mock()`
- Test-plan.md §6 cookbook documents the landed pattern for Phase 2 to copy

## Key Decisions Made

| Decision                       | Choice                        | Why (1 sentence)                          | Source   |
|--------------------------------|-------------------------------|-------------------------------------------|----------|
| Test runner                    | vitest                        | Fastest, native ESM, minimal config       | Research |
| Test database strategy         | Fresh file per run            | Clean state, no cleanup logic             | Plan     |
| Auth mocking approach          | vi.mock() the auth function   | Isolated to tests, no prod code changes   | Plan     |
| Test file location             | route.test.ts next to API     | Co-located, follows Next.js convention    | Plan     |
| Scope for first test           | Happy path only               | Smallest test that proves the flow works  | Plan     |

## Scope

**In scope:**
- Vitest installation and configuration
- Test database utility (`src/lib/db/test-db.ts`)
- One integration test (POST → GET guest flow)
- Cookbook documentation in test-plan.md

**Out of scope:**
- CI/CD wiring (Phase 4 of test-plan.md)
- Error case / validation testing
- Unit tests for DB helpers
- Visual/UI testing

## Architecture / Approach

Three phases: (1) install vitest + config, (2) create test DB utilities, (3) write integration test. Each phase is independently verifiable. Test isolates from production via `DATABASE_PATH` env var pointing to `.data/test.db`.

## Phases at a Glance

| Phase | What it delivers                    | Key risk                        |
|-------|-------------------------------------|---------------------------------|
| 1. Vitest setup                             | Config + npm test script          | Path alias misconfiguration     |
| 2. Test DB utilities                        | getTestDb(), resetTestDb()        | WAL file cleanup edge case      |
| 3. First integration test                   | POST → GET guest flow test        | Auth mock shape mismatch        |
| 4. Cookbook documentation                   | §6 updated with landed pattern    | None — mechanical edit          |

**Prerequisites:** None — this is the first test phase.
**Estimated effort:** ~1-2 sessions (3-4 phases)

## Open Risks & Assumptions

- Auth mock shape must match next-auth v5 JWT session structure exactly
- Next.js App Router route handlers may need special handling in vitest (unverified)
- Test DB reset must clean up WAL files to avoid file lock issues

## Success Criteria (Summary)

- `npm test -- --run` executes and the guest API test passes
- Test proves full data flow: authenticated POST creates guest → GET returns it
- Pattern documented in test-plan.md §6 for Phase 2 to copy
