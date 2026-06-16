# Catering Menu Implementation Plan

## Overview

Implement full catering menu management allowing users to set cost per plate and add/edit/delete menu items. Each menu item has a name, type (przekąska/danie ciepłe/przystawka/inne), optional custom type text, and vegetarian flag. The system calculates total catering cost as `costPerPlate × guestCount` for Finances aggregation.

This follows the exact pattern established in `add-first-service` and `add-first-guest` — same architecture, same component structure, same Polish UI conventions — adapted for catering-specific fields.

## Current State Analysis

**What exists:**
- SQLite database with Drizzle ORM (`src/lib/db/`)
- `guests` table with full CRUD (S-01 complete)
- `services` table with full CRUD (S-04 complete)
- Server actions pattern in `src/lib/db/guests.ts` and `src/lib/db/services.ts`
- API routes pattern in `src/app/api/guests/route.ts` and `src/app/api/services/route.ts`
- Client-side modal components for CRUD (`add-guest-modal.tsx`, `edit-guest-modal.tsx`, `add-service-modal.tsx`, etc.)
- List components with cards and aggregate summary (`guest-list.tsx`, `services-list.tsx`)
- Dashboard with "Finances" card placeholder (from empty-dashboard)
- Dashboard with "Services" and "Guests" cards (functional)

**What's missing:**
- No `catering` table for cost-per-plate settings
- No `cateringMenuItems` table
- No `/catering` route or components
- No CRUD operations for catering
- Dashboard "Finances" card is non-functional (static placeholder)

**Key constraints:**
- Follow the guest/service CRUD pattern exactly — no new architectural decisions needed
- All UI labels in Polish (consistent with guests/services)
- Cost per plate is global (one value for all dishes), not per menu item
- Total catering cost = costPerPlate × guestCount (from guests table)

## Desired End State

After implementation:
- Users can set/edit the catering cost per plate (single value)
- Users can add menu items with name, type dropdown (przekąska/danie ciepłe/przystawka/inne), custom type text (if "Inne" selected), and vegetarian checkbox
- Users can edit or delete existing menu items
- Catering page shows aggregate summary: total menu items + total catering cost (costPerPlate × guestCount)
- Dashboard "Catering" card becomes functional (or Finances card updated to show catering info)
- Cost aggregation ready for S-05 (Finances summary)

### Key Discoveries:

- Server actions pattern: `src/lib/db/guests.ts:8-50` — copy/paste for catering
- API route pattern: `src/app/api/guests/route.ts` — copy/paste for catering
- Modal component pattern: `src/components/add-guest-modal.tsx` — adapt for catering fields
- List component: `src/components/services-list.tsx` — adapt card layout for menu items (no per-item cost)
- Schema pattern: `src/lib/db/schema.ts:28-39` — add catering tables after services
- Guest count for formula: `SELECT COUNT(*) FROM guests` — already have the data

## What We're NOT Doing

- **Per-item cost tracking** — cost is global (costPerPlate), not per menu item
- **Multiple catering providers** — single cost-per-plate for MVP
- **Dietary filters beyond vegetarian** — vegan, gluten-free, allergens parked for later
- **Menu categories/sections** — flat list of items (no "Main Courses", "Desserts" groupings)
- **Guest count override** — uses actual guest count from database; no manual override
- **Catering payment tracking** — no paidAmount field (unlike services)
- **Visual menu layout** — simple card grid, not a designed menu card

## Implementation Approach

**Phase-based delivery:**
1. Database schema + migration (catering tables)
2. Server actions for CRUD
3. Catering page with cost-per-plate field and menu items list
4. Add/edit/delete modals for menu items
5. Dashboard integration + aggregate summary

**Key architectural decisions:**
- Server actions for all CRUD (matches guest/service pattern)
- Modal for add/edit form (keeps context, standard admin pattern)
- Two-table design: `catering` (settings) + `cateringMenuItems` (menu positions)
- **Full Polish UI** — all labels, buttons, messages in Polish

## Critical Implementation Details

