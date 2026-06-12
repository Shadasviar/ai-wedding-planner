# Empty Dashboard Implementation Plan

## Overview

Transform `src/app/page.tsx` from a minimal authenticated placeholder into a proper dashboard showing 4 area cards (Guests, Services, Timeline, Finances) with empty states. This delivers S-03 from the roadmap — the UI chrome that proves multi-user access works and provides navigation structure for future slices.

## Current State Analysis

**What exists now:**
- `src/app/page.tsx` — Server Component with auth check, shows welcome message + sign out button
- Protected via Auth.js middleware (`src/middleware.ts`)
- Root layout (`src/app/layout.tsx`) provides flex column structure and Geist fonts
- Login page (`src/app/login/page.tsx`) establishes Tailwind 4 styling patterns

**What's missing:**
- No dashboard structure (3 areas + Finances as required by FR-001, FR-002, FR-003)
- No navigation to detail screens (FR-004)
- No empty state messaging

**Key constraints:**
- S-03 only requires F-01 (auth) — no database queries (keeps scope minimal)
- Must remain a Server Component (no client-side waterfalls for empty state)
- Routes `/guests`, `/services`, `/timeline`, `/finances` don't exist yet (navigation stubs only)

## Desired End State

After this plan is complete:
- Dashboard shows 4 clickable area cards in 2x2 grid (responsive: stacks on mobile)
- Each card displays: area name, empty state message (friendly tone), disabled CTA button with tooltip
- Finances card shows "$0.00" total wedding cost
- Cards are clickable (entire card area) but navigate to placeholder since routes don't exist yet
- Sign out button preserved (moved to header area or kept in layout)

**Verification:**
- `npm run build` passes
- `npm run dev` → dashboard renders at `/`
- Responsive layout works (2x2 desktop, stacked mobile)
- All 4 cards visible with correct empty state copy
- Clicking cards shows "Coming soon" behavior (disabled with tooltip)

### Key Discoveries:

- Research recommends **static empty state** for S-03 (no DB queries) — upgrade to dynamic when slices land
- Server Component pattern allows direct `auth()` calls — no client-side session hook needed
- Tailwind 4 patterns from login page: `bg-white`, `shadow-lg`, `rounded-lg`, zinc color palette
- Navigation routes (`/guests`, etc.) will be created in S-01, S-04, S-06 — stubs only for now

## What We're NOT Doing

