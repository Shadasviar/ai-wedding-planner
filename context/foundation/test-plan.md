---
project: Wedding Planner
version: 1
created: 2026-06-13
status: active
---

# Test Plan — Wedding Planner

## §1. Strategy

This plan defines a **phased rollout strategy** for building test coverage around the Wedding Planner's core risks. Each phase ships one change folder through the `/10x-new` → `/10x-research` → `/10x-plan` → `/10x-implement` chain. The goal is not maximum coverage — it is **risk retirement**: each phase proves that a specific failure scenario would be caught before it reaches production.

Three principles govern every test added under this plan:

1. **Cost × signal.** Every test — classic or AI-native — must answer: *what is the cheapest test that gives a real signal for this risk?* Do not promote to e2e because it "feels safer"; do not layer a vision model on top of a deterministic diff that already catches the regression.

2. **User concerns are evidence.** Risks the team has lived through (regressions after new development, business logic integrity) carry the same weight as PRD lines or hot-spot data.

3. **Risks are scenarios, not code locations.** This plan cites evidence (PRD lines, interview answers, hot-spot directories) — not file:line anchors. The test plan is a **QA spec**, not a code audit. `/10x-research` locates the code; this plan defines what failure looks like.

---

## §2. Risk Map

Top risks ranked by Impact × Likelihood. Sources are evidence (PRD, interview, hot-spot directories) — **not file anchors**.

| # | Risk (failure scenario) | Impact | Likelihood | Source(s) |
|---|-------------------------|--------|------------|-----------|
| 1 | A new slice breaks the guest data flow — add works, but list/finances show wrong or no data | High | High | Q1 (regression fear), hot-spot dir `src/app/api/guests/` (3 commits), hot-spot dir `src/lib/db/` (9 commits) |
| 2 | Cost aggregation double-counts or loses costs when Guests or Services change — Finances total is wrong | High | Medium | Q3 (business logic concern), PRD FR-016/017 (Finances summary), roadmap S-05 (product wedge) |
| 3 | Database schema migration corrupts existing data or desyncs schema — data loss with no recovery | High | Low | PRD NFR data integrity ("what you enter stays there"), hot-spot file `schema.ts` (4 commits in 30d) |
| 4 | Auth protection fails — unauthenticated user accesses protected routes or API endpoints | High | Low | PRD Access Control (explicit user accounts required), roadmap F-01 (auth-scaffold implemented) |
| 5 | API response shape changes silently — UI renders empty or wrong data without error | Medium | Medium | Q1 (silent failures), hot-spot file `api/guests/route.ts` (3 commits), hot-spot dir `src/components` (12 commits) |
| 6 | Timeline activities don't surface on dashboard — user misses deadlines (motivational feature broken) | Medium | Low | Roadmap S-06 (not yet implemented), PRD FR-014 (upcoming activities on dashboard) |

### Risk Response Guidance

| Risk # | What would prove protection | Must challenge | Context needed | Likely cheapest layer | Anti-pattern to avoid |
|--------|----------------------------|----------------|----------------|----------------------|----------------------|
| 1 | Add guest → list shows it → finances includes it | "Add works" ≠ "data flows everywhere" | DB schema, API response shape, where UI reads | Integration test (API → DB → API) | Happy-path-only unit test on API |
| 2 | Change guest cost → total updates correctly | "SUM works in SQL" ≠ "all cost sources included" | Which tables hold costs, aggregation query | Integration test (mutate → re-query total) | Testing the aggregation function in isolation without real data |
| 3 | Migration runs → existing rows intact | "Migration ran" ≠ "data preserved" | Current schema, seed data, migration script | Pre/post-migration data checksum test | Running migration without seed data to verify against |
| 4 | Unauth request → 401/redirect | "Login page exists" ≠ "routes protected" | Auth middleware, protected route list | Auth integration test (request unauth → deny) | Testing login form instead of route protection |
| 5 | API contract change → UI handles it or test fails | "UI renders" ≠ "data is correct" | API response schema, UI expectations | Contract test or typed API layer test | Asserting only status code, not response shape |

---

## §3. Phased Rollout

Each phase ships one change folder. Status values: `not started` → `change opened` → `researched` → `planned` → `implementing` → `complete`.

