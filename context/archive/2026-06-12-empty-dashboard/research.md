---
date: 2026-06-12T21:25:57+02:00
researcher: Claude Opus 4.8
git_commit: 387a97604cc7d0a2c4877ccadd7340ec86cb545a
branch: master
repository: ai-wesele
topic: Empty dashboard implementation - what should the dashboard show and how should it be structured?
tags: [research, codebase, dashboard, ui, roadmap]
status: complete
last_updated: 2026-06-12
last_updated_by: Claude Opus 4.8
---

# Research: Empty dashboard implementation

**Date**: 2026-06-12T21:25:57+02:00
**Researcher**: Claude Opus 4.8
**Git Commit**: 387a97604cc7d0a2c4877ccadd7340ec86cb545a
**Branch**: master
**Repository**: ai-wesele

## Research Question

What should the empty dashboard show and how should it be structured for S-03 (empty-dashboard)?

## Summary

The dashboard (S-03) is the authenticated landing page that shows 3 management areas (Guests, Services, Timeline) plus a Finances summary. Currently, `src/app/page.tsx` is a minimal authenticated placeholder showing only a welcome message and sign-out button. The roadmap explicitly sequences S-03 to run **parallel with S-01** (add-first-guest) because it only requires F-01 (auth), not data — this is intentional for morale: "building UI chrome without data feels incomplete — pair with S-01 for morale."

Key findings:
- **Current state**: `src/app/page.tsx` is a protected Server Component with basic welcome message
- **Required structure**: 3 areas (Guests, Services, Timeline) + Finances summary section
- **Empty state behavior**: Areas should show empty/zero state with prompts to add first item
- **Navigation**: Each area should be clickable to navigate to detail screens (future slices)
- **Finances**: Should show aggregated total (zero initially) — this is the product wedge

## Detailed Findings

### Current Dashboard Implementation

**File**: [`src/app/page.tsx`](src/app/page.tsx)

- Server Component using `auth()` to verify session
- Redirects to `/login` if unauthenticated (via middleware)
- Currently displays:
  - Welcome message with user name
  - "Wedding Planner Dashboard" text
  - Sign Out button (server action)
- Uses Tailwind 4 for styling
- Layout is `min-h-full flex flex-col` from root layout

**What's missing**:
- No 3-area structure (Guests, Services, Timeline)
- No Finances summary section
- No navigation to detail screens
- No empty state messaging

### Roadmap Requirements (S-03)