- **Cost per plate**: Single integer field in `catering` table, not per menu item. User can edit it at any time; changes immediately affect total catering cost calculation.
- **Menu item types**: Dropdown with 4 options: "Przekąska", "Danie ciepłe", "Przystawka", "Inne". When "Inne" is selected, show a text input for custom type.
- **Type storage**: `type` column (text, not null) stores the selected value. `customType` column (text, nullable) stores user's custom text when type="Inne".
- **Vegetarian flag**: Simple boolean checkbox `isVege`. Display as 🌱 icon on cards.
- **Card display**: Show name, type badge, 🌱 if vege. Do NOT show cost per item — cost is global.
- **Aggregate summary**: Show total menu items count AND total catering cost (costPerPlate × guestCount).
- **Finances integration**: Total catering cost formula is `costPerPlate × (SELECT COUNT(*) FROM guests)` — this feeds into S-05 aggregation.

---

## Phase 1: Database Schema & Migration

### Overview

Create the `catering` table (single-row settings) and `cateringMenuItems` table.

### Changes Required:

#### 1. Add catering tables to schema

**File**: `src/lib/db/schema.ts`

**Intent**: Add catering table definitions with fields matching the requirements. Export types for use in app code.

**Contract**: Add after the `services` table:

**Catering settings table** (single row):
- `id`: integer primary key (auto-increment) — always 1 for single-row pattern
- `costPerPlate`: integer, not null, default 0 — cost per plate in zł

**Catering menu items table**:
- `id`: integer primary key (auto-increment)
- `name`: text, not null — menu item name (e.g., "Rosół", "Schabowy")
- `type`: text, not null — one of: "przekąska", "danie_ciepłe", "przystawka", "inne"
- `customType`: text, nullable — user's custom type text when type="inne"
- `isVege`: integer boolean, not null, default 0 — vegetarian flag
- `createdAt`: integer timestamp, not null, default now

Export types: `Catering`, `NewCatering`, `CateringMenuItem`, `NewCateringMenuItem`

### Success Criteria:

#### Automated Verification:

- [ ] 1.1 Schema compiles: `npm run typecheck`
- [ ] 1.2 Migration generates: `npm run db:generate`
- [ ] 1.3 Migration applies: `npm run db:migrate`

#### Manual Verification:

- [ ] 1.4 Verify tables exist in database: `npm run db:studio` shows `catering` and `cateringMenuItems` tables
- [ ] 1.5 Verify columns match design (catering: id, costPerPlate; menuItems: id, name, type, customType, isVege, createdAt)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Server Actions for Catering CRUD

### Overview

Create server actions for catering settings and menu items CRUD following the pattern in `src/lib/db/guests.ts` and `src/lib/db/services.ts`.

### Changes Required:

#### 1. Create catering actions file

**File**: `src/lib/db/catering.ts`

**Intent**: Centralize catering settings database operations.

**Contract**: Export async functions:
- `getCateringSettings()`: returns `Catering | undefined` — gets the single row
- `updateCateringSettings(data: { costPerPlate: number })`: updates or creates the single row
- `getTotalCateringCost()`: returns number — calculates `costPerPlate × guestCount`

#### 2. Create catering menu items actions file

**File**: `src/lib/db/catering-menu-items.ts`

**Intent**: Centralize menu items database operations.

**Contract**: Export async functions:
- `getMenuItems()`: returns `CateringMenuItem[]` ordered by createdAt
- `createMenuItem(data: NewCateringMenuItem)`: returns created item
- `updateMenuItem(id: number, data: Partial<NewCateringMenuItem>)`: returns updated item
- `deleteMenuItem(id: number)`: returns void, throws if not found

Include validation:
- `name` is required — error if empty
- `type` must be one of the predefined values
- `customType` required if `type === "inne"`

### Success Criteria:

#### Automated Verification:

- [ ] 2.1 TypeScript compiles without errors
- [ ] 2.2 ESLint passes: `npm run lint`

#### Manual Verification:

- [ ] 2.3 Test in db:studio: create catering settings, verify costPerPlate
- [ ] 2.4 Test menu item CRUD: create, update, delete — verify changes persist
- [ ] 2.5 Test validation: try to create with empty name — error shown
- [ ] 2.6 Test validation: try to create with type="inne" but no customType — error shown

