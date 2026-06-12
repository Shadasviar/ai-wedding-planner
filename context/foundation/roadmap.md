---
project: Wedding Planner
version: 1
status: draft
created: 2026-06-12
updated: 2026-06-12
prd_version: 1
main_goal: low-complexity
top_blocker: capacity
---

# Roadmap: Wedding Planner

> Derived from `context/foundation/prd.md` (v1) + auto-researched codebase baseline.
> Edit-in-place; archive when superseded.
> Slices below are listed in dependency order. The "At a glance" table is the index.

## Vision recap

A private, safe app for wedding planning — one place to track guests, vendors/services, timeline activities, and costs. The product wedge — the one trait that, if removed, makes the product indistinguishable from a generic spreadsheet — is that all costs aggregate automatically into a Finances summary, giving a single view of the wedding budget without manual summation.

## North star

**S-01: Add first guest** — The smallest end-to-end slice whose successful delivery would prove the core product hypothesis: data flows from user input → database → list view. Placed as early as prerequisites allow because everything else only matters if this works.

## At a glance

| ID | Change ID | Outcome (user can …) | Prerequisites | PRD refs | Status |
|---|---|---|---|---|---|
| F-01 | auth-scaffold | (foundation) Issue session tokens; protect routes | — | Access Control | proposed |
| F-02 | database-scaffold | (foundation) Persist wedding data (guests, services, timeline) | F-01 | NFR-Data integrity | proposed |
| S-01 | add-first-guest | Add a guest with associated cost (e.g., meal price) | F-01, F-02 | US-01, FR-005 | proposed |
| S-02 | view-guest-list | View guest list with cost breakdown | S-01 | FR-006 | proposed |
| S-03 | empty-dashboard | See dashboard with 3 areas (Guests, Services, Timeline) + Finances (empty) | F-01 | US-01, FR-001, FR-002, FR-003 | proposed |
| S-04 | add-first-service | Add a service (vendor) with associated cost | F-01, F-02 | FR-009 | proposed |
| S-05 | view-finances-summary | See total wedding cost aggregated from Guests + Services | S-01, S-04 | FR-016, FR-017 | proposed |
| S-06 | timeline-activities | Add and view timeline activities with target dates | F-01, F-02 | FR-013, FR-014, FR-015 | proposed |

## Streams

Navigation aid — groups items that share a Prerequisites chain. Canonical ordering still lives in the dependency graph below; this table is the proposed reading order across parallel tracks.

| Stream | Theme | Chain | Note |
|---|---|---|---|
| A | Account lifecycle | `F-01` → `S-03` | Auth foundation unlocks empty dashboard (proof of multi-user access). |
| B | Guest tracking | `F-02` → `S-01` → `S-02` | Database foundation unlocks first CRUD; view depends on add. |
| C | Vendor tracking | `F-02` → `S-04` | Parallel with Stream B; same pattern, different entity. |
| D | Budget aggregation | `S-01` + `S-04` → `S-05` | Joins Streams B and C at S-05; Finances needs both data sources. |
| E | Timeline | `F-02` → `S-06` | Independent track; no cross-dependencies with other slices. |

## Baseline

What's already in place in the codebase as of 2026-06-12 (auto-researched + user-confirmed).
Foundations below assume these are present and do NOT re-scaffold them.

- **Frontend:** present — Next.js 16 + React 19 + TypeScript + Tailwind 4 (package.json, src/app/)
- **Backend/API:** present — Next.js App Router with API routes capability (src/app/ exists)
- **Data:** absent — no ORM or database driver in package.json
- **Auth:** absent — no auth provider or middleware detected
- **Deploy/infra:** absent — no Dockerfile, docker-compose, or deploy config (per infrastructure.md: Docker Standalone to be added)
- **Observability:** absent — no logging/error tracking packages

## Foundations

### F-01: Auth scaffold

- **Outcome:** (foundation) Issue session tokens; protect routes. Users can sign in and access authenticated pages.
- **Change ID:** auth-scaffold
- **PRD refs:** Access Control section
- **Unlocks:** S-01, S-03, S-04, S-06
- **Prerequisites:** —
- **Parallel with:** F-02
- **Blockers:** —
- **Unknowns:**
  - What is the specific authentication mechanism? (email/password, username/password, or passwordless magic link) — Owner: user. Block: no.
- **Risk:** Sequenced first because all user-facing slices require auth. Risk: over-engineering auth when a simple session-based approach suffices for 2 users on LAN.
- **Status:** proposed

### F-02: Database scaffold

- **Outcome:** (foundation) Persist wedding data (guests, services, timeline, costs). Schema migrations in place.
- **Change ID:** database-scaffold
- **PRD refs:** NFR-Data integrity ("what you enter stays there")
- **Unlocks:** S-01, S-02, S-04, S-05, S-06
- **Prerequisites:** —
- **Parallel with:** F-01
- **Blockers:** —
- **Unknowns:**
  - Which database? (SQLite for simplicity, or PostgreSQL for future flexibility) — Owner: user. Block: no.
