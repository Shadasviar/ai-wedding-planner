# Guest Management (Add First Guest) Implementation Plan

## Overview

Implement full guest management functionality allowing users to add, view, edit, and delete wedding guests. Each guest record tracks the guest's name, their spouse/partner name ("małżonek" or "osoba towarzysząca"), and number of children. The system calculates total persons per guest and displays aggregate children count for catering planning.

## Current State Analysis

**What exists:**
- SQLite database with Drizzle ORM (only `users` table)
- Dashboard with "Guests" card linking to `/guests` (non-functional)
- Server actions pattern established in `src/app/page.tsx` (signOut form action)
- Client-side form pattern in `src/app/login/page.tsx`
- Tailwind CSS styling conventions

**What's missing:**
- No `guests` table in database schema
- No `/guests` route or components
- No CRUD operations for guests

## Desired End State

After implementation:
- Users can add guests with name, spouse/partner name, and children count
- Guest list displays all guests with total persons per guest (1 + spouse + children)
- Bottom of list shows aggregate totals: total guests, total spouses, total children, total seats
- Users can edit or delete existing guests
- Dashboard "Guests" card becomes functional

### Key Discoveries:

- Server actions pattern already in use (`src/app/page.tsx:19-22`) — use same pattern for guest CRUD
- Form styling conventions established in login page (`src/app/login/page.tsx:30-72`)
- Drizzle schema pattern: `src/lib/db/schema.ts` with TypeScript types exported
- Database path: `.data/sqlite.db` with migrations via `drizzle-kit`

## What We're NOT Doing

- RSVP tracking or status (future feature)
- Guest categories/groupings (e.g., "bride side", "groom side")
- Email invitations or notifications
- Import/export functionality
- Pagination (assume <100 guests for MVP)

## Implementation Approach

**Phase-based delivery:**
1. Database schema + migration
2. Server actions for CRUD
3. Guest list page with add modal
4. Edit/delete functionality
5. Dashboard integration

**Key architectural decisions:**
- Server actions for all CRUD (matches existing auth pattern)
- Modal for add/edit form (keeps context, standard admin pattern)
- Computed fields (total persons) calculated at read time, not stored
- **Full Polish UI** — all labels, buttons, messages, and placeholders in Polish

## Critical Implementation Details

- **Person calculation**: `totalPersons = 1 (guest) + 1 (has spouse? 1:0) + childrenCount`. The "1" is always the primary guest, spouse adds 1 if present, children add their count.
- **Aggregate summary**: Bottom of list shows sum of all children — critical for catering menu planning (children often have separate menu).
- **Spouse field label**: Use "małżonek" (spouse) as primary label with "osoba towarzysząca" (partner) as placeholder hint for unmarried partners.

## Phase 1: Database Schema & Migration

### Overview

Create the `guests` table with proper types and constraints.

### Changes Required:

#### 1. Add guests table to schema

**File**: `src/lib/db/schema.ts`

**Intent**: Add the guests table definition with fields for name, spouse name, and children count. Export types for use in app code.

**Contract**: Add after the `users` table:
- `id`: integer primary key (auto-increment)
- `name`: text, not null — primary guest name
- `spouseName`: text, nullable — spouse/partner name (null means coming alone)
- `childrenCount`: integer, not null, default 0
- `createdAt`: timestamp, not null, default now
- Export `Guest` and `NewGuest` types

### Success Criteria:

#### Automated Verification:

- [ ] Schema compiles: `npm run typecheck`
- [ ] Migration generates: `npm run db:generate`
- [ ] Migration applies: `npm run db:migrate`

#### Manual Verification:

- Verify table exists in database: `npm run db:studio` shows `guests` table
- Verify columns match design (name, spouseName, childrenCount, createdAt)

---

## Phase 2: Server Actions for Guest CRUD

### Overview

Create server actions for create, read, update, delete operations following the pattern established in `src/app/page.tsx`.

### Changes Required:

#### 1. Create guest actions file

**File**: `src/lib/db/guests.ts`

**Intent**: Centralize all guest database operations with proper type safety and error handling.

**Contract**: Export four async functions:
- `getGuests()`: returns `Guest[]` ordered by createdAt
- `createGuest(data: NewGuest)`: returns created `Guest`
- `updateGuest(id: number, data: Partial<NewGuest>)`: returns updated `Guest`
- `deleteGuest(id: number)`: returns void, throws if not found

### Success Criteria:

#### Automated Verification:

- TypeScript compiles without errors
- ESLint passes: `npm run lint`

#### Manual Verification:

- Test in db:studio: create a guest, verify it appears
- Test update: modify a guest, verify changes persist
- Test delete: remove a guest, verify it's gone

---

## Phase 3: Guest List Page with Add Modal

### Overview

Build the `/guests` route with a list view and modal form for adding guests.

### Changes Required:

#### 1. Create guests page

**File**: `src/app/guests/page.tsx`

