# View Guest List — Plan Brief

> Full plan: `context/changes/view-guest-list/plan.md`

## What & Why

Fix the Guests dashboard card to display real-time guest statistics instead of always showing the empty state. The current card shows "No guests added yet" and "Add first guest" even when guests exist in the database. After this fix, the card will show guest count, children count, and total seats when guests exist.

## Starting Point

The dashboard has a Guests card that is currently static — it always displays the same message and CTA button regardless of whether guests exist. The guest data is available via `getGuests()` but the dashboard doesn't fetch it. The `/guests` page works correctly with full CRUD operations.

## Desired End State

- **Empty state** (0 guests): "Nie masz jeszcze żadnych gości." + "Dodaj gościa" button
- **Filled state** (1+ guests): Three stats in Polish:
  - "Liczba gości: X"
  - "Łączna liczba dzieci: Y"
  - "Łączna liczba miejsc: Z"
- Card remains clickable, linking to `/guests`
- Same card layout for both states

## Key Decisions Made

| Decision                       | Choice                          | Why (1 sentence)                                        | Source           |
| ------------------------------ | ------------------------------- | ------------------------------------------------------- | ---------------- |
| Data fetching                  | Server component (Home page)    | Home is already a server component — no extra API call needed. | Plan             |
| Card content (filled)          | Summary stats only              | Matches user request; clean and concise.                | User             |
| Card layout                    | Same structure, different text  | Consistent dashboard grid; no layout shifts.            | User             |
| Scope                          | Guests card only                | Focused change; other cards remain static for now.      | User             |
| Language                       | Full Polish UI                  | Matches existing guest list components.                 | Plan             |
| Calculations                   | Reuse GuestList formula         | Consistency with existing guest list page.              | Plan             |

## Scope

**In scope:**
- Create `GuestsDashboardCard` server component
- Fetch guest data in Home page
- Display dynamic stats when guests exist
- Empty state with Polish messaging
- Wire into existing dashboard grid

**Out of scope:**
- Services, Timeline, Finances cards (remain static)
- Real-time updates (refreshes on page load only)
- Capacity warnings or indicators
- Generic "dynamic dashboard card" pattern

## Architecture / Approach

```
┌─────────────────────────────────────────────────────────┐
│  Home Page (src/app/page.tsx) — Server Component        │
│  ├─ Imports getGuests() from @/lib/db/guests            │
│  ├─ Fetches guest data on render                        │
│  └─ Renders dashboard grid with:                        │
│      ├─ <GuestsDashboardCard /> (new, dynamic)          │
│      └─ <DashboardCard /> × 3 (static: Services, etc.)  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  GuestsDashboardCard (src/components/...) — Server      │
│  ├─ Fetches guests via getGuests()                      │
│  ├─ Calculates: totalGuests, totalChildren, totalSeats  │
│  └─ Renders <Link> wrapper to /guests                   │
│      ├─ Empty: message + "Dodaj gościa" button          │
│      └─ Filled: stats list + "Zarządzaj gośćmi" button  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  Database (SQLite via Drizzle)                          │
│  └─ guests table (already exists)                       │
└─────────────────────────────────────────────────────────┘
```

## Phases at a Glance

| Phase | What it delivers                    | Key risk                              |
| ----- | ----------------------------------- | ------------------------------------- |
| 1. Create component       | GuestsDashboardCard with data fetching | Calculation formula mismatch          |
| 2. Wire into Home         | Dashboard shows dynamic card          | Import path errors, type issues       |
| 3. Verification           | Both states tested, calculations verified | Polish encoding, edge cases       |

**Prerequisites:** Existing guest infrastructure (schema, `getGuests()`, `/guests` page)
**Estimated effort:** ~1 session across 3 phases

## Open Risks & Assumptions

- `comingAlone` calculation must match `GuestList` component exactly
- Polish character encoding (UTF-8) is already configured — should be default in Next.js
- No loading state needed (server component fetches before render)

## Success Criteria (Summary)

- Dashboard Guests card shows empty state when no guests exist (Polish text)
- Dashboard Guests card shows guest count, children count, and total seats when guests exist (Polish labels)
- All calculations match the `/guests` page summary exactly
- Card navigates to `/guests` when clicked