**File**: [`context/foundation/roadmap.md`](context/foundation/roadmap.md#L34)

From roadmap S-03 entry:
- **Outcome**: "See dashboard with 3 areas (Guests, Services, Timeline) + Finances summary (empty/zero state)"
- **Prerequisites**: F-01 only (auth — no database dependency)
- **Parallel with**: S-01, S-04, S-06
- **PRD refs**: US-01, FR-001, FR-002, FR-003

**Stream A** (Auth foundation): `F-01` → `S-03`
> "Auth foundation unlocks empty dashboard (proof of multi-user access)."

**Risk note from roadmap**:
> "Can run parallel with S-01 since it only needs auth, not data. Risk: building UI chrome without data feels incomplete — pair with S-01 for morale."

### PRD Functional Requirements

**File**: [`context/foundation/prd.md`](context/foundation/prd.md#L67-L84)

**Dashboard section**:
- FR-001: User can open the app and view the dashboard. Priority: must-have
- FR-002: User can see three major areas on dashboard: Guests, Services, Timeline. Priority: must-have
- FR-003: User can see Finances summary on dashboard (total cost, visual diagram). Priority: must-have
- FR-004: User can navigate from dashboard into each area's detail screen. Priority: must-have

**User Story US-01**:
> Given the user has opened the wedding planning app
> When they arrive at the dashboard
> Then they see Guests, Services, Timeline areas plus a Finances summary with total cost and diagram

**Acceptance Criteria**:
- Dashboard shows 3 management areas + Finances summary
- Finances shows aggregated total from all cost sources
- Timeline displays upcoming activities (motivational, date-driven)
- Tapping any area navigates to that area's detail screen

### UI/UX Patterns from Existing Code

**File**: [`src/app/login/page.tsx`](src/app/login/page.tsx)

Established patterns from login page:
- Centered layout with `min-h-full items-center justify-center`
- Card-based forms: `bg-white p-8 shadow-lg rounded-lg`
- Tailwind 4 utility classes
- Form state with React hooks (`useState`)
- Error display in rounded alert boxes: `bg-red-50 p-3 text-sm text-red-700`
- Primary buttons: `bg-zinc-900` with `hover:bg-zinc-800`
- Secondary buttons: `border border-zinc-300` with `hover:bg-zinc-50`

**File**: [`src/app/layout.tsx`](src/app/layout.tsx)

Root layout provides:
- Geist fonts (Sans + Mono) via CSS variables
- `h-full antialiased` on html
- `min-h-full flex flex-col` on body
- Session provider wrapper for client-side session access

### Data Models Available

**File**: [`src/lib/db/schema.ts`](src/lib/db/schema.ts)

Current schema (from F-02):
- `users` table only (id, username, password_hash, created_at)

**Missing tables** (to be added in future slices):
- `guests` — S-01 (add-first-guest)
- `services` — S-04 (add-first-service)
- `timeline_activities` — S-06 (timeline-activities)

**Implication for empty dashboard**:
- Finances summary will show zero until S-01 and S-04 are complete
- Timeline area will show "no upcoming activities" until S-06
- Each area should have "Add first X" call-to-action

### Historical Context from Prior Changes

**File**: [`context/changes/auth-scaffold/plan-brief.md`](context/changes/auth-scaffold/plan-brief.md)

From F-01 (auth-scaffold):
- Dashboard root (`/`) is protected via middleware
- Auth.js v5 with JWT sessions in HTTP-only cookies
- Server Components can call `auth()` directly
- Client components use `useSession()` hook

**File**: [`context/changes/database-scaffold/plan-brief.md`](context/changes/database-scaffold/plan-brief.md)

From F-02 (database-scaffold):
- Database now available for queries
- `findUserByUsername()` helper for auth
- Same pattern can be used for dashboard data queries

## Code References

- `src/app/page.tsx:5-30` — Current dashboard implementation (Server Component with auth check)
- `src/app/login/page.tsx:28-75` — Login page UI pattern (centered card form)
- `src/app/layout.tsx:26-35` — Root layout structure (flex column, full height)
- `src/components/providers.tsx` — Session provider wrapper
- `context/foundation/roadmap.md:34` — S-03 roadmap entry
- `context/foundation/prd.md:67-84` — Dashboard functional requirements
- `context/foundation/prd.md:109-119` — US-01 user story

## Architecture Insights

### Dashboard as Server Component

The current dashboard uses Next.js App Router Server Component pattern:
- Calls `auth()` directly (no client-side session hook needed)
- Redirects on server if no session
- Can fetch data directly without API calls
- Sign out uses server action (`"use server"`)

**Implication**: Empty dashboard can remain a Server Component, fetching empty state data (or lack thereof) without client-side waterfalls.

### Empty State Strategy

Three approaches considered:

1. **Static empty state** — Hardcoded "no data" messages
   - Pro: Simplest, no DB queries needed
   - Con: Doesn't scale when data arrives

2. **Dynamic empty state** — Query DB for counts, show empty if zero
   - Pro: Accurate, transitions smoothly to populated state
   - Con: Requires DB connection (F-02 dependency)

3. **Hybrid** — Static empty state now, dynamic when slices land
   - Pro: Works today, upgrade path exists
   - Con: Two implementations to maintain

**Recommendation**: Hybrid approach — static empty state for S-03, add DB queries when each slice (S-01, S-04, S-06) lands. This keeps S-03 scoped to UI chrome only.

### Navigation Pattern

Current routing:
- Middleware protects all routes except `/login`
- Server Component redirects unauthenticated users
- Client navigation via `useRouter().push()`

**For dashboard areas**: Each area should be a clickable card that navigates to:
- `/guests` — S-01/S-02 (guest list)
- `/services` — S-04/S-05 (services list)
- `/timeline` — S-06 (timeline activities)
- `/finances` — S-05 (finances summary)

These routes don't exist yet — they'll be created in subsequent slices.

## Related Research

- `context/changes/auth-scaffold/plan.md` — Auth implementation details
- `context/changes/database-scaffold/plan.md` — Database layer implementation
- `context/foundation/roadmap.md` — Full slice dependencies and sequencing

## Open Questions

1. **Should empty areas show "Add first X" buttons that navigate to future forms?**
   - Yes, but forms don't exist yet — could show disabled state or "Coming soon" tooltip

2. **Should Finances show $0.00 or "No data yet"?**
   - Recommend $0.00 — accurate (zero is a valid number) and matches aggregation mental model

3. **Should dashboard layout be grid or stacked cards?**
   - Grid (2x2) for desktop: Guests/Services top row, Timeline/Finances bottom row
   - Stacked on mobile: single column, vertical scroll

4. **Should there be a header/navigation bar?**
   - Not for MVP — current minimal chrome (welcome + sign out) is sufficient
   - Can add nav bar when more detail screens exist

## Recommendations for S-03 Plan

1. **Keep scope minimal** — UI chrome only, no data dependencies
2. **Use 2x2 grid layout** — 4 cards (Guests, Services, Timeline, Finances)
3. **Each card shows**:
   - Area name (e.g., "Guests")
   - Empty state message (e.g., "No guests added yet")
   - Call-to-action (e.g., "Add first guest" — disabled or placeholder)
   - Icon or visual indicator (optional)
4. **Finances card shows**:
   - "Total wedding cost"
   - "$0.00" (zero state)
   - No diagram yet (FR-017 is parked)
5. **Cards are clickable** — navigate to future detail routes (stub if needed)
6. **Remain a Server Component** — no client-side state needed for empty dashboard