**Implementation Note**: Pause for manual confirmation.

---

## Phase 3: API Routes for Catering

### Overview

Create RESTful API routes for catering settings and menu items following the pattern in `src/app/api/guests/route.ts`.

### Changes Required:

#### 1. Create catering settings API route

**File**: `src/app/api/catering/route.ts`

**Intent**: API endpoint for getting/updating catering cost per plate.

**Contract**:
- `GET`: returns current catering settings (costPerPlate)
- `PATCH`: updates costPerPlate (auth required, validation: must be >= 0)
- Auth check via `auth()` from `auth.ts`
- Returns 401 if unauthenticated
- Returns Polish error messages for validation failures

#### 2. Create catering menu items API route

**File**: `src/app/api/catering-menu-items/route.ts`

**Intent**: API endpoint for listing/creating menu items.

**Contract**:
- `GET`: returns all menu items
- `POST`: creates new menu item (auth required, validation)
- Auth check via `auth()` from `auth.ts`
- Returns 401 if unauthenticated
- Returns 400 for validation errors (Polish messages)

#### 3. Create menu item detail API route

**File**: `src/app/api/catering-menu-items/[id]/route.ts`

**Intent**: API endpoint for updating/deleting individual menu items.

**Contract**:
- `PATCH`: updates menu item by ID
- `DELETE`: deletes menu item by ID
- Auth check, validation, Polish error messages

### Success Criteria:

#### Automated Verification:

- [ ] 3.1 TypeScript compiles: `npm run typecheck`
- [ ] 3.2 Linting passes: `npm run lint`
- [ ] 3.3 Build succeeds: `npm run build`

#### Manual Verification:

- [ ] 3.4 Test GET /api/catering — returns current settings
- [ ] 3.5 Test PATCH /api/catering — updates costPerPlate
- [ ] 3.6 Test GET /api/catering-menu-items — returns menu items
- [ ] 3.7 Test POST /api/catering-menu-items — creates item
- [ ] 3.8 Test PATCH/DELETE /api/catering-menu-items/:id — updates/deletes item

**Implementation Note**: Pause for manual confirmation.

---

## Phase 4: Catering Page with Cost Field and Menu Items List

### Overview

Build the `/catering` route with cost-per-plate editable field at top and menu items list below.

### Changes Required:

#### 1. Create catering page

**File**: `src/app/catering/page.tsx`

**Intent**: Server component that fetches catering settings and menu items, renders page.

**Contract**: 
- Server component (async, fetches data)
- Renders header with "Catering" title
- Renders cost-per-plate editable field at top
- Renders menu items list (via client component)
- Renders aggregate summary at bottom (total items + total catering cost)
- Structure mirrors `src/app/guests/page.tsx` and `src/app/services/page.tsx`

#### 2. Create catering page client component

**File**: `src/app/catering/catering-page-client.tsx`

**Intent**: Client component handling interactivity (cost field editing, modals).

**Contract**:
- `use client` directive
- State for: costPerPlate, menuItems, isLoading, editing cost field
- Fetches catering settings and menu items on mount
- Renders cost-per-plate editable field (always visible)
- Renders menu items list component
- Renders add/edit/delete modals
- Refresh callback after mutations

#### 3. Create cost-per-plate editable field component

**File**: `src/components/catering-cost-field.tsx`

**Intent**: Editable field for setting catering cost per plate.

**Contract**:
- Client component
- Props: `costPerPlate: number`, `onUpdate: (newCost: number) => void`
- Shows current cost with "zł" label
- Edit button opens inline edit or modal
- Validation: cost >= 0
- Polish labels: "Koszt za talerz", "Zapisz", "Anuluj"

#### 4. Create menu items list component

**File**: `src/components/catering-menu-items-list.tsx`

**Intent**: Display menu items in a grid of cards.

**Contract**:
- Client component with `use client` directive
- Props: `menuItems: CateringMenuItem[]`, `onRefresh: () => void`
- Each card shows:
  - Item name (bold)
  - Type badge (przekąska/danie ciepłe/przystawka/inne)
  - 🌱 icon if isVege
  - Action buttons: Edit, Delete
