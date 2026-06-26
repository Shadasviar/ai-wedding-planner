---
project: Wedding Planner
version: 2
status: active
created: 2026-06-12
updated: 2026-06-26
prd_version: 1
main_goal: low-complexity
top_blocker: capacity
---

# Roadmap: Wedding Planner

> Derived from `context/foundation/prd.md` (v1) + auto-researched codebase baseline.
> Edit-in-place; archive when superseded.
> Slices below are listed in dependency order. The "At a glance" table is the index.

## Vision recap

A private, safe app for wedding planning — one place to track guests, vendors/services, catering menu, timeline activities, and costs. The product wedge — the one trait that, if removed, makes the product indistinguishable from a generic spreadsheet — is that all costs aggregate automatically into a Finances summary, giving a single view of the wedding budget without manual summation.

## North star

**S-01: Add first guest** — The smallest end-to-end slice whose successful delivery would prove the core product hypothesis: data flows from user input → database → list view. Placed as early as prerequisites allow because everything else only matters if this works.

> A reader-facing one-liner explaining what "north star" means here: the smallest end-to-end slice whose successful delivery would prove the core product hypothesis — placed as early as Prerequisites allow because everything else only matters if this works. Include this gloss the FIRST time "north star" appears in the document body; do not repeat it later.

## At a glance

| ID | Change ID | Outcome (user can …) | Prerequisites | PRD refs | Status |
|---|---|---|---|---|---|
| F-01 | auth-scaffold | (foundation) Issue session tokens; protect routes | — | Access Control | done |
| F-02 | database-scaffold | (foundation) Persist wedding data (guests, services, timeline, catering) | F-01 | NFR-Data integrity | done |
| S-01 | add-first-guest | Add a guest with associated cost (e.g., meal price) | F-01, F-02 | US-01, FR-005 | done |
| S-02 | view-guest-list | View guest list with cost breakdown | S-01 | FR-006 | done |
| S-03 | empty-dashboard | See dashboard with 3 areas (Guests, Services, Timeline) + Finances (empty) | F-01 | US-01, FR-001, FR-002, FR-003 | done |
| S-04 | add-first-service | Add a service (vendor) with associated cost | F-01, F-02 | FR-009 | done |
| S-05 | view-finances-summary | See total wedding cost aggregated from Guests + Services + Catering | S-01, S-04, S-07 | FR-016, FR-017 | blocked |
| S-06 | timeline-activities | Add and view timeline activities with target dates | F-01, F-02 | FR-013, FR-014, FR-015 | ready |
| S-07 | add-catering-menu | Add catering menu items with cost per plate and dietary info | F-01, F-02 | FR-016, FR-017 | done |
| S-08 | view-catering-menu | View and manage catering menu with dietary filters | S-07 | FR-016 | proposed |

## Streams

Navigation aid — groups items that share a Prerequisites chain. Canonical ordering still lives in the dependency graph below; this table is the proposed reading order across parallel tracks.

| Stream | Theme | Chain | Note |
|---|---|---|---|
| D | Budget aggregation | `S-01` + `S-04` + `S-07` → `S-05` | Joins Streams B, C, and F at S-05; Finances needs all cost sources. Blocked until S-07 lands. |
| E | Timeline | `F-02` → `S-06` | Independent track; ready to implement. |
| F | Catering menu | `F-02` → `S-07` → `S-08` | Parallel with Stream E; menu items with cost per plate contribute to Finances. S-07 ready, S-08 blocked on S-07. |

## Baseline

What's already in place in the codebase as of 2026-06-16 (auto-researched + user-confirmed).
Foundations below assume these are present and do NOT re-scaffold them.

