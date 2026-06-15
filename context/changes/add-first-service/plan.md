# Service Management (Add First Service) Implementation Plan

## Overview

Implement full service (vendor) management functionality allowing users to add, view, edit, and delete wedding services. Each service record tracks the vendor name, total cost, amount already paid, notes, and an optional deadline. The system displays paid/total breakdown for budget tracking.

This follows the exact pattern established in `add-first-guest` — same architecture, same components structure, same Polish UI conventions — adapted for service-specific fields.

## Current State Analysis

**What exists:**
- SQLite database with Drizzle ORM (`src/lib/db/`)
- `users` table for authentication
- `guests` table with full CRUD (add-first-guest complete)
- Server actions pattern in `src/lib/db/guests.ts`
- API routes pattern in `src/app/api/guests/route.ts`
- Client-side modal components for guests (`add-guest-modal.tsx`, `edit-guest-modal.tsx`, `delete-guest-modal.tsx`)
- List component with cards and aggregate summary (`guest-list.tsx`)
- Dashboard with "Services" card placeholder (from empty-dashboard)

**What's missing:**
- No `services` table in database schema
- No `/services` route or components
- No CRUD operations for services
- Dashboard "Services" card is non-functional (links nowhere or is disabled)

**Key constraints:**
- Follow the guest CRUD pattern exactly — no new architectural decisions needed
- All UI labels in Polish (consistent with guests)
- Cards differ from guests: no spouse/partner, no children, no "total persons" calculation
- Services show: name, cost, paid/total breakdown, notes, deadline

## Desired End State

After implementation:
- Users can add services with name, total cost, paid amount, notes, and optional deadline
- Services list displays all vendors with paid/total breakdown (e.g., "Opłacone: 2 000 zł / 10 000 zł")
- Users can edit or delete existing services
- Dashboard "Services" card becomes functional, linking to `/services`
- Aggregate summary at bottom shows: total services, total cost, total paid, total remaining

### Key Discoveries:

- Server actions pattern: `src/lib/db/guests.ts:8-50` — copy/paste for services
- API route pattern: `src/app/api/guests/route.ts` — copy/paste for services
- Modal component pattern: `src/components/add-guest-modal.tsx` — adapt for service fields
- List component: `src/components/guest-list.tsx` — adapt card layout for services
- Schema pattern: `src/lib/db/schema.ts:28-39` — add services table after guests

## What We're NOT Doing

- Vendor categories (e.g., "Foto/Wideo", "Kwiaty") — add in a follow-up slice if needed
- Contact info (phone, email) — parked per low-complexity goal
- Contract status tracking — parked per low-complexity goal
- Payment history (multiple payments per service) — single `paidAmount` field for MVP
- File uploads (contracts, invoices) — explicitly out of scope per PRD Non-Goals

## Implementation Approach

**Phase-based delivery:**
1. Database schema + migration (services table)
2. Server actions for CRUD
3. Services list page with add modal
4. Edit/delete functionality
5. Dashboard integration

**Key architectural decisions:**
- Server actions for all CRUD (matches guest pattern)
- Modal for add/edit form (keeps context, standard admin pattern)
- Computed fields (remaining = total - paid) calculated at read time
- **Full Polish UI** — all labels, buttons, messages in Polish

## Critical Implementation Details