**Intent**: Server component that fetches guests and renders list with add button.

**Contract**: 
- Server component (async, fetches data)
- Renders header with "Goście" title and "Dodaj gościa" button
- Renders guest list (or empty state if no guests)
- Renders aggregate summary at bottom (total children count)

#### 2. Create guest list component

**File**: `src/components/guest-list.tsx`

**Intent**: Display guests in a grid of cards, showing name, spouse status, children, and total persons.

**Contract**: 
- Client component (for interactivity)
- Props: `guests: Guest[]`
- Each card shows:
  - Guest name (bold)
  - Spouse: "Małżonek: {name}" or "Osoba towarzysząca: {name}" or nothing if solo
  - Children: "Dzieci: {count}"
  - Total: "Łącznie: {total} osób" (1 + spouse + children)
- Action buttons: Edit (pencil icon), Delete (trash icon)
- All labels in Polish

#### 3. Create add guest modal

**File**: `src/components/add-guest-modal.tsx`

**Intent**: Modal dialog with form for adding new guests.

**Contract**:
- Client component with `use client` directive
- Props: `isOpen: boolean`, `onClose: () => void`, `onAdd: () => void`
- Form fields (all labels in Polish):
  - Imię i nazwisko (required, text input)
  - Małżonek / Osoba towarzysząca (optional, text input)
  - Liczba dzieci (optional, number input, min: 0, default: 0)
- Submit button: "Dodaj gościa"
- Cancel button: "Anuluj"
- Uses server action for submission
- Closes modal on success, shows error on failure

#### 4. Wire dashboard link

**File**: `src/app/page.tsx`

**Intent**: Remove `e.preventDefault()` from DashboardCard, allow navigation to `/guests`.

**Contract**: Update the Guests DashboardCard:
- Remove `onClick={(e) => e.preventDefault()}`
- Change `href="/guests"` (already correct)
- Button should now navigate instead of being disabled

### Success Criteria:

#### Automated Verification:

- TypeScript compiles: `npm run typecheck`
- Linting passes: `npm run lint`
- Build succeeds: `npm run build`

#### Manual Verification:

- Navigate to `/guests` from dashboard
- Click "Dodaj gościa" — modal opens
- Fill form and submit — guest appears in list
- Aggregate summary updates with new totals
- Empty state shows when no guests exist (all in Polish)

---

## Phase 4: Edit & Delete Functionality

### Overview

Add ability to edit existing guests and delete them with confirmation.

### Changes Required:

#### 1. Create edit guest modal

**File**: `src/components/edit-guest-modal.tsx`

**Intent**: Modal dialog pre-populated with guest data for editing.

**Contract**:
- Client component
- Props: `guest: Guest | null`, `isOpen: boolean`, `onClose: () => void`, `onSave: () => void`
- Same form fields as add modal, pre-filled
- Submit button: "Zapisz zmiany"
- Cancel button: "Anuluj"
- Calls updateGuest server action

#### 2. Create delete confirmation modal

**File**: `src/components/delete-guest-modal.tsx`

**Intent**: Confirmation dialog before deleting a guest.

**Contract**:
- Client component
- Props: `guestName: string`, `isOpen: boolean`, `onClose: () => void`, `onConfirm: () => void`
- Message: "Czy na pewno chcesz usunąć gościa: {guestName}?"
- Warning: "Tej operacji nie można cofnąć."
- Delete button (red): "Usuń"
- Cancel button: "Anuluj"

#### 3. Wire up action buttons

**File**: `src/components/guest-list.tsx`

**Intent**: Connect edit and delete buttons to their modals.

**Contract**:
- Add state for active guest and open modal type
- Edit button opens edit modal with selected guest
- Delete button opens delete confirmation modal
- Refresh guest list after successful edit/delete

### Success Criteria:

#### Automated Verification:

- TypeScript compiles: `npm run typecheck`
- Linting passes: `npm run lint`

#### Manual Verification:

- Click "Edytuj" on a guest — modal opens with data pre-filled
- Modify and save — changes appear in list
- Click "Usuń" — confirmation modal appears
- Confirm delete — guest removed from list
- Aggregate totals update correctly (all UI in Polish)

---

## Phase 5: Polish & Edge Cases

### Overview

Handle edge cases and polish the user experience.

### Changes Required:

#### 1. Empty state

**File**: `src/components/guest-list.tsx`

**Intent**: Show helpful message when no guests exist.

**Contract**: When `guests.length === 0`:
- Show illustration or icon
- Message: "Nie masz jeszcze żadnych gości."
- Subtext: "Dodaj pierwszego gościa, aby rozpocząć listę!"
- "Dodaj gościa" button
- All text in Polish

#### 2. Form validation

**File**: `src/components/add-guest-modal.tsx` and `src/components/edit-guest-modal.tsx`

**Intent**: Validate form before submission.