- Database queries for counts (static empty state per research recommendation)
- Actual detail pages (routes don't exist yet — future slices)
- Header/navigation bar (MVP minimal chrome is sufficient)
- Icons or visual indicators (optional polish for later)
- Sign out redesign (preserve existing button, may reposition)
- Visual diagram for Finances (FR-017 is parked per roadmap)

## Implementation Approach

Create a reusable `DashboardCard` component for consistent styling across all 4 areas. Replace the minimal content in `src/app/page.tsx` with a 2x2 grid layout containing 4 cards. Each card shows area name, empty state message with friendly tone, and a disabled CTA button with tooltip. Cards are visually clickable but disabled until detail pages exist. Finances card shows "$0.00" as the zero state.

## Critical Implementation Details

- **Disabled CTA buttons**: Use `disabled` attribute on button, `pointer-events-none` class, and `title` attribute for tooltip (simplest, no dependency). This signals "coming soon" without requiring placeholder pages.
- **Responsive grid**: Use `grid grid-cols-1 md:grid-cols-2 gap-4` — single column on mobile (< 768px), 2 columns on desktop. This is the standard Tailwind responsive pattern.
- **Card as clickable area**: Since entire card should be clickable but buttons are disabled, wrap card content in `<a>` tag with `href="#"` and `onClick={(e) => e.preventDefault()}` to show disabled behavior. When routes exist, just update the `href`.

---

## Phase 1: Create Dashboard Card Component

### Overview

Create a reusable `DashboardCard` component that renders an area card with empty state styling, motivational copy, and disabled CTA button.

### Changes Required:

#### 1. Create DashboardCard component

**File**: `src/components/dashboard-card.tsx`

**Intent**: Create a reusable card component for dashboard areas with consistent styling, empty state message, and disabled CTA button.

**Contract**: Create the file with this structure:

```typescript
interface DashboardCardProps {
  title: string
  emptyMessage: string
  ctaLabel: string
  href: string
}

export function DashboardCard({ title, emptyMessage, ctaLabel, href }: DashboardCardProps) {
  return (
    <a
      href={href}
      onClick={(e) => e.preventDefault()}
      className="block rounded-lg bg-white p-6 shadow-lg hover:shadow-xl transition-shadow border border-zinc-200"
    >
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      <p className="mt-2 text-sm text-zinc-600">{emptyMessage}</p>
      <button
        disabled
        className="mt-4 w-full rounded-md bg-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-500 cursor-not-allowed"
        title="Coming in next update"
      >
        {ctaLabel}
      </button>
    </a>
  )
}
```

### Success Criteria:

#### Automated Verification:

- [ ] 1.1 TypeScript compiles: `npm run build`
- [ ] 1.2 No ESLint errors: `npm run lint`
- [ ] 1.3 Component exports `DashboardCard` with correct props

#### Manual Verification:

- [ ] 1.4 Card renders with correct styling (white bg, shadow, rounded corners)
- [ ] 1.5 Disabled button shows grayed-out appearance with tooltip on hover

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Build Dashboard Grid Layout

### Overview

Replace the minimal content in `src/app/page.tsx` with a 2x2 responsive grid containing 4 dashboard area cards.

### Changes Required:

#### 1. Update dashboard page

**File**: `src/app/page.tsx`

**Intent**: Replace the current placeholder (welcome message + sign out) with a 2x2 grid of dashboard cards for Guests, Services, Timeline, and Finances.

**Contract**: Update the file to use this structure:

```typescript
import { auth } from "@root/auth"
import { redirect } from "next/navigation"
import { signOut } from "@root/auth"
import { DashboardCard } from "@/components/dashboard-card"

export default async function Home() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-full flex flex-col p-8">
      {/* Header with welcome and sign out */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">Welcome, {session.user?.name}</h1>
        <form
          action={async () => {
            "use server"
            await signOut()
          }}
        >
          <button className="rounded-md border border-zinc-300 px-4 py-2 hover:bg-zinc-50">
            Sign Out
          </button>
        </form>
      </div>

      {/* Dashboard grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard
          title="Guests"
          emptyMessage="No guests added yet — Add your first guest to start tracking!"
          ctaLabel="Add first guest"
          href="/guests"
        />
        <DashboardCard
          title="Services"
          emptyMessage="No services added yet — Add your first service to track vendors!"
          ctaLabel="Add first service"
          href="/services"
        />
        <DashboardCard
          title="Timeline"
          emptyMessage="No activities planned yet — Add your first activity to stay on track!"
          ctaLabel="Add first activity"
          href="/timeline"
        />
        <DashboardCard
          title="Finances"
          emptyMessage="Total wedding cost so far"
          ctaLabel="$0.00"
          href="/finances"
        />
      </div>
    </div>
  )
}
```

**Note**: The Finances card uses a slightly different pattern — the "CTA" shows the amount ($0.00) rather than an action button. This may need a variant prop or separate handling.

### Success Criteria:

#### Automated Verification:

- [ ] 2.1 TypeScript compiles: `npm run build`
- [ ] 2.2 No ESLint errors: `npm run lint`
- [ ] 2.3 Grid layout uses responsive classes (`grid-cols-1 md:grid-cols-2`)

#### Manual Verification:

- [ ] 2.4 Dashboard renders at `/` with 4 cards visible
- [ ] 2.5 Layout is 2x2 on desktop, single column on mobile (test by resizing browser)
- [ ] 2.6 Welcome message and Sign Out button appear in header
- [ ] 2.7 All empty state messages display correctly with friendly tone

**Implementation Note**: Pause for manual confirmation.

---

## Phase 3: Wire Navigation Stubs

### Overview

Ensure each card's navigation stub behaves correctly — disabled but showing "Coming soon" intent via tooltip.

### Changes Required:

#### 1. Verify disabled navigation behavior

**File**: `src/components/dashboard-card.tsx`

**Intent**: Confirm that clicking a card doesn't navigate (since routes don't exist) but shows visual feedback that feature is coming.

**Contract**: The `onClick={(e) => e.preventDefault()}` prevents navigation. The `title="Coming in next update"` attribute provides browser-native tooltip on hover.

No code changes needed if Phase 1 implemented correctly — this is verification that the disabled behavior works.

### Success Criteria:

#### Automated Verification:

- [ ] 3.1 TypeScript compiles: `npm run build`

#### Manual Verification:

- [ ] 3.2 Clicking any card doesn't navigate (URL doesn't change)
- [ ] 3.3 Hovering over disabled button shows "Coming in next update" tooltip
- [ ] 3.4 Disabled button is visually distinct (gray, cursor-not-allowed)

**Implementation Note**: Pause for manual confirmation.

---

## Phase 4: Final Verification & Polish

### Overview

Verify the complete dashboard works correctly, auth is preserved, and responsive layout functions as expected.

### Changes Required:

#### 1. Full integration test

**File**: N/A (verification only)

**Intent**: Test the complete dashboard flow — auth, layout, responsive behavior, and visual polish.

**Contract**: Manual verification checklist:

