# View Guest List — Dashboard Card Fix Implementation Plan

## Overview

Fix the Guests dashboard card to show real-time guest statistics instead of always displaying the empty state. When guests exist, display: number of guests, number of children, and total seats. When no guests exist, show the current empty state message.

## Current State Analysis

**What exists:**
- `DashboardCard` component (`src/components/dashboard-card.tsx`) — static, accepts `emptyMessage` and `ctaLabel` as props
- Home page (`src/app/page.tsx`) — server component that renders dashboard grid with hardcoded card props
- Guest data available via `getGuests()` in `src/lib/db/guests.ts`
- `/guests` page fully functional with CRUD operations

**The bug:**
The dashboard card always shows "No guests added yet — Add your first guest to start tracking!" and "Add first guest" button regardless of whether guests exist in the database. The card has no data-fetching logic.

**Constraints:**
- Home page is a server component (can fetch data directly)
- DashboardCard is a client component (`"use client"`) — cannot fetch data internally
- Only the Guests card needs this treatment for now (Services, Timeline, Finances remain static)

## Desired End State

After implementation:
- Dashboard Guests card shows dynamic content based on actual guest count
- **Empty state** (0 guests): Shows current message "No guests added yet..." and "Add first guest" button
- **Filled state** (1+ guests): Shows summary stats in Polish:
  - "Liczba gości: X"
  - "Łączna liczba dzieci: Y"
  - "Łączna liczba miejsc: Z"
- Card remains clickable, navigating to `/guests`
- Same layout/structure for both states (consistent grid)

### Key Discoveries:

- `DashboardCard` is a client component (`"use client"` at `src/components/dashboard-card.tsx:1`) — cannot directly fetch data
- Home page is a server component (`src/app/page.tsx:6`) — can import and call `getGuests()` directly
- Guest calculations already exist in `GuestList` component (`src/components/guest-list.tsx:20-30`) — can reuse the logic
- Polish labels already established in guest components

## What We're NOT Doing

- Changing Services, Timeline, or Finances cards (remain static)
- Adding real-time updates (card refreshes on page navigation only)
- Creating a generic "dynamic dashboard card" pattern (Guests-specific for now)
- Adding capacity indicators or warnings (no target capacity defined)
- Changing the card's external behavior (still links to `/guests`)

## Implementation Approach

**Server-component pattern:** Fetch guest data in Home page (server component), pass as props to a new `GuestsDashboardCard` component that renders the appropriate content.

**Why this approach:**
- Home page is already a server component — no extra API call needed
- Keeps `DashboardCard` generic and unchanged
- Data is fresh on every page load
- Simplest implementation with minimal new code

## Critical Implementation Details

- **Polish labels**: All stats must be in Polish to match the existing guest list UI
- **Calculation consistency**: Use the same formula as `GuestList` component:
  - `totalGuests = guests.length`
  - `totalChildren = sum of childrenCount`
  - `totalSeats = sum of (1 + (comingAlone ? 0 : 1) + childrenCount)` per guest
- **Card structure**: Keep the same HTML structure (title, message paragraph, button) — just change the text content

## Phase 1: Create GuestsDashboardCard Component

### Overview

Create a new server component that fetches guest data and renders the dashboard card with dynamic content.

### Changes Required:

#### 1. Create GuestsDashboardCard component

**File**: `src/components/guests-dashboard-card.tsx`

**Intent**: Server component that fetches guests and renders a dashboard card with either empty state or stats summary.

**Contract**: 
- Server component (async, no `"use client"`)
- No props needed
- Imports `getGuests()` from `@/lib/db/guests`
- Calculates: `totalGuests`, `totalChildren`, `totalSeats` using the same logic as `GuestList`
- Renders `<Link>` wrapper (same as `DashboardCard`) to `/guests`
- **Empty state** (guests.length === 0):
  - Title: "Goście"
  - Message: "Nie masz jeszcze żadnych gości."
  - Subtext: "Dodaj pierwszego gościa, aby rozpocząć listę!"
  - Button: "Dodaj gościa"
- **Filled state** (guests.length > 0):
  - Title: "Goście"
  - Stats list (unordered list or div grid):
    - "Liczba gości: {totalGuests}"
    - "Łączna liczba dzieci: {totalChildren}"
    - "Łączna liczba miejsc: {totalSeats}"
  - Button: "Zarządzaj gośćmi" or "Zobacz listę"
- All text in Polish

### Success Criteria:

#### Automated Verification:

- TypeScript compiles: `npm run typecheck`
- Linting passes: `npm run lint`
- Build succeeds: `npm run build`

#### Manual Verification:

- Component renders without errors
- Empty state shows when no guests exist
- Filled state shows correct stats when guests exist
- Card is clickable and navigates to `/guests`

---

## Phase 2: Wire into Home Page

### Overview

Replace the static `DashboardCard` for Guests with the new `GuestsDashboardCard` component.

### Changes Required:

#### 1. Update Home page

**File**: `src/app/page.tsx`

**Intent**: Import and use `GuestsDashboardCard` instead of the generic `DashboardCard` for the Guests section.

**Contract**: 
- Import `GuestsDashboardCard` from `@/components/guests-dashboard-card`
- Replace the Guests `DashboardCard` JSX with `<GuestsDashboardCard />`
- Keep Services, Timeline, Finances `DashboardCard` instances unchanged
- Maintain the same grid structure