- **Cost/paid validation**: Both `cost` and `paidAmount` are non-negative integers. `paidAmount` cannot exceed `cost` — show error "Opłacona kwota nie może przekraczać całkowitej kwoty" if user tries.
- **Card display**: Show "Opłacone: {paidAmount} zł / {cost} zł" — paid and total, not the remaining. This matches the user's mental model of "what I've committed" vs "total obligation".
- **Deadline format**: Store as `YYYY-MM-DD` text (SQLite doesn't have native date type). Display as "Termin: 12.07.2026" in Polish format (DD.MM.YYYY).
- **Notes field**: Textarea, not single-line input — notes can be multi-line (e.g., "Send playlist by email\nInclude: First dance, Parent dance, Open floor").

---

## Phase 1: Database Schema & Migration

### Overview

Create the `services` table with fields for name, cost, paid amount, notes, and deadline.

### Changes Required:

#### 1. Add services table to schema

**File**: `src/lib/db/schema.ts`

**Intent**: Add the services table definition with fields matching the user requirements. Export types for use in app code.

**Contract**: Add after the `guests` table:
- `id`: integer primary key (auto-increment)
- `name`: text, not null — service/vendor name (e.g., "DJ", "Fotograf")
- `cost`: integer, not null, default 0 — total cost in zł (stored as integer groszy or round zł)
- `paidAmount`: integer, not null, default 0 — amount already paid
- `notes`: text, not null, default '' — user's free-text notes
- `deadline`: text, nullable — optional target date (YYYY-MM-DD)
- `createdAt`: integer timestamp, not null, default now
- Export `Service` and `NewService` types

### Success Criteria:

#### Automated Verification:

- [ ] 1.1 Schema compiles: `npm run typecheck`
- [ ] 1.2 Migration generates: `npm run db:generate`
- [ ] 1.3 Migration applies: `npm run db:migrate`

#### Manual Verification:

- [ ] 1.4 Verify table exists in database: `npm run db:studio` shows `services` table
- [ ] 1.5 Verify columns match design (name, cost, paidAmount, notes, deadline, createdAt)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Server Actions for Service CRUD

### Overview

Create server actions for create, read, update, delete operations following the pattern in `src/lib/db/guests.ts`.

### Changes Required:

#### 1. Create service actions file

**File**: `src/lib/db/services.ts`

**Intent**: Centralize all service database operations with proper type safety and error handling.

**Contract**: Export four async functions:
- `getServices()`: returns `Service[]` ordered by createdAt (or deadline if present)
- `createService(data: NewService)`: returns created `Service`
- `updateService(id: number, data: Partial<NewService>)`: returns updated `Service`
- `deleteService(id: number)`: returns void, throws if not found

Include validation in `createService` and `updateService`:
- `cost >= 0` — error if negative
- `paidAmount >= 0` — error if negative
- `paidAmount <= cost` — error "Opłacona kwota nie może przekraczać całkowitej kwoty"

### Success Criteria:

#### Automated Verification:

- TypeScript compiles without errors
- ESLint passes: `npm run lint`

#### Manual Verification:

- [ ] 2.1 Test in db:studio: create a service, verify it appears
- [ ] 2.2 Test update: modify a service, verify changes persist
- [ ] 2.3 Test delete: remove a service, verify it's gone
- [ ] 2.4 Test validation: try to create with paidAmount > cost — error shown

**Implementation Note**: Pause for manual confirmation.

---

## Phase 3: Services List Page with Add Modal

### Overview

Build the `/services` route with a list view and modal form for adding services.

### Changes Required:

#### 1. Create services page

**File**: `src/app/services/page.tsx`

**Intent**: Server component that fetches services and renders list with add button.

**Contract**: 
- Server component (async, fetches data)
- Renders header with "Usługi" title and "Dodaj usługę" button
- Renders services list (or empty state if no services)
- Structure mirrors `src/app/guests/page.tsx` exactly

#### 2. Create services list component

**File**: `src/components/services-list.tsx`

**Intent**: Display services in a grid of cards, showing name, cost breakdown, notes, and deadline.

**Contract**: 
- Client component with `use client` directive
- Props: `services: Service[]`, `onRefresh: () => void`
- Each card shows:
  - Service name (bold, large)
  - Cost breakdown: "Opłacone: {paidAmount} zł / {cost} zł"
  - Notes: if non-empty, show as italic text or in a small box
  - Deadline: if set, show "Termin: {DD.MM.YYYY}"
- Action buttons: Edit (pencil icon), Delete (trash icon)
- All labels in Polish

#### 3. Create add service modal

**File**: `src/components/add-service-modal.tsx`

**Intent**: Modal dialog with form for adding new services.

**Contract**:
- Client component with `use client` directive
- Props: `isOpen: boolean`, `onClose: () => void`, `onAdd: () => void`
- Form fields (all labels in Polish):
  - Nazwa usługi (required, text input) — placeholder: "np. DJ, Fotograf, Kwiaty"
  - Całkowity koszt (required, number input, min: 0, default: 0) — label shows "zł"
  - Już opłacono (required, number input, min: 0, default: 0) — label shows "zł"
  - Notatki (optional, textarea, rows: 3-4) — placeholder: "np. Wysłać listę muzyk do 12.07"
  - Termin (optional, date input, type="date") — no default
- Submit button: "Dodaj usługę"
- Cancel button: "Anuluj"
- Validation:
  - Name required — error: "Nazwa usługi jest wymagana"
  - Cost >= 0 — error: "Koszt nie może być ujemny"
  - Paid >= 0 — error: "Opłacona kwota nie może być ujemna"
  - Paid <= Cost — error: "Opłacona kwota nie może przekraczać całkowitej kwoty"
- Uses API route for submission (POST to `/api/services`)
- Closes modal on success, shows error on failure

#### 4. Wire dashboard link

**File**: `src/app/page.tsx`

**Intent**: Update the Services DashboardCard to link to `/services`.

**Contract**: Find the Services card (sibling to Guests card) and:
- Remove `onClick={(e) => e.preventDefault()}` if present
- Set `href="/services"`
- Button should now navigate instead of being disabled

### Success Criteria:

#### Automated Verification:

- [ ] 3.1 TypeScript compiles: `npm run typecheck`
- [ ] 3.2 Linting passes: `npm run lint`
- [ ] 3.3 Build succeeds: `npm run build`

#### Manual Verification:

- [ ] 3.4 Navigate to `/services` from dashboard
- [ ] 3.5 Click "Dodaj usługę" — modal opens
- [ ] 3.6 Fill form and submit — service appears in list
- [ ] 3.7 Cost breakdown displays correctly (paid / total)
- [ ] 3.8 Empty state shows when no services exist (all in Polish)

**Implementation Note**: Pause for manual confirmation.

---

## Phase 4: Edit & Delete Functionality

### Overview

Add ability to edit existing services and delete them with confirmation.

### Changes Required:

#### 1. Create edit service modal

**File**: `src/components/edit-service-modal.tsx`

**Intent**: Modal dialog pre-populated with service data for editing.

**Contract**:
- Client component
- Props: `service: Service | null`, `isOpen: boolean`, `onClose: () => void`, `onSave: () => void`
- Same form fields as add modal, pre-filled with service data
- Submit button: "Zapisz zmiany"
- Cancel button: "Anuluj"
- Calls update service API route
- Same validation as add modal

#### 2. Create delete confirmation modal

**File**: `src/components/delete-service-modal.tsx`

**Intent**: Confirmation dialog before deleting a service.

**Contract**:
- Client component
- Props: `serviceName: string`, `isOpen: boolean`, `onClose: () => void`, `onConfirm: () => void`
- Message: "Czy na pewno chcesz usunąć usługę: {serviceName}?"
- Warning: "Tej operacji nie można cofnąć."
- Delete button (red): "Usuń"
- Cancel button: "Anuluj"

#### 3. Wire up action buttons

**File**: `src/components/services-list.tsx`

**Intent**: Connect edit and delete buttons to their modals.

**Contract**:
- Add state for active service and open modal type
- Edit button opens edit modal with selected service
- Delete button opens delete confirmation modal
- Refresh service list after successful edit/delete
- Delete inline in the component (same pattern as `guest-list.tsx:174-198`)

### Success Criteria:

#### Automated Verification:

- [ ] 4.1 TypeScript compiles: `npm run typecheck`
- [ ] 4.2 Linting passes: `npm run lint`

#### Manual Verification:

- [ ] 4.3 Click "Edytuj" on a service — modal opens with data pre-filled
- [ ] 4.4 Modify and save — changes appear in list
- [ ] 4.5 Click "Usuń" — confirmation modal appears
- [ ] 4.6 Confirm delete — service removed from list
- [ ] 4.7 Cost breakdown updates correctly after edit

**Implementation Note**: Pause for manual confirmation.

---

## Phase 5: Polish & Edge Cases

### Overview

Handle edge cases and polish the user experience.

### Changes Required:

#### 1. Empty state

**File**: `src/components/services-list.tsx`

**Intent**: Show helpful message when no services exist.

**Contract**: When `services.length === 0`:
- Show illustration or icon (📋 or 🎵 for vendor)
- Message: "Nie masz jeszcze żadnych usług."
- Subtext: "Dodaj pierwszą usługę, aby rozpocząć listę!"
- "Dodaj usługę" button
- All text in Polish

#### 2. Form validation

**File**: `src/components/add-service-modal.tsx` and `src/components/edit-service-modal.tsx`

**Intent**: Validate form before submission.

**Contract**:
- Name is required — show error if empty: "Nazwa usługi jest wymagana"
- Cost must be >= 0 — error: "Koszt nie może być ujemny"
- Paid amount must be >= 0 — error: "Opłacona kwota nie może być ujemna"
- Paid amount must be <= Cost — error: "Opłacona kwota nie może przekraczać całkowitej kwoty"
- Show errors in a banner at the top of the form (red background, Polish text)

#### 3. Loading states

**File**: All modal components

**Intent**: Show loading state during submission.

**Contract**:
- Submit button shows spinner or "Dodawanie..." / "Zapisywanie..." text
- Button disabled during submission
- Modal cannot be closed during submission

#### 4. Aggregate summary

**File**: `src/components/services-list.tsx`

**Intent**: Show totals at bottom of list for budget overview.

**Contract**: Below the cards grid, add a summary section:
- Total services count: "Liczba usług: {count}"
- Total cost: "Łączny koszt: {sum} zł"
- Total paid: "Łącznie opłacono: {sum} zł"
- Total remaining: "Do zapłaty: {sum} zł" (calculated as total - paid)

### Success Criteria:

#### Automated Verification:

- [ ] 5.1 No console errors in browser dev tools

#### Manual Verification:

- [ ] 5.2 Try to submit empty form — validation error appears
- [ ] 5.3 Submit with valid data — loading state shows, then success
- [ ] 5.4 Delete last service — empty state appears
- [ ] 5.5 All Polish labels display correctly
- [ ] 5.6 Aggregate summary shows correct totals

**Implementation Note**: Pause for manual confirmation.

---

## Testing Strategy

### Unit Tests:

None for MVP — manual testing only per user decision (matches add-first-guest approach).

### Integration Tests:

None for MVP.

### Manual Testing Steps:

1. **Create flow**:
   - Navigate to `/services`
   - Click "Dodaj usługę"
   - Add service with name only, cost=0 — displays "Opłacone: 0 zł / 0 zł"
   - Add service with cost=10000, paid=2000 — displays "Opłacone: 2 000 zł / 10 000 zł"
   - Add service with notes and deadline — both display on card
   - Verify aggregate summary at bottom

2. **Edit flow**:
   - Edit a service to increase paid amount
   - Verify breakdown updates
   - Edit to change deadline
   - Verify deadline displays in Polish format (DD.MM.YYYY)

3. **Delete flow**:
   - Delete a service
   - Verify service removed from list
   - Verify aggregate totals update

4. **Validation edge cases**:
   - Submit with empty name — error: "Nazwa usługi jest wymagana"
   - Submit with paid > cost — error: "Opłacona kwota nie może przekraczać całkowitej kwoty"
   - Submit with negative cost — error shown
   - Delete last service — empty state shown

5. **Deadline display**:
   - Add service with deadline 2026-07-12
   - Verify card shows "Termin: 12.07.2026"

## Performance Considerations

- Services list assumed <50 for MVP — no pagination needed
- All services loaded in single query
- Computed fields (remaining) calculated at render time — negligible cost

## Migration Notes

- Existing guests and users tables unaffected
- No data migration needed (new table, no existing data)
- Rollback: `drizzle-kit rollback` removes services table

## References

- Guest CRUD pattern: `context/changes/add-first-guest/plan.md`
- Server actions: `src/lib/db/guests.ts`
- API routes: `src/app/api/guests/route.ts`
- Modal components: `src/components/add-guest-modal.tsx`
- List component: `src/components/guest-list.tsx`
- Schema pattern: `src/lib/db/schema.ts:28-39`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Database Schema & Migration

#### Automated

- [x] 1.1 Schema compiles: `npm run typecheck`
- [x] 1.2 Migration generates: `npm run db:generate`
- [x] 1.3 Migration applies: `npm run db:migrate`

#### Manual

- [ ] 1.4 Verify table exists in database: `npm run db:studio` shows `services` table
- [ ] 1.5 Verify columns match design (name, cost, paidAmount, notes, deadline, createdAt)

### Phase 2: Server Actions for Service CRUD

#### Automated

- [x] 2.1 TypeScript compiles without errors
- [x] 2.2 ESLint passes: `npm run lint`

#### Manual

- [ ] 2.3 Test in db:studio: create a service, verify it appears
- [ ] 2.4 Test update: modify a service, verify changes persist
- [ ] 2.5 Test delete: remove a service, verify it's gone
- [ ] 2.6 Test validation: try to create with paidAmount > cost — error shown

### Phase 3: Services List Page with Add Modal

#### Automated

- [x] 3.1 TypeScript compiles: `npm run typecheck`
- [x] 3.2 Linting passes: `npm run lint`
- [x] 3.3 Build succeeds: `npm run build`

#### Manual

- [x] 3.4 Navigate to `/services` from dashboard — verified with back button fix
- [x] 3.5 Click "Dodaj usługę" — modal opens
- [x] 3.6 Fill form and submit — service appears in list
- [ ] 3.7 Cost breakdown displays correctly (paid / total) — requires Phase 4 list component
- [x] 3.8 Empty state shows when no services exist

### Phase 4: Edit & Delete Functionality

#### Automated

- [x] 4.1 TypeScript compiles: `npm run typecheck`
- [x] 4.2 Linting passes: `npm run lint`

#### Manual

- [ ] 4.3 Click "Edytuj" on a service — modal opens with data pre-filled
- [ ] 4.4 Modify and save — changes appear in list
- [ ] 4.5 Click "Usuń" — confirmation modal appears
- [ ] 4.6 Confirm delete — service removed from list
- [ ] 4.7 Cost breakdown updates correctly after edit

### Phase 5: Polish & Edge Cases

#### Automated

- [x] 5.1 No console errors in browser dev tools — build succeeds, pre-existing useEffect warnings in guest components

#### Manual

- [x] 5.2 Try to submit empty form — validation error appears (name required, cost/paid validation)
- [x] 5.3 Submit with valid data — loading state shows ("Dodawanie..."/"Zapisywanie..."), then success
- [x] 5.4 Delete last service — empty state appears
- [x] 5.5 All Polish labels display correctly
- [x] 5.6 Aggregate summary shows correct totals (services count, total cost, paid, remaining)