1. Navigate to `/` while logged out → redirects to `/login`
2. Log in with valid credentials → dashboard renders
3. Verify 4 cards visible with correct titles and messages
4. Resize browser to mobile width (< 768px) → cards stack vertically
5. Resize to desktop width → 2x2 grid
6. Hover over each disabled CTA → tooltip appears
7. Click any card → no navigation (stays on dashboard)
8. Click Sign Out → redirects to `/login`

### Success Criteria:

#### Automated Verification:

- [ ] 4.1 TypeScript compiles: `npm run build`
- [ ] 4.2 No ESLint errors: `npm run lint`

#### Manual Verification:

- [ ] 4.3 Auth redirect works (logged out → login)
- [ ] 4.4 Dashboard renders after login
- [ ] 4.5 Responsive layout works (2x2 desktop, stacked mobile)
- [ ] 4.6 All tooltips display on hover
- [ ] 4.7 Sign out works correctly

**Implementation Note**: Pause for manual confirmation.

---

## Testing Strategy

### Unit Tests:

None — per the low-complexity goal and consistency with F-01/F-02, manual verification is sufficient.

### Integration Tests:

- Auth redirect: logged out user redirected to `/login`
- Dashboard renders after successful login
- Responsive layout at mobile and desktop breakpoints

### Manual Testing Steps:

1. Open incognito window (no session)
2. Navigate to `/` → verify redirect to `/login`
3. Log in with `admin` / `wedding2026`
4. Verify dashboard shows 4 cards (Guests, Services, Timeline, Finances)
5. Resize browser to narrow width (< 768px) → verify cards stack
6. Resize to wide width → verify 2x2 grid
7. Hover over each CTA button → verify tooltip "Coming in next update"
8. Click any card → verify no navigation
9. Click Sign Out → verify redirect to `/login`

## Performance Considerations

- Server Component — no client-side JavaScript for rendering
- Static content — no database queries, no API calls
- Tailwind classes — compiled at build time, zero runtime cost
- Minimal DOM — 4 cards, simple structure

## Migration Notes

- This is a greenfield addition — no existing functionality is modified
- The welcome message moves from centered to header layout
- Sign out button preserved, repositioned to header right

## References

- Related research: `context/changes/empty-dashboard/research.md`
- Similar implementation: `src/app/login/page.tsx` (Tailwind patterns)
- Root layout: `src/app/layout.tsx` (flex column structure)
- Roadmap S-03: `context/foundation/roadmap.md` (line 34)
- PRD requirements: `context/foundation/prd.md` (FR-001 through FR-004)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Create Dashboard Card Component

#### Automated

- [x] 1.1 TypeScript compiles: `npm run build` — 04c46d4
- [x] 1.2 No ESLint errors: `npm run lint` — 04c46d4
- [x] 1.3 Component exports `DashboardCard` with correct props — 04c46d4

#### Manual

- [x] 1.4 Card renders with correct styling (white bg, shadow, rounded corners) — 04c46d4
- [x] 1.5 Disabled button shows grayed-out appearance with tooltip on hover — 04c46d4

### Phase 2: Build Dashboard Grid Layout

#### Automated

- [x] 2.1 TypeScript compiles: `npm run build` — 04c46d4
- [x] 2.2 No ESLint errors: `npm run lint` — 04c46d4
- [x] 2.3 Grid layout uses responsive classes (`grid-cols-1 md:grid-cols-2`) — 04c46d4

#### Manual

- [x] 2.4 Dashboard renders at `/` with 4 cards visible — 04c46d4
- [x] 2.5 Layout is 2x2 on desktop, single column on mobile (test by resizing browser) — 04c46d4
- [x] 2.6 Welcome message and Sign Out button appear in header — 04c46d4
- [x] 2.7 All empty state messages display correctly with friendly tone — 04c46d4

**Note**: Fixed during implementation - added `"use client"` to DashboardCard component to support onClick handler.

### Phase 3: Wire Navigation Stubs

#### Automated

- [x] 3.1 TypeScript compiles: `npm run build` — 04c46d4

#### Manual

- [x] 3.2 Clicking any card doesn't navigate (URL doesn't change) — 04c46d4
- [x] 3.3 Hovering over disabled button shows "Coming in next update" tooltip — 04c46d4
- [x] 3.4 Disabled button is visually distinct (gray, cursor-not-allowed) — 04c46d4

### Phase 4: Final Verification & Polish

#### Automated

- [x] 4.1 TypeScript compiles: `npm run build`
- [x] 4.2 No ESLint errors: `npm run lint`

#### Manual

- [x] 4.3 Auth redirect works (logged out → login)
- [x] 4.4 Dashboard renders after login
- [x] 4.5 Responsive layout works (2x2 desktop, stacked mobile)
- [x] 4.6 All tooltips display on hover
- [x] 4.7 Sign out works correctly