- **Risk:** Sequenced early because all CRUD slices depend on it. Risk: schema over-design when the MVP needs only 3-4 tables (Guests, Services, Timeline, Costs).
- **Status:** proposed

## Slices

### S-01: Add first guest

- **Outcome:** Add a guest with associated cost (e.g., meal price).
- **Change ID:** add-first-guest
- **PRD refs:** US-01 (partial), FR-005
- **Prerequisites:** F-01, F-02
- **Parallel with:** S-03, S-04, S-06
- **Blockers:** —
- **Unknowns:** —
- **Risk:** North star slice — proves data flow end-to-end. Risk: scope creep (adding edit/delete in same slice); keep to add-only for smallest validation.
- **Status:** proposed

### S-02: View guest list

- **Outcome:** View guest list with cost breakdown.
- **Change ID:** view-guest-list
- **PRD refs:** FR-006
- **Prerequisites:** S-01
- **Parallel with:** S-04, S-06
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Depends on S-01 having data to display. Risk: none — straightforward read operation.
- **Status:** proposed

### S-03: Empty dashboard

- **Outcome:** See dashboard with 3 areas (Guests, Services, Timeline) + Finances summary (empty/zero state).
- **Change ID:** empty-dashboard
- **PRD refs:** US-01, FR-001, FR-002, FR-003
- **Prerequisites:** F-01
- **Parallel with:** S-01, S-04, S-06
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Can run parallel with S-01 since it only needs auth, not data. Risk: building UI chrome without data feels incomplete — pair with S-01 for morale.
- **Status:** proposed

### S-04: Add first service

- **Outcome:** Add a service (vendor) with associated cost.
- **Change ID:** add-first-service
- **PRD refs:** FR-009
- **Prerequisites:** F-01, F-02
- **Parallel with:** S-01, S-02, S-06
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Same pattern as S-01 (add entity with cost). Risk: none — copy/paste pattern from guests.
- **Status:** proposed

### S-05: View Finances summary

- **Outcome:** See total wedding cost aggregated from Guests + Services.
- **Change ID:** view-finances-summary
- **PRD refs:** FR-016, FR-017
- **Prerequisites:** S-01, S-04
- **Parallel with:** S-02, S-06
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Depends on S-01 and S-04 having data to aggregate. This is the product wedge — if aggregation fails, the product is just CRUD. Risk: aggregation logic complexity; keep to simple SUM for MVP.
- **Status:** proposed

### S-06: Timeline activities

- **Outcome:** Add and view timeline activities with target dates.
- **Change ID:** timeline-activities
- **PRD refs:** FR-013, FR-014, FR-015
- **Prerequisites:** F-01, F-02
- **Parallel with:** S-01, S-02, S-04
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Independent of other slices; can run anytime after foundations. Risk: scope creep (reminders, notifications, email integration) — PRD Non-Goals exclude these.
- **Status:** proposed

## Backlog Handoff

| Roadmap ID | Change ID | Suggested issue title | Ready for `/10x-plan` | Notes |
|---|---|---|---|---|
| F-01 | auth-scaffold | Scaffold authentication for Wedding Planner | no | Needs auth mechanism decision first |
| F-02 | database-scaffold | Scaffold database layer for Wedding Planner | no | Needs database choice first |
| S-01 | add-first-guest | Add first guest with cost | no | Blocked on F-01, F-02 |
| S-02 | view-guest-list | View guest list with cost breakdown | no | Blocked on S-01 |
| S-03 | empty-dashboard | Dashboard with empty areas | no | Blocked on F-01 |
| S-04 | add-first-service | Add first service (vendor) with cost | no | Blocked on F-01, F-02 |
| S-05 | view-finances-summary | Finances summary with aggregated costs | no | Blocked on S-01, S-04 |
| S-06 | timeline-activities | Timeline activities CRUD | no | Blocked on F-01, F-02 |

## Open Roadmap Questions

1. **What is the specific authentication mechanism?** — Owner: user. Block: roadmap-wide (F-01 depends on this).
2. **Which database to use?** — Owner: user. Block: roadmap-wide (F-02 depends on this).

## Parked

- **Edit/Delete operations** — Why parked: PRD Non-Goals don't exclude these, but low-complexity goal defers them until after add/view work. Add edit (FR-007, FR-011) and delete (FR-008, FR-012) after core CRUD is proven.
- **Visual diagrams for Finances** — Why parked: FR-017 mentions "visual diagram" but low-complexity goal defers this. Simple text totals first; charts later.
- **Mark timeline activities complete** — Why parked: FR-015 is a nice-to-have; add/view (FR-013, FR-014) come first.

## Done

—
