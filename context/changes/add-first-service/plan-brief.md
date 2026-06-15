# Add First Service — Plan Brief

> Full plan: `context/changes/add-first-service/plan.md`
> Roadmap: `context/foundation/roadmap.md` (S-04)
> PRD: `context/foundation/prd.md` (FR-009)

## What & Why

Build full CRUD for wedding services (vendors) — add, view, edit, delete — with cost tracking that shows paid vs. total. This unblocks S-05 (Finances summary) by providing the second data source for budget aggregation. Services + Guests together feed the wedding budget total.

## Starting Point

The codebase already has a proven CRUD pattern from `add-first-guest`:
- Database layer with Drizzle ORM (`src/lib/db/`)
- Server actions for CRUD operations
- API routes with auth checks
- Modal-based add/edit forms
- Card-based list with aggregate summary
- Polish UI throughout

This plan copies that pattern exactly — only the data model differs (services have cost, paid, notes, deadline instead of spouse, children).

## Desired End State

After this plan is complete:
- `/services` page shows all vendors with paid/total breakdown (e.g., "Opłacone: 2 000 zł / 10 000 zł")
- Users can add services with name, cost, paid amount, notes, and optional deadline
- Users can edit or delete services via modals
- Dashboard "Usługi" card links to `/services`
- Aggregate summary shows total services, total cost, total paid, total remaining

## Key Decisions Made

| Decision                       | Choice            | Why (1 sentence)  | Source           |
| ------------------------------ | ----------------- | ----------------- | ---------------- |
| Fields per service             | name, cost, paidAmount, notes, deadline | Matches vendor tracking needs — cost + payment state + user reminders | Plan |
| Payment display format         | "Opłacone: X zł / Y zł" (paid / total) | Shows committed budget vs. total obligation — user's mental model | Plan |
| Validation rules               | paidAmount <= cost, both >= 0 | Prevents data entry errors that would break Finances aggregation | Plan |
| UI pattern                     | Copy/paste guest CRUD structure | Fastest implementation; users learn one pattern, use everywhere | Plan |
| Language                       | All UI in Polish | Consistent with guests; matches PRD locale | Plan |

## Scope

**In scope:**
- Services table migration (name, cost, paidAmount, notes, deadline, createdAt)
- Server actions: getServices, createService, updateService, deleteService
- API routes: GET /api/services, POST /api/services, DELETE /api/services/:id
- `/services` page with list view
- Add service modal (form with validation)
- Edit service modal (pre-filled form)
- Delete confirmation modal
- Aggregate summary (total services, cost, paid, remaining)
- Dashboard card wiring

**Out of scope:**
- Vendor categories (e.g., "Foto/Wideo", "Kwiaty")
- Contact info (phone, email)
- Payment history (multiple payments per service)
- File uploads (contracts, invoices)
- Email reminders for deadlines

## Architecture / Approach

```
┌─────────────────────────────────────────────────────────────┐
│                     /services page                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ServicesList (client component)                    │   │
│  │  ├─ Service cards (name, paid/total, notes, deadline)│  │
│  │  ├─ Aggregate summary                               │   │
│  │  ├─ AddServiceModal                                 │   │
│  │  ├─ EditServiceModal                                │   │
│  │  └─ DeleteServiceModal                              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │   /api/services route   │
              │   (auth-protected)      │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │   src/lib/db/services   │
              │   (server actions)      │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │   SQLite (Drizzle ORM)  │
              │   services table        │
              └─────────────────────────┘
```

## Phases at a Glance

| Phase     | What it delivers       | Key risk                  |
| --------- | ---------------------- | ------------------------- |
| 1. Schema & Migration | Services table in database | None — standard Drizzle migration |
| 2. Server Actions | CRUD functions with validation | Validation logic (paid <= cost) |
| 3. List + Add Modal | Working create + read flow | Modal form validation |
| 4. Edit + Delete | Full CRUD | Reusing guest pattern correctly |
| 5. Polish & Edge Cases | Empty state, aggregate summary | Polish label consistency |

**Prerequisites:** F-01 (auth-scaffold), F-02 (database-scaffold) — both complete. Guest CRUD (`add-first-guest`) complete — pattern to copy.

**Estimated effort:** ~2-3 sessions across 5 phases (copy/paste pattern reduces unknowns).

## Open Risks & Assumptions

- **Assumption**: Integer storage for costs (in zł, rounded) is sufficient — no groszy decimals needed. If services require decimal precision, the schema needs `real` type instead of `integer`.
- **Risk**: Deadline as text (YYYY-MM-DD) works for MVP, but date comparisons/sorting may need SQLite date functions later.
- **Risk**: Copy/paste errors — adapting guest components for services requires careful field renaming (e.g., "guest" → "service", "spouse" → "cost breakdown").

## Success Criteria (Summary)

- User can add a service with name, cost, paid amount, notes, and deadline
- Service list shows paid/total breakdown on each card
- Edit and delete work via modals
- Dashboard "Usługi" card navigates to `/services`
- All UI labels in Polish, matching guest page conventions