- Add button at top: "Dodaj danie"
- All labels in Polish

### Success Criteria:

#### Automated Verification:

- [ ] 4.1 TypeScript compiles: `npm run typecheck`
- [ ] 4.2 Linting passes: `npm run lint`
- [ ] 4.3 Build succeeds: `npm run build`

#### Manual Verification:

- [ ] 4.4 Navigate to `/catering` from dashboard
- [ ] 4.5 Cost-per-plate field displays and is editable
- [ ] 4.6 Click "Dodaj danie" — modal opens
- [ ] 4.7 Fill form and submit — menu item appears in list
- [ ] 4.8 Aggregate summary shows total items + total catering cost
- [ ] 4.9 Empty state shows when no menu items exist (all in Polish)

**Implementation Note**: Pause for manual confirmation.

---

## Phase 5: Add/Edit/Delete Modals for Menu Items

### Overview

Add ability to create, edit, and delete menu items with modals following the guest/service pattern.

### Changes Required:

#### 1. Create add menu item modal

**File**: `src/components/add-catering-menu-item-modal.tsx`

**Intent**: Modal dialog with form for adding new menu items.

**Contract**:
- Client component with `use client` directive
- Props: `isOpen: boolean`, `onClose: () => void`, `onAdd: () => void`
- Form fields (all labels in Polish):
  - Nazwa dania (required, text input) — placeholder: "np. Rosół, Schabowy"
  - Typ dania (required, dropdown): "Przekąska", "Danie ciepłe", "Przystawka", "Inne"
  - Custom type text (shown only if "Inne" selected, required when shown)
  - Czy wegetariańskie? (checkbox, default unchecked)
- Submit button: "Dodaj danie"
- Cancel button: "Anuluj"
- Validation:
  - Name required — error: "Nazwa dania jest wymagana"
  - Type required — dropdown always has value
  - Custom type required if "Inne" — error: "Wpisz własny typ dania"
- Uses API route for submission (POST to `/api/catering-menu-items`)
- Closes modal on success, shows error on failure

#### 2. Create edit menu item modal

**File**: `src/components/edit-catering-menu-item-modal.tsx`

**Intent**: Modal dialog pre-populated with menu item data for editing.

**Contract**:
- Client component
- Props: `menuItem: CateringMenuItem | null`, `isOpen: boolean`, `onClose: () => void`, `onSave: () => void`
- Same form fields as add modal, pre-filled with menu item data
- Submit button: "Zapisz zmiany"
- Cancel button: "Anuluj"
- Same validation as add modal
- Calls update API route

#### 3. Create delete confirmation modal

**File**: `src/components/delete-catering-menu-item-modal.tsx`

**Intent**: Confirmation dialog before deleting a menu item.

**Contract**:
- Client component
- Props: `menuItemName: string`, `isOpen: boolean`, `onClose: () => void`, `onConfirm: () => void`
- Message: "Czy na pewno chcesz usunąć danie: {menuItemName}?"
- Warning: "Tej operacji nie można cofnąć."
- Delete button (red): "Usuń"
- Cancel button: "Anuluj"

#### 4. Wire up action buttons in list component

**File**: `src/components/catering-menu-items-list.tsx`

**Intent**: Connect edit and delete buttons to their modals.

**Contract**:
- Add state for active menu item and open modal type
- Edit button opens edit modal with selected menu item
- Delete button opens delete confirmation modal
- Refresh menu items list after successful edit/delete

### Success Criteria:

#### Automated Verification:

- [ ] 5.1 TypeScript compiles: `npm run typecheck`
- [ ] 5.2 Linting passes: `npm run lint`

#### Manual Verification:

- [ ] 5.3 Click "Edytuj" on a menu item — modal opens with data pre-filled
- [ ] 5.4 Modify and save — changes appear in list
- [ ] 5.5 Click "Usuń" — confirmation modal appears
- [ ] 5.6 Confirm delete — menu item removed from list
- [ ] 5.7 Type dropdown works correctly, "Inne" reveals custom text field
- [ ] 5.8 Vegetarian checkbox toggles correctly
- [ ] 5.9 Aggregate summary updates after mutations