**Example structure:**
```tsx
import { GuestsDashboardCard } from "@/components/guests-dashboard-card"

// In the grid:
<GuestsDashboardCard />
<DashboardCard title="Services" ... />
<DashboardCard title="Timeline" ... />
<DashboardCard title="Finances" ... />
```

### Success Criteria:

#### Automated Verification:

- TypeScript compiles: `npm run typecheck`
- Linting passes: `npm run lint`
- Build succeeds: `npm run build`

#### Manual Verification:

- Dashboard loads without errors
- Guests card shows correct state (empty or filled)
- Other cards (Services, Timeline, Finances) unchanged
- Navigation to `/guests` works from Guests card

---

## Phase 3: Verification & Polish

### Overview

Test both states (empty and filled) and verify calculations match the guest list page.

### Changes Required:

#### 1. Manual testing

**Intent**: Verify the card displays correctly in both states and calculations are accurate.

**Contract**: Test scenarios:
1. **Empty state**: Clear all guests (or test on fresh DB), verify card shows empty message
2. **Single guest**: Add one guest (name only, no spouse, no children), verify:
   - "Liczba gości: 1"
   - "Łączna liczba dzieci: 0"
   - "Łączna liczba miejsc: 2" (guest + partner slot)
3. **Guest with spouse**: Add guest with spouse, verify total seats = 2
4. **Guest with children**: Add guest with children, verify total includes children count
5. **Guest coming alone**: Add guest with `comingAlone=true`, verify total seats = 1 (no partner slot)
6. **Multiple guests**: Add several guests, verify totals match the `/guests` page summary

#### 2. Fix any discrepancies

**Intent**: If calculations don't match, fix the formula in `GuestsDashboardCard`.

**Contract**: The formula must exactly match `src/components/guest-list.tsx:20-30`:
```ts
const totalSeats = guests.reduce((sum, g) => {
  return sum + 1 + (g.comingAlone ? 0 : 1) + (g.childrenCount || 0)
}, 0)
```

### Success Criteria:

#### Automated Verification:

- No console errors in browser dev tools

#### Manual Verification:

- Empty state displays correctly (Polish text)
- Filled state displays correct stats (Polish labels)
- All calculations match `/guests` page summary
- Card click navigates to `/guests`
- All Polish labels display correctly (UTF-8 encoding)

---

## Testing Strategy

### Unit Tests:

None — manual testing only for this change.

### Integration Tests:

None — the change is purely presentational.

### Manual Testing Steps:

1. **Empty state test**:
   - Navigate to `/guests`, delete all guests
   - Navigate back to dashboard (`/`)
   - Verify Guests card shows "Nie masz jeszcze żadnych gości."

2. **Single guest test**:
   - Click "Dodaj gościa", add guest with name only
   - Navigate back to dashboard
   - Verify stats: 1 guest, 0 children, 2 seats

3. **Complex guest test**:
   - Add guest with spouse and 2 children
   - Verify stats update correctly

4. **Coming alone test**:
   - Add guest with `comingAlone` checked
   - Verify seats = 1 (not 2)

5. **Cross-page consistency**:
   - Compare dashboard stats with `/guests` page summary
   - Verify numbers match exactly

## Performance Considerations

- One additional DB query per dashboard load (`getGuests()`)
- Negligible for <100 guests (all loaded in single query)
- No caching for MVP — fresh data on every page load

## Migration Notes

- No database changes
- No data migration needed
- Rollback: Revert to original `DashboardCard` usage in Home page

## References

- Existing guest calculations: `src/components/guest-list.tsx:20-30`
- Guest data access: `src/lib/db/guests.ts:8-10`
- DashboardCard component: `src/components/dashboard-card.tsx`
- Home page structure: `src/app/page.tsx:32-37`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Create GuestsDashboardCard Component

#### Automated

- [x] 1.1 TypeScript compiles: `npm run typecheck` — 0606e8f
- [x] 1.2 Linting passes: `npm run lint` — 0606e8f
- [x] 1.3 Build succeeds: `npm run build` — 0606e8f

#### Manual

- [x] 1.4 Component renders without errors — 0606e8f
- [x] 1.5 Empty state shows when no guests exist — 0606e8f
- [x] 1.6 Filled state shows correct stats when guests exist — 0606e8f
- [x] 1.7 Card is clickable and navigates to `/guests` — 0606e8f

### Phase 2: Wire into Home Page

#### Automated

- [x] 2.1 TypeScript compiles: `npm run typecheck` — 178e7f6
- [x] 2.2 Linting passes: `npm run lint` — 178e7f6
- [x] 2.3 Build succeeds: `npm run build` — 178e7f6

#### Manual

- [x] 2.4 Dashboard loads without errors — 178e7f6
- [x] 2.5 Guests card shows correct state (empty or filled) — 178e7f6
- [x] 2.6 Other cards (Services, Timeline, Finances) unchanged — 178e7f6
- [x] 2.7 Navigation to `/guests` works from Guests card — 178e7f6

### Phase 3: Verification & Polish

#### Automated

- [x] 3.1 No console errors in browser dev tools — 178e7f6

#### Manual

- [x] 3.2 Empty state displays correctly (Polish text) — 178e7f6
- [x] 3.3 Filled state displays correct stats (Polish labels) — 178e7f6
- [x] 3.4 All calculations match `/guests` page summary — 178e7f6
- [x] 3.5 Card click navigates to `/guests` — 178e7f6
- [x] 3.6 All Polish labels display correctly (UTF-8 encoding) — 178e7f6
