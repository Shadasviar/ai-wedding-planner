# Catering Menu — Plan Brief

> Full plan: `context/changes/add-catering-menu/plan.md`
> Research: N/A (pattern copied from add-first-service)

## What & Why

Implement catering menu management: users can set a global cost-per-plate and add/edit/delete menu items. Each item has name, type (przekąska/danie ciepłe/przystawka/inne), optional custom type, and vegetarian flag. Total catering cost = costPerPlate × guestCount, feeding into the Finances summary (S-05).

This completes the catering feature (S-07) from the roadmap, enabling the cost aggregation wedge of the product.

## Starting Point

The codebase has full CRUD for guests (S-01) and services (S-04) using a consistent pattern:
- Drizzle ORM + SQLite schema with TypeScript types
- Server actions in `src/lib/db/*.ts`
- RESTful API routes at `/api/[entity]`
- Client-side modals for add/edit/delete
- List components with cards and aggregate summaries
- All UI in Polish

Catering follows this exact pattern with two new tables and adapted fields.

## Desired End State

After this plan:
- Users can set/edit catering cost-per-plate (single global value)
- Users can add menu items with name, type dropdown, custom type (if "Inne"), and vegetarian checkbox
- Users can edit and delete menu items
- Catering page shows aggregate summary: total items + total cost (costPerPlate × guestCount)
- Dashboard card links to `/catering`
- Data model ready for S-05 (Finances aggregation)

## Key Decisions Made

| Decision                       | Choice            | Why (1 sentence)  | Source           |
| ------------------------------ | ----------------- | ----------------- | ---------------- |
| Cost model | Cost per plate only (global) | Catering is priced per plate, not per dish; single value matches provider contracts | Plan (user spec) |
| Menu item types | 4 options: Przekąska, Danie ciepłe, Przystawka, Inne | Matches ticket spec; "Inne" with custom text handles edge cases | Plan (user spec) |
| Custom type handling | Show text input when "Inne" selected | Preserves category structure while allowing flexibility | Plan (user spec) |
| Dietary flags | Vegetarian only (🌱 checkbox) | 80% use case; other flags (vegan, gluten-free) parked for later | Plan (user spec) |
| CRUD scope | Full CRUD (add, edit, delete) | Matches guests/services pattern; users need to fix mistakes | Plan (user spec) |
| Dashboard display | Show cost aggregation | Feeds into Finances summary; shows budget impact | Plan (user spec) |
| List view | Cost shown once at bottom, not per item | Matches catering mental model — one price for all dishes | Plan (user spec) |
| Finances formula | costPerPlate × guestCount | Realistic catering cost; uses actual guest count from DB | Plan (user spec) |

## Scope

**In scope:**
- Two new tables: `catering` (settings) and `cateringMenuItems` (menu positions)
- CRUD API routes for menu items + settings endpoint
- `/catering` page with cost-per-plate field and menu items list
- Add/edit/delete modals for menu items
- Type dropdown with "Inne" → custom text conditional logic
- Vegetarian checkbox (🌱 icon on cards)
- Aggregate summary: total items + total catering cost
- Dashboard card linking to `/catering`

**Out of scope:**
- Per-item cost tracking (cost is global)
- Multiple catering providers
- Dietary flags beyond vegetarian (vegan, gluten-free, allergens)
- Menu categories/sections (flat list)
- Guest count override (uses actual DB count)
- Payment tracking (no paidAmount field)
- Visual menu card layout

## Architecture / Approach

Two-table design:
1. **`catering`** — single-row settings table storing `costPerPlate`
2. **`cateringMenuItems`** — menu items with: name, type (enum), customType (nullable), isVege (boolean)

Pattern: Copy services CRUD architecture exactly:
- Server actions → API routes → client components → modals → list with cards
- Polish UI conventions established in guests/services
- Aggregate summary at bottom (like services list)

Data flow for Finances:
```
Total catering cost = (SELECT costPerPlate FROM catering) × (SELECT COUNT(*) FROM guests)
```

## Phases at a Glance

| Phase     | What it delivers       | Key risk                  |
| --------- | ---------------------- | ------------------------- |
| 1. Schema & Migration | `catering` + `cateringMenuItems` tables | Migration conflicts if schema changed mid-phase |
| 2. Server Actions | CRUD functions for both tables | Single-row pattern for `catering` table needs careful handling |
| 3. API Routes | RESTful endpoints for catering | Auth check must match existing pattern |
| 4. Catering Page | `/catering` with cost field + list | Conditional "Inne" → custom type logic |
| 5. Modals | Add/edit/delete with validation | Type dropdown conditional rendering |
| 6. Dashboard | Catering card + aggregate summary | Guest count query for total formula |
| 7. Polish | Validation, loading states, edge cases | "Inne" validation (custom type required) |

**Prerequisites:** F-01 (auth), F-02 (database) — both complete
**Estimated effort:** ~2-3 sessions across 7 phases

## Open Risks & Assumptions

- **Single-row pattern**: `catering` table uses id=1 convention for single settings row — must handle "upsert" logic (create if missing, update if exists)
- **Guest count formula**: Assumes `SELECT COUNT(*) FROM guests` is the correct multiplier — user confirmed this is the spec
- **Type enum storage**: Storing type as text (not integer enum) — easier to query, but no DB-level constraint
- **Polish labels**: All UI in Polish — need correct translations for "przekąska", "przystawka", etc.

## Success Criteria (Summary)

- **Schema**: Two new tables created and migrated
- **CRUD**: Full add/edit/delete for menu items; edit for cost-per-plate
- **Page**: `/catering` shows cost field, menu items list, aggregate summary
- **Dashboard**: Card links to `/catering` with correct data
- **Formula**: Total catering cost = costPerPlate × guestCount (verified manually)
- **Polish**: All labels, errors, buttons in Polish
