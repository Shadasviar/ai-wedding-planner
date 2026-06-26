# Empty Dashboard — Plan Brief

> Full plan: `context/changes/empty-dashboard/plan.md`
> Research: `context/changes/empty-dashboard/research.md`

## What & Why

Implement S-03 (empty dashboard) — transform the minimal authenticated placeholder into a proper dashboard showing 4 area cards (Guests, Services, Timeline, Finances) with empty states. This proves multi-user access works and provides the navigation structure for all future slices.

## Starting Point

The current `src/app/page.tsx` is a protected Server Component showing only a welcome message and sign out button. Auth.js v5 is configured (F-01), database layer exists (F-02), but no dashboard structure or detail routes are implemented yet.

## Desired End State

- 4 clickable area cards in responsive 2x2 grid (stacks on mobile)
- Each card shows: area name, friendly empty state message, disabled CTA with "Coming in next update" tooltip
- Finances card displays "$0.00" total wedding cost
- Sign out button preserved in header area
- Cards are visually clickable but don't navigate (routes don't exist yet)

## Key Decisions Made

| Decision                       | Choice                          | Why (1 sentence)                                               | Source |
| ------------------------------ | ------------------------------- | -------------------------------------------------------------- | ------ |
| Layout                         | 2x2 grid (desktop), stack (mobile) | Balanced visual weight, standard dashboard pattern.            | Plan |
| CTA buttons                    | Disabled with tooltip           | Signals "coming soon" without creating placeholder pages.      | Plan |
| Card interaction               | Clickable entire card           | Larger hit target, modern pattern, simpler markup.             | Plan |
| Empty state tone               | Friendly & motivational         | Encourages action, matches wedding planning excitement.        | Plan |
| Finances display               | $0.00 with label                | Accurate zero state, matches aggregation mental model.         | Plan |
| Data strategy                  | Static empty state (no DB)      | Keeps S-03 scoped to UI chrome; upgrade when slices land.      | Research |

## Scope

**In scope:**
- `DashboardCard` reusable component
- 2x2 responsive grid layout
- 4 area cards (Guests, Services, Timeline, Finances)
- Disabled CTA buttons with tooltips
- Header with welcome message + sign out
- Navigation stubs (href placeholders)

**Out of scope:**
- Database queries for counts (static empty state)
- Actual detail pages (`/guests`, `/services`, etc.)
- Header/navigation bar redesign
- Icons or visual indicators
- Visual diagram for Finances (FR-017 parked)

## Architecture / Approach

Create a reusable `DashboardCard` component with consistent Tailwind 4 styling (white bg, shadow, rounded corners, zinc palette). The dashboard page (`src/app/page.tsx`) remains a Server Component, importing the card component and rendering 4 instances in a responsive grid. Navigation is stubbed via `href` props with `onClick={(e) => e.preventDefault()}` to prevent navigation until routes exist.

```
┌─────────────────────────────────────────────────────────┐
│  Welcome, [user]                           [Sign Out]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐    ┌─────────────┐                    │
│  │   Guests    │    │  Services   │                    │
│  │ No guests.. │    │ No services.│                    │
│  │[Add guest]  │    │[Add service]│                    │
│  └─────────────┘    └─────────────┘                    │
│                                                         │
│  ┌─────────────┐    ┌─────────────┐                    │
│  │  Timeline   │    │  Finances   │                    │
│  │ No activities│   │  $0.00      │                    │
│  │[Add activity]│   │             │                    │
│  └─────────────┘    └─────────────┘                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Phases at a Glance

| Phase | What it delivers                    | Key risk                                |
| ----- | ----------------------------------- | --------------------------------------- |
| 1. Card Component | Reusable `DashboardCard` with empty state styling | Disabled button must look intentional, not broken |
| 2. Grid Layout | 2x2 responsive grid with 4 cards in `page.tsx` | Responsive breakpoint must work correctly |
| 3. Navigation Stubs | Disabled click behavior with tooltip | Tooltip must be visible on hover |
| 4. Verification | Full integration test (auth, layout, responsive) | None expected — straightforward UI work |

**Prerequisites:** F-01 (auth-scaffold) complete — user can log in and access protected `/`
**Estimated effort:** ~1 session across 4 phases

## Open Risks & Assumptions

- **Tooltip visibility**: Browser-native `title` attribute may not be visible on mobile (no hover state) — acceptable for MVP since mobile users can't hover anyway.
- **Disabled affordance**: Users may not understand why cards look clickable but don't work — the "Coming in next update" tooltip clarifies this.
- **Finances card variant**: The Finances card shows "$0.00" as the "CTA" — may need slight visual adjustment to distinguish from action buttons.

## Success Criteria (Summary)

- Dashboard renders at `/` after login with 4 area cards visible
- Responsive layout works (2x2 desktop, stacked mobile)
- Empty state messages display with friendly, motivational tone
- Disabled CTAs show "Coming in next update" tooltip on hover
- Auth redirect works (logged out → login, sign out → login)