**Implementation Note**: Pause for manual confirmation.

---

## Phase 6: Dashboard Integration & Aggregate Summary

### Overview

Wire up the dashboard card and implement aggregate summary showing total catering cost.

### Changes Required:

#### 1. Create catering dashboard card component

**File**: `src/components/catering-dashboard-card.tsx`

**Intent**: Dashboard card for catering area, linking to `/catering`.

**Contract**:
- Server component (async, fetches catering settings and guest count)
- Renders "Catering" title
- Filled state (has menu items):
  - Shows: number of menu items
  - Shows: cost per plate
  - Shows: total catering cost (costPerPlate × guestCount)
- Empty state (no menu items):
  - Shows: "Nie masz jeszcze żadnych dań."
  - Shows: "Dodaj pierwsze danie, aby rozpocząć menu!"
- Button: "Zarządzaj menu" linking to `/catering`
- All labels in Polish

#### 2. Wire dashboard link in main page

**File**: `src/app/page.tsx`

**Intent**: Add catering dashboard card to the dashboard grid.

**Contract**: 
- Import `CateringDashboardCard` component
- Add to the grid layout (4th card alongside Guests, Services, Timeline)
- Or replace the static Finances card with dynamic catering card

#### 3. Implement aggregate summary in catering page

**File**: `src/components/catering-menu-items-list.tsx` (or separate component)

**Intent**: Show totals at bottom of menu items list.

**Contract**: Below the cards grid, add a summary section:
- Total menu items count: "Liczba dań: {count}"
- Cost per plate: "Koszt za talerz: {cost} zł"
- Total guests: "Liczba gości: {count}"
- Total catering cost: "Łączny koszt cateringu: {total} zł"

### Success Criteria:

#### Automated Verification:

- [ ] 6.1 TypeScript compiles: `npm run typecheck`
- [ ] 6.2 Linting passes: `npm run lint`
- [ ] 6.3 Build succeeds: `npm run build`

#### Manual Verification:

- [ ] 6.4 Dashboard shows catering card with correct data
- [ ] 6.5 Clicking catering card navigates to `/catering`
- [ ] 6.6 Aggregate summary shows correct totals (items, cost/plate, guests, total)
- [ ] 6.7 Empty state shows when no menu items exist
- [ ] 6.8 All Polish labels display correctly

**Implementation Note**: Pause for manual confirmation.

---

## Phase 7: Polish & Edge Cases

### Overview

Handle edge cases and polish the user experience.

### Changes Required:

#### 1. Empty state

**File**: `src/components/catering-menu-items-list.tsx`

**Intent**: Show helpful message when no menu items exist.

**Contract**: When `menuItems.length === 0`:
- Show illustration or icon (🍽️ or 🍴)
- Message: "Nie masz jeszcze żadnych dań."
- Subtext: "Dodaj pierwsze danie, aby rozpocząć menu!"
- "Dodaj danie" button
- All text in Polish

#### 2. Form validation

**File**: `src/components/add-catering-menu-item-modal.tsx` and `src/components/edit-catering-menu-item-modal.tsx`

**Intent**: Validate form before submission.

**Contract**:
- Name is required — show error if empty: "Nazwa dania jest wymagana"
- Type is required — dropdown always has value
- Custom type required if "Inne" — error: "Wpisz własny typ dania"
- Show errors in a banner at the top of the form (red background, Polish text)

#### 3. Loading states

**File**: All modal components and cost field

**Intent**: Show loading state during submission.

**Contract**:
- Submit button shows spinner or "Dodawanie..." / "Zapisywanie..." text
- Button disabled during submission
- Modal cannot be closed during submission

#### 4. Cost-per-plate validation

**File**: `src/components/catering-cost-field.tsx`

**Intent**: Validate cost-per-plate field.

**Contract**:
- Cost must be >= 0 — error: "Koszt nie może być ujemny"
- Show error inline or in banner

#### 5. Type dropdown with "Inne" conditional logic