| # | Phase name | Goal | Risks covered | Test types | Status | Change folder |
|---|------------|------|---------------|------------|--------|---------------|
| 1 | Bootstrap test runner + first integration | Get vitest running; one green test proving guest add→list flow | Risk 1 | Unit setup + integration | planned | testing-bootstrap-first-integration |
| 2 | Business logic: cost aggregation | Prove finances sum is correct and updates | Risk 2 | Integration | not started | — |
| 3 | Auth + API contract protection | Prove routes are protected; API shape is stable | Risk 4, 5 | Integration + contract | not started | — |
| 4 | Quality gates (CI wiring) | Lock the floor — tests run on push | All | CI workflow | not started | — |

---

## §4. Stack

**Detected stack:**
- Language: TypeScript
- Framework: Next.js 16 (App Router)
- UI: React 19 + Tailwind 4
- Data: Drizzle ORM + better-sqlite3
- Auth: next-auth v5 (beta.31)
- Package manager: npm

**Test infra:** None yet — no test runner config, no test files detected.

**Stack grounding tools (current session):**
- Docs: none available in current session — checked: 2026-06-13
- Search: none available in current session — checked: 2026-06-13
- Runtime/browser: none available in current session — checked: 2026-06-13
- Provider/platform: none available in current session — checked: 2026-06-13

Proceeding with local manifest/config evidence only. Lack of MCP access does not block the rollout.

---

## §5. Negative Space

What this rollout will **not** test (based on user interview Q5 and PRD non-goals):

- **UI layout / visual regression** — Manual testing is sufficient for Tailwind classes, component layout, and visual appearance. (User-stated: Q5)
- **External integrations** — PRD explicitly excludes vendor APIs, payment systems, email services. (PRD Non-Goals)
- **Mobile native apps** — Browser-only on LAN; no iOS/Android testing needed. (PRD Non-Goals)
- **Photo/media management** — No upload or media storage features exist. (PRD Non-Goals)
- **Real-time sync** — LAN access is sufficient; no instant sync testing. (PRD Non-Goals)
- **Recommendation engine** — No AI features exist. (PRD Non-Goals)
- **Budget validation** — No target budget enforcement; statistics only. (PRD Non-Goals)

---

## §6. Cookbook

Patterns shipped by rollout phases. Each pattern names the behavior/failure mode, not the file.

### Phase 1: Bootstrap Test Runner + First Integration

- **Vitest setup for Next.js 16 App Router** — Config at `vitest.config.ts`:
  - `globals: true` for describe/it/expect without imports
  - `environment: 'node'` for server-side API tests
  - Path aliases: `@` → `./src`, `@root` → `./` (for auth module)
  - `testTimeout: 5000` for integration tests

- **Test database strategy** — Helper at `src/lib/db/test-db.ts`:
  - Uses `.data/test.db` (configured via `DATABASE_PATH` env var)
  - `resetTestDb()` deletes test DB + WAL files, recreates directory
  - `getTestDb()` returns drizzle instance with schema
  - Call `resetTestDb()` in `beforeEach()` for clean state

- **Auth mock pattern** — Mock `@root/auth` (not `next-auth` directly):
  ```typescript
  vi.mock('@root/auth', () => ({
    auth: vi.fn(() => Promise.resolve({
      user: { id: '1', name: 'test', email: 'test@example.com' }
    })),
    handlers: {},
    signIn: vi.fn(),
    signOut: vi.fn()
  }))
  ```

- **Guest API integration test** — `src/app/api/guests/route.test.ts`:
  - Mock `@root/auth` before importing route handlers
  - `beforeEach(() => resetTestDb())` for isolation
  - Test: POST valid guest → 201, then GET → guest in list
  - Assert on status codes and response structure (not Polish error messages)

See: `src/app/api/guests/route.test.ts` for working example.

### Remaining Phases

- **TBD** — Phase 2 will document: cost aggregation integration test pattern (mutate cost → verify total)
- **TBD** — Phase 3 will document: auth protection test pattern (unauth request → 401), API contract test pattern
- **TBD** — Phase 4 will document: GitHub Actions CI workflow for running tests on push

---

## §7. Refresh Notes

- **Initial creation:** 2026-06-13 — seed rollout for new project with no test infrastructure
- **Next refresh trigger:** When a new top-3 risk surfaces, a tool's `checked:` date is > 3 months old, the tech stack changes, or §5 negative-space no longer matches what the team believes.