**Contract**:
- Name is required — show error if empty (Polish message: "Imię i nazwisko jest wymagane")
- Children count must be >= 0 — error: "Liczba dzieci nie może być ujemna"
- Spouse name is optional
- Show inline error messages below fields in Polish

#### 3. Loading states

**File**: All modal components

**Intent**: Show loading state during submission.

**Contract**:
- Submit button shows spinner or "Dodawanie..." / "Zapisywanie..." text
- Button disabled during submission
- Modal cannot be closed during submission

### Success Criteria:

#### Automated Verification:

- No console errors in browser dev tools

#### Manual Verification:

- Try to submit empty form — validation error appears
- Submit with valid data — loading state shows, then success
- Delete last guest — empty state appears
- All Polish labels display correctly

---

## Testing Strategy

### Unit Tests:

None for MVP — manual testing only per user decision.

### Integration Tests:

None for MVP.

### Manual Testing Steps:

1. **Create flow**:
   - Navigate to `/guests`
   - Click "Add Guest"
   - Add guest with name only — verify total = 1
   - Add guest with name + spouse — verify total = 2
   - Add guest with name + spouse + 2 children — verify total = 4
   - Verify aggregate summary at bottom

2. **Edit flow**:
   - Edit a guest to add spouse
   - Verify total updates
   - Edit to remove spouse
   - Verify total updates

3. **Delete flow**:
   - Delete a guest
   - Verify guest removed from list
   - Verify aggregate totals update

4. **Edge cases**:
   - Submit with empty name — error shown
   - Submit with negative children — error shown (if validation implemented)
   - Delete last guest — empty state shown

## Performance Considerations

- Guest list assumed <100 for MVP — no pagination needed
- All guests loaded in single query
- Computed fields (total persons) calculated at render time — negligible cost

## Migration Notes

- Existing users table unaffected
- No data migration needed (new table, no existing data)
- Rollback: `drizzle-kit rollback` removes guests table

## References

- Existing auth pattern: `src/app/page.tsx:19-22`
- Form pattern: `src/app/login/page.tsx:30-72`
- Schema pattern: `src/lib/db/schema.ts:5-10`
- Drizzle docs: `node_modules/next/dist/docs/`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Database Schema & Migration

#### Automated

- [x] 1.1 Schema compiles: `npm run typecheck` — 21c225a
- [x] 1.2 Migration generates: `npm run db:generate` — 21c225a
- [x] 1.3 Migration applies: `npm run db:migrate` — 21c225a

#### Manual

- [x] 1.4 Verify table exists in database: `npm run db:studio` shows `guests` table — 21c225a
- [x] 1.5 Verify columns match design (name, spouseName, childrenCount, createdAt) — 21c225a

### Phase 2: Server Actions for Guest CRUD

#### Automated

- [x] 2.1 TypeScript compiles without errors — b7ff839
- [x] 2.2 ESLint passes: `npm run lint` — b7ff839

#### Manual

- [x] 2.3 Test in db:studio: create a guest, verify it appears — b7ff839
- [x] 2.4 Test update: modify a guest, verify changes persist — b7ff839
- [x] 2.5 Test delete: remove a guest, verify it's gone — b7ff839

### Phase 3: Guest List Page with Add Modal

#### Automated

- [x] 3.1 TypeScript compiles: `npm run typecheck` — 26843d3
- [x] 3.2 Linting passes: `npm run lint` — 26843d3
- [x] 3.3 Build succeeds: `npm run build` — 26843d3

#### Manual

- [x] 3.4 Navigate to `/guests` from dashboard — 26843d3
- [x] 3.5 Click "Add Guest" — modal opens — 26843d3
- [x] 3.6 Fill form and submit — guest appears in list — 26843d3
- [x] 3.7 Aggregate summary updates with new totals — 26843d3
- [x] 3.8 Empty state shows when no guests exist — 26843d3

### Phase 4: Edit & Delete Functionality

#### Automated

- [x] 4.1 TypeScript compiles: `npm run typecheck` — 85bb8ba
- [x] 4.2 Linting passes: `npm run lint` — 85bb8ba

#### Manual

- [x] 4.3 Click edit on a guest — modal opens with data pre-filled — 85bb8ba
- [x] 4.4 Modify and save — changes appear in list — 85bb8ba
- [x] 4.5 Click delete — confirmation modal appears — 85bb8ba
- [x] 4.6 Confirm delete — guest removed from list — 85bb8ba
- [x] 4.7 Aggregate totals update correctly — 85bb8ba

### Phase 5: Polish & Edge Cases

#### Automated

- [x] 5.1 No console errors in browser dev tools — <sha>

#### Manual

- [x] 5.2 Try to submit empty form — validation error appears — <sha>
- [x] 5.3 Submit with valid data — loading state shows, then success — <sha>
- [x] 5.4 Delete last guest — empty state shown — <sha>
- [x] 5.5 All Polish labels display correctly — <sha>