- **Frontend:** present — Next.js 16 + React 19 + TypeScript + Tailwind 4 (src/app/, package.json)
- **Backend/API:** present — Next.js App Router with API routes (src/app/api/)
- **Data:** present — Drizzle ORM + better-sqlite3 (src/lib/db/schema.ts, src/lib/db/*.ts)
- **Auth:** present — next-auth v5 credentials provider, JWT sessions (auth.ts, middleware.ts)
- **Deploy/infra:** absent — no Dockerfile, docker-compose, or deploy config
- **Observability:** absent — no logging/error tracking packages

## Foundations

—

## Slices

### S-05: View Finances summary

- **Outcome:** See total wedding cost aggregated from Guests + Services + Catering.
- **Change ID:** view-finances-summary
- **PRD refs:** FR-016, FR-017
- **Prerequisites:** S-01, S-04, S-07
- **Parallel with:** S-06, S-08
- **Blockers:** —
- **Unknowns:**
  - Guest cost field missing — PRD FR-005 requires guest costs but schema has no cost field. Owner: user. Block: yes (blocks S-05).
- **Risk:** Depends on S-01, S-04, S-07 having data to aggregate. This is the product wedge — if aggregation fails, the product is just CRUD. Risk: aggregation logic complexity; keep to simple SUM for MVP. Also risk of missing cost sources if guest costs aren't added.
- **Status:** blocked

### S-06: Timeline activities

- **Outcome:** Add and view timeline activities with target dates.
- **Change ID:** timeline-activities
- **PRD refs:** FR-013, FR-014, FR-015
- **Prerequisites:** F-01, F-02
- **Parallel with:** S-07, S-08
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Independent of other slices; can run anytime after foundations. Risk: scope creep (reminders, notifications, email integration) — PRD Non-Goals exclude these.
- **Status:** ready

### S-07: Add catering menu

- **Outcome:** Add catering menu items (dania) with cost per plate, type (przekąska/danie ciepłe/przystawka/custom), and vegetarian flag.
- **Change ID:** add-catering-menu
- **PRD refs:** FR-016, FR-017
- **Prerequisites:** F-01, F-02
- **Parallel with:** S-06, S-08
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Same pattern as S-01/S-04 (add entity with cost). Risk: none — copy/paste pattern from guests/services. Menu costs must be included in S-05 aggregation.
- **Status:** done

### S-08: View catering menu

- **Outcome:** View and manage catering menu with dietary filters (vege) and type filters.
- **Change ID:** view-catering-menu
- **PRD refs:** FR-016
- **Prerequisites:** S-07
- **Parallel with:** S-05, S-06
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Depends on S-07 having data to display. Risk: none — straightforward read operation with filter UI.
- **Status:** proposed

### S-07: Add catering menu

- **Outcome:** Add catering menu items (dania) with cost per plate, type (przekąska/danie ciepłe/przystawka/custom), and vegetarian flag.
- **Change ID:** add-catering-menu
- **PRD refs:** FR-016, FR-017
- **Prerequisites:** F-01, F-02
- **Parallel with:** S-01, S-02, S-04, S-06
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Same pattern as S-01/S-04 (add entity with cost). Risk: none — copy/paste pattern from guests/services. Menu costs must be included in S-05 aggregation.
- **Status:** proposed

### S-08: View catering menu

- **Outcome:** View and manage catering menu with dietary filters (vege) and type filters.
- **Change ID:** view-catering-menu
- **PRD refs:** FR-016
- **Prerequisites:** S-07
- **Parallel with:** S-02, S-04, S-06
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Depends on S-07 having data to display. Risk: none — straightforward read operation with filter UI.
- **Status:** proposed

## Backlog Handoff

| Roadmap ID | Change ID | Suggested issue title | Ready for `/10x-plan` | Notes |
|---|---|---|---|---|
| S-05 | view-finances-summary | Finances summary with aggregated costs | no | Blocked on S-01, S-04, S-07 — needs guest cost field + catering costs |
| S-06 | timeline-activities | Timeline activities CRUD | yes | Run `/10x-plan timeline-activities` |
| S-07 | add-catering-menu | Add catering menu items with cost per plate | yes | Run `/10x-plan add-catering-menu` |
| S-08 | view-catering-menu | View and manage catering menu with filters | no | Blocked on S-07 |

## Open Roadmap Questions

—

## Parked

- **Edit/Delete operations** — Why parked: PRD Non-Goals don't exclude these, but low-complexity goal defers them until after add/view work. Add edit (FR-007, FR-011) and delete (FR-008, FR-012) after core CRUD is proven.
- **Visual diagrams for Finances** — Why parked: FR-017 mentions "visual diagram" but low-complexity goal defers this. Simple text totals first; charts later.
- **Mark timeline activities complete** — Why parked: FR-015 is a nice-to-have; add/view (FR-013, FR-014) come first.
- **Catering item edit/delete** — Why parked: Same as other edit/delete operations. Implement after S-07/S-08 add/view are proven.
- **Catering dietary filters** — Why parked: S-08 can ship with basic list view first; filters (vege, by type) are secondary UX enhancements.

## Done

- **F-01: (foundation) Issue session tokens; protect routes** — Archived 2026-06-13 → `context/changes/auth-scaffold/`. Lesson: next-auth v5 with credentials provider, JWT sessions.
- **F-02: (foundation) Persist wedding data** — Archived 2026-06-13 → `context/changes/database-scaffold/`. Lesson: Drizzle ORM + better-sqlite3, schema at `src/lib/db/schema.ts`.
- **S-01: Add first guest with cost** — Archived 2026-06-26 → `context/archive/2026-06-13-add-first-guest/`. Lesson: guest CRUD without cost field (PRD gap — FR-005 not yet implemented).
- **S-02: View guest list with cost breakdown** — Archived 2026-06-13 → `context/changes/view-guest-list/`. Lesson: list view with aggregate counts (headcount, not costs).
- **S-03: Empty dashboard** — Archived 2026-06-12 → `context/changes/empty-dashboard/`. Lesson: dashboard structure with 3 areas + Finances placeholder.
- **S-04: Add first service** — Archived 2026-06-15 → `context/changes/add-first-service/`. Lesson: service CRUD with full cost tracking (cost, paidAmount).
- **S-07: Add catering menu items with cost per plate** — Archived 2026-06-26 → `context/archive/2026-06-16-add-catering-menu/`. Lesson: catering CRUD with global cost-per-plate × guestCount aggregation.