**File**: `src/components/add-catering-menu-item-modal.tsx` and `src/components/edit-catering-menu-item-modal.tsx`

**Intent**: Show/hide custom type field based on dropdown selection.

**Contract**:
- Dropdown options: "Przekąska", "Danie ciepłe", "Przystawka", "Inne"
- When "Inne" is selected, show text input for custom type
- When other option is selected, hide custom type field
- Clear custom type value when switching away from "Inne"

### Success Criteria:

#### Automated Verification:

- [ ] 7.1 No console errors in browser dev tools

#### Manual Verification:

- [ ] 7.2 Try to submit empty form — validation error appears
- [ ] 7.3 Submit with type="Inne" but no custom type — error shown
- [ ] 7.4 Submit with valid data — loading state shows, then success
- [ ] 7.5 Delete last menu item — empty state appears
- [ ] 7.6 All Polish labels display correctly
- [ ] 7.7 Aggregate summary shows correct totals
- [ ] 7.8 Cost-per-plate field validates correctly (>= 0)
- [ ] 7.9 Type dropdown conditional logic works correctly

**Implementation Note**: Pause for manual confirmation.

---

## Testing Strategy

### Unit Tests:

None for MVP — manual testing only per user decision (matches add-first-guest/add-first-service approach).

### Integration Tests:

None for MVP.

### Manual Testing Steps:

1. **Catering settings flow**:
   - Navigate to `/catering`
   - Edit cost per plate — verify it saves
   - Verify cost >= 0 validation

2. **Create menu item flow**:
   - Click "Dodaj danie"
   - Add item with name only — verify it appears
   - Add item with type="Przekąska" — verify type badge shows
   - Add item with type="Inne" + custom type — verify custom type displays
   - Add item with isVege checked — verify 🌱 icon shows

3. **Edit flow**:
   - Edit a menu item to change type
   - Verify type badge updates
   - Edit to toggle vegetarian flag
   - Verify 🌱 icon toggles

4. **Delete flow**:
   - Delete a menu item
   - Verify item removed from list
   - Verify aggregate totals update

5. **Aggregate summary**:
   - Verify total items count is correct
   - Verify total catering cost = costPerPlate × guestCount
   - Add a guest — verify total updates
   - Change costPerPlate — verify total updates

6. **Edge cases**:
   - Submit with empty name — error: "Nazwa dania jest wymagana"
   - Submit with type="Inne" but no custom type — error shown
   - Delete last menu item — empty state shown
   - Set costPerPlate to 0 — allowed (free catering)
   - Set costPerPlate to negative — error shown

7. **Dashboard integration**:
   - Verify catering card shows on dashboard
   - Verify card data matches catering page
   - Verify clicking card navigates to `/catering`

## Performance Considerations

- Menu items list assumed <100 for MVP — no pagination needed
- All menu items loaded in single query
- Cost-per-plate is single value — cached in component state
- Guest count query is simple COUNT(*) — negligible cost
- Total catering cost calculated at render time — O(1) operation

## Migration Notes

- Existing guests, services, users tables unaffected
- No data migration needed (new tables, no existing data)
- Rollback: `drizzle-kit rollback` removes catering tables
- Single-row pattern for `catering` table: insert row with id=1 on first settings save

## References

- Guest CRUD pattern: `context/changes/add-first-guest/plan.md`
- Service CRUD pattern: `context/changes/add-first-service/plan.md`
- Server actions: `src/lib/db/guests.ts`, `src/lib/db/services.ts`
- API routes: `src/app/api/guests/route.ts`, `src/app/api/services/route.ts`
- Modal components: `src/components/add-guest-modal.tsx`, `src/components/add-service-modal.tsx`
- List components: `src/components/guest-list.tsx`, `src/components/services-list.tsx`
- Schema pattern: `src/lib/db/schema.ts:28-39`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Database Schema & Migration

#### Automated

- [x] 1.1 Schema compiles: `npm run typecheck` — e2356e1
- [x] 1.2 Migration generates: `npm run db:generate` — e2356e1
- [x] 1.3 Migration applies: `npm run db:migrate` — e2356e1

#### Manual

