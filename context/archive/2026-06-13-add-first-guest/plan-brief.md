# Guest Management (Add First Guest) — Plan Brief

> Full plan: `context/changes/add-first-guest/plan.md`

## What & Why

Build a complete guest management system for wedding planning. Users can add, view, edit, and delete guests with their spouse/partner and children information. The system calculates total persons per guest and shows aggregate children count at the bottom — critical for catering planning (children often have separate menus).

## Starting Point

The dashboard has a "Guests" card with an "Add first guest" button that currently does nothing (onClick prevents navigation, button is disabled). The database only has a `users` table for authentication. No guest-related tables, routes, or components exist.

## Desired End State

- Functional `/guests` page with guest list and add button (**all UI in Polish**)
- Modal form for adding/editing guests (name, spouse/partner, children count) with Polish labels
- Each guest card shows total persons: 1 (guest) + 1 (spouse if present) + children
- Bottom summary shows aggregate totals, especially total children for catering
- Dashboard "Guests" card navigates to `/guests` instead of being disabled

## Key Decisions Made

| Decision                       | Choice                          | Why (1 sentence)                                        | Source           |
| ------------------------------ | ------------------------------- | ------------------------------------------------------- | ---------------- |
| Data fields                    | Name, spouse, children count    | Minimum needed for seating + catering calculations      | User             |
| UI pattern                     | Modal dialog for form           | Keeps context, standard admin pattern                   | Plan             |
| List display                   | Card grid with summary at bottom| Shows all guests, highlights children count for catering| Plan             |
| Validation                     | Name required, others optional  | Flexible data entry while preventing empty records      | Plan             |
| Duplicate handling             | Warn but allow                  | Prevents accidental dupes without blocking edge cases   | Plan             |
| CRUD pattern                   | Server actions                  | Matches existing auth pattern in codebase               | Plan             |
| Testing                        | Manual only                     | Fastest implementation, no test infrastructure needed   | Plan             |
| Scope                          | Full CRUD + calculations        | User wants complete feature, not MVP                    | User             |
| **Language**                   | **Full Polish UI**              | **User requirement — all labels, buttons, messages**    | **User**         |

## Scope

**In scope:**
- Database schema for guests table
- Server actions for create, read, update, delete
- `/guests` page with guest list
- Add guest modal
- Edit guest modal
- Delete confirmation modal
- Aggregate calculations (total children, total seats)
- Dashboard link activation

**Out of scope:**
- RSVP tracking
- Guest categories (bride/groom side)
- Invitations or notifications
- Import/export
- Pagination (assume <100 guests)

## Architecture / Approach

```
┌─────────────────────────────────────────────────────────┐
│  Dashboard (src/app/page.tsx)                           │
│  └─ "Add first guest" → /guests                         │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  Guests Page (src/app/guests/page.tsx)                  │
│  ├─ Header + "Dodaj gościa" button                      │
│  ├─ GuestList component (cards grid)                    │
│  │   └─ Each card: name, spouse, children, total        │
│  └─ Aggregate summary (total children, seats)           │
│  │   All labels in Polish                               │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  Modals (client components)                             │
│  ├─ AddGuestModal — "Dodaj gościa" form (Polish)        │
│  ├─ EditGuestModal — "Edytuj" form (Polish)             │
│  └─ DeleteGuestModal — "Usuń" confirmation (Polish)     │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  Server Actions (src/lib/db/guests.ts)                 │
│  ├─ getGuests()                                         │
│  ├─ createGuest(data)                                   │
│  ├─ updateGuest(id, data)                               │
│  └─ deleteGuest(id)                                     │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  Database (SQLite via Drizzle)                          │
│  └─ guests table (id, name, spouseName, childrenCount)  │
└─────────────────────────────────────────────────────────┘
```

## Phases at a Glance

| Phase | What it delivers                    | Key risk                              |
| ----- | ----------------------------------- | ------------------------------------- |
| 1. Schema & Migration   | Guests table in database           | Migration fails or schema mismatch    |
| 2. Server Actions       | CRUD operations for guests         | Type errors or DB connection issues   |
| 3. List + Add Modal     | Working guest list with add form   | Modal state management complexity     |
| 4. Edit + Delete        | Full CRUD UI                       | Form pre-fill and refresh logic       |
| 5. Polish & Edge Cases  | Validation, loading, empty states  | All UI labels in Polish               |

**Prerequisites:** Existing database setup, Drizzle ORM configured, Next.js app running
**Estimated effort:** ~2-3 sessions across 5 phases

## Open Risks & Assumptions

- Polish character encoding (UTF-8) must be configured correctly — should be default in Next.js
- Modal component not yet in codebase — need to build from scratch (no existing pattern to copy)
- Aggregate calculations must be correct — seating count affects real costs
- User confirmed "full feature" scope — may reveal additional requirements during implementation
- **All UI text must be in Polish** — labels, buttons, errors, placeholders

## Success Criteria (Summary)

- User can add a guest with name, spouse/partner, and children count via modal form (**all labels in Polish**)
- Guest list shows all guests with correct total persons per guest (**Polish labels**)
- Bottom of list shows aggregate children count for catering (**Polish summary**)
- User can edit ("Edytuj") or delete ("Usuń") existing guests
- Dashboard "Guests" card navigates to working `/guests` page
- **All UI text is in Polish**: buttons, labels, errors, confirmations