- [ ] 1.4 Verify tables exist in database: `npm run db:studio` shows `catering` and `cateringMenuItems` tables
- [ ] 1.5 Verify columns match design

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

### Phase 2: Server Actions for Catering CRUD

#### Automated

- [x] 2.1 TypeScript compiles without errors — 149e13b
- [x] 2.2 ESLint passes: `npm run lint` — 149e13b

#### Manual

- [ ] 2.3 Test in db:studio: create catering settings, verify costPerPlate
- [ ] 2.4 Test menu item CRUD: create, update, delete — verify changes persist
- [ ] 2.5 Test validation: try to create with empty name — error shown
- [ ] 2.6 Test validation: try to create with type="inne" but no customType — error shown

### Phase 3: API Routes for Catering

#### Automated

- [x] 3.1 TypeScript compiles: `npm run typecheck` — ba31948
- [x] 3.2 Linting passes: `npm run lint` — ba31948
- [x] 3.3 Build succeeds: `npm run build` — ba31948

#### Manual

- [ ] 3.4 Test GET /api/catering — returns current settings
- [ ] 3.5 Test PATCH /api/catering — updates costPerPlate
- [ ] 3.6 Test GET /api/catering-menu-items — returns menu items
- [ ] 3.7 Test POST /api/catering-menu-items — creates item
- [ ] 3.8 Test PATCH/DELETE /api/catering-menu-items/:id — updates/deletes item

### Phase 4: Catering Page with Cost Field and Menu Items List

#### Automated

- [x] 4.1 TypeScript compiles: `npm run typecheck`
- [x] 4.2 Linting passes: `npm run lint`
- [x] 4.3 Build succeeds: `npm run build`

#### Manual

- [ ] 4.4 Navigate to `/catering` from dashboard
- [ ] 4.5 Cost-per-plate field displays and is editable
- [ ] 4.6 Click "Dodaj danie" — modal opens
- [ ] 4.7 Fill form and submit — menu item appears in list
- [ ] 4.8 Aggregate summary shows total items + total catering cost
- [ ] 4.9 Empty state shows when no menu items exist

### Phase 5: Add/Edit/Delete Modals for Menu Items

#### Automated

- [ ] 5.1 TypeScript compiles: `npm run typecheck`
- [ ] 5.2 Linting passes: `npm run lint`

#### Manual

- [ ] 5.3 Click "Edytuj" on a menu item — modal opens with data pre-filled
- [ ] 5.4 Modify and save — changes appear in list
- [ ] 5.5 Click "Usuń" — confirmation modal appears
- [ ] 5.6 Confirm delete — menu item removed from list
- [ ] 5.7 Type dropdown works correctly, "Inne" reveals custom text field
- [ ] 5.8 Vegetarian checkbox toggles correctly
- [ ] 5.9 Aggregate summary updates after mutations

### Phase 6: Dashboard Integration & Aggregate Summary

#### Automated

- [ ] 6.1 TypeScript compiles: `npm run typecheck`
- [ ] 6.2 Linting passes: `npm run lint`
- [ ] 6.3 Build succeeds: `npm run build`

#### Manual

- [ ] 6.4 Dashboard shows catering card with correct data
- [ ] 6.5 Clicking catering card navigates to `/catering`
- [ ] 6.6 Aggregate summary shows correct totals (items, cost/plate, guests, total)
- [ ] 6.7 Empty state shows when no menu items exist
- [ ] 6.8 All Polish labels display correctly

### Phase 7: Polish & Edge Cases

#### Automated

- [ ] 7.1 No console errors in browser dev tools

#### Manual

- [ ] 7.2 Try to submit empty form — validation error appears
- [ ] 7.3 Submit with type="Inne" but no custom type — error shown
- [ ] 7.4 Submit with valid data — loading state shows, then success
- [ ] 7.5 Delete last menu item — empty state appears
- [ ] 7.6 All Polish labels display correctly
- [ ] 7.7 Aggregate summary shows correct totals
- [ ] 7.8 Cost-per-plate field validates correctly (>= 0)
- [ ] 7.9 Type dropdown conditional logic works correctly
