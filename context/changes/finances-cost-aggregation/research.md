---
date: 2026-06-16T00:00:00+02:00
researcher: Claude Code
git_commit: c2ed2eb4939cdb6d0091b7b331ddf295a42e37c9
branch: master
repository: ai-wesele
topic: 'Risk: Cost aggregation double-counts or loses costs when Guests or Services change — Finances total is wrong'
tags:
  - research
  - codebase
  - finances
  - cost-aggregation
  - risk-2
status: complete
last_updated: 2026-06-16
last_updated_by: Claude Code
---

# Research: Cost Aggregation Double-Counting Risk

**Date**: 2026-06-16T00:00:00+02:00
**Researcher**: Claude Code
**Git Commit**: c2ed2eb4939cdb6d0091b7b331ddf295a42e37c9
**Branch**: master
**Repository**: ai-wesele

## Research Question

**Risk #2 from test-plan.md**: Cost aggregation double-counts or loses costs when Guests or Services change — Finances total is wrong.

| Attribute | Value |
|-----------|-------|
| Impact | High |
| Likelihood | Medium |
| Source | Q3 (business logic concern), PRD FR-016/017 (Finances summary), roadmap S-05 (product wedge) |

**Key question**: What code currently aggregates costs from Guests and Services, and what failure modes could cause double-counting or lost costs?

## Summary

**Critical finding**: The guests table **does not have a cost field**. The PRD mentions guests should have "associated costs (e.g., meal price)" (FR-005), but the current schema at `src/lib/db/schema.ts:28-39` has no cost column for guests.

**Current aggregation state**:
- **Services costs**: Aggregated correctly in `src/components/services-dashboard-card.tsx:9` and `src/components/services-list.tsx:21`
- **Guest costs**: **NOT IMPLEMENTED** — no cost field exists in guests schema
- **Combined Finances total**: **NOT IMPLEMENTED** — the dashboard Finances card at `src/app/page.tsx:42-47` is a static placeholder with no aggregation logic

**The product wedge** (roadmap line 20) states: "all costs aggregate automatically into a Finances summary" — this is **not yet built**. S-05 (view-finances-summary) is the slice that implements this, and it is currently in "proposed" status.

**Risk exposure**: The risk of double-counting or lost costs is **future-facing** — it will become real when:
1. Guest cost fields are added (schema migration)
2. Finances aggregation logic is implemented (S-05)
3. Any code modifies guest/service costs without triggering recalculation

## Detailed Findings

### Current Schema: Guests Have No Cost Field

**File**: [`src/lib/db/schema.ts:28-39`](src/lib/db/schema.ts#L28-L39)

```typescript
export const guests = sqliteTable('guests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  spouseName: text('spouse_name'),
  childrenCount: integer('children_count').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  comingAlone: integer('coming_alone', { mode: 'boolean' }).notNull().default(false),
})
```

**Fields present**: id, name, spouseName, childrenCount, createdAt, comingAlone
**Fields missing**: cost, mealPrice, or any cost-related field

**Contrast with Services table** ([`src/lib/db/schema.ts:42-50`](src/lib/db/schema.ts#L42-L50)):
```typescript
export const services = sqliteTable('services', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  cost: integer('cost').notNull().default(0),  // ← cost field exists here
  paidAmount: integer('paid_amount').notNull().default(0),
  notes: text('notes').notNull().default(''),
  deadline: text('deadline'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})
```

### PRD Requirements vs. Implementation

**PRD FR-005** ([`context/foundation/prd.md:74`](context/foundation/prd.md#L74)):
> User can add guests with associated costs (e.g., meal price). Priority: must-have

**PRD FR-016** ([`context/foundation/prd.md:91`](context/foundation/prd.md#L91)):
> User can see total wedding cost aggregated from Guests + Services. Priority: must-have

**PRD FR-017** ([`context/foundation/prd.md:92`](context/foundation/prd.md#L92)):
> User can see cost breakdown by category (visual diagram). Priority: must-have

**Roadmap S-01** ([`context/foundation/roadmap.md:97`](context/foundation/roadmap.md#L97)):
> Outcome: Add a guest with associated cost (e.g., meal price).

**Roadmap S-05** ([`context/foundation/roadmap.md:145`](context/foundation/roadmap.md#L145)):
> Outcome: See total wedding cost aggregated from Guests + Services.
> Prerequisites: S-01, S-04

**Current implementation status**:
- S-01 (add-first-guest): **Implemented** — but without cost field
- S-04 (add-first-service): **Implemented** — with cost field
- S-05 (view-finances-summary): **Not implemented** — still "proposed"

### Current Aggregation Code (Services Only)

**Services dashboard card** ([`src/components/services-dashboard-card.tsx:9-11`](src/components/services-dashboard-card.tsx#L9-L11)):
```typescript
const totalCost = services.reduce((sum, s) => sum + (s.cost || 0), 0)
const totalPaid = services.reduce((sum, s) => sum + (s.paidAmount || 0), 0)
const totalRemaining = totalCost - totalPaid
```

**Services list** ([`src/components/services-list.tsx:21-23`](src/components/services-list.tsx#L21-L23)):
```typescript
const totalCost = services.reduce((sum, s) => sum + (s.cost || 0), 0)
const totalPaid = services.reduce((sum, s) => sum + (s.paidAmount || 0), 0)
const totalRemaining = totalCost - totalPaid
```

**Dashboard Finances card** ([`src/app/page.tsx:42-47`](src/app/page.tsx#L42-L47)):
```tsx
<DashboardCard
  title="Finances"
  emptyMessage="Total wedding cost so far"
  ctaLabel="$0.00"
  href="/finances"
/>
```

This is a **static placeholder** — no aggregation logic, no link to real data.

### No Combined Aggregation Exists Yet

**Finding**: There is **no code** in the codebase that aggregates costs from BOTH Guests and Services together.

Searched:
- `grep -r "total.*cost\|totalCost\|aggregat" src/` — only found Services-only aggregation
- `grep -r "finances\|Finance" src/` — only found the DashboardCard placeholder
- `find src -path "*finances*"` — no /finances page exists

**Implication**: The risk of double-counting or lost costs is **not yet realized** because the aggregation logic doesn't exist yet. However, this research establishes the oracle for when S-05 is implemented.

## Code References

- `src/lib/db/schema.ts:28-39` — Guests table (no cost field)
- `src/lib/db/schema.ts:42-50` — Services table (has cost field)
- `src/components/services-dashboard-card.tsx:9-11` — Services cost aggregation
- `src/components/services-list.tsx:21-23` — Services cost aggregation (duplicate logic)
- `src/app/page.tsx:42-47` — Finances dashboard placeholder (static, no logic)
- `context/foundation/prd.md:67-92` — Dashboard and Finances functional requirements
- `context/foundation/roadmap.md:34-37` — Slice dependencies showing S-05 requires S-01 + S-04
- `context/foundation/test-plan.md:31-32` — Risk #2 definition
- `context/foundation/test-plan.md:42` — Risk response guidance: "Integration test (mutate → re-query total)"

## Architecture Insights

### The Product Wedge

From [`context/foundation/roadmap.md:20`](context/foundation/roadmap.md#L20):

> The product wedge — the one trait that, if removed, makes the product indistinguishable from a generic spreadsheet — is that all costs aggregate automatically into a Finances summary, giving a single view of the wedding budget without manual summation.

This is the **core differentiator** of the product. If aggregation fails, the product is just CRUD.

### Future Failure Modes (When S-05 Is Implemented)

Based on the current architecture, here are the failure modes to guard against:

| Failure Mode | Description | When It Matters |
|-------------|-------------|-----------------|
| **Guest cost field added without migration of existing data** | Existing guests get NULL or 0 cost when column is added | Schema migration phase |
| **Aggregation queries only Services** | Developer forgets to include Guest costs | S-05 implementation |
| **Double-counting via JOIN** | Aggregation query JOINs guests and services incorrectly | Complex SQL aggregation |
| **Stale cached total** | Total is calculated once and not recalculated on mutation | Any edit to guest/service |
| **Partial update loses cost** | Update operation doesn't preserve existing cost value | Guest/service edit operations |
| **Cost included in multiple categories** | Same cost counted in both "Guests" and "Services" breakdown | Category breakdown logic |

### Recommended Test Strategy (from test-plan.md §2)

**Risk response guidance** ([`context/foundation/test-plan.md:42`](context/foundation/test-plan.md#L42)):
> Change guest cost → total updates correctly
> Challenge: "SUM works in SQL" ≠ "all cost sources included"
> Likely cheapest layer: Integration test (mutate → re-query total)

**Test pattern for S-05**:
```typescript
// Integration test: mutate guest cost → verify total changes
test('Finances total updates when guest cost changes', async () => {
  // 1. Create guest with cost
  // 2. Create service with cost
  // 3. Verify total = guest cost + service cost
  // 4. Update guest cost
  // 5. Verify total reflects the change
})

// Integration test: mutate service cost → verify total changes
test('Finances total updates when service cost changes', async () => {
  // Same pattern for services
})

// Edge case: delete guest → verify total decreases
test('Finances total decreases when guest is deleted', async () => {
  // Verify cascade works correctly
})
```

## Historical Context (from prior changes)

### From empty-dashboard research ([`context/changes/empty-dashboard/research.md`](context/changes/empty-dashboard/research.md)):

> **Finances**: Should show aggregated total (zero initially) — this is the product wedge

> **PRD FR-003**: User can see Finances summary on dashboard (total cost, visual diagram). Priority: must-have

> **Acceptance Criteria**: Finances shows aggregated total from all cost sources

This research confirmed the dashboard should show aggregated costs, but noted the aggregation logic would come later (S-05).

### From add-first-guest plan ([`context/changes/add-first-guest/plan.md`](context/changes/add-first-guest/plan.md)):

> Each guest record tracks the guest's name, their spouse/partner name ("małżonek" or "osoba towarzysząca"), and number of children.

**Note**: No mention of cost field — the implementation focused on headcount, not costs. This is a **gap** between PRD and implementation.

### From add-first-service plan ([`context/changes/add-first-service/plan.md`](context/changes/add-first-service/plan.md)):

Services were implemented with full cost tracking:
- `cost: integer('cost').notNull().default(0)`
- `paidAmount: integer('paid_amount').notNull().default(0)`
- Validation: cost >= 0, paidAmount <= cost

**Asymmetry**: Services have costs, guests don't — this is a **PRD violation** (FR-005 requires guest costs).

## Related Research

- `context/changes/empty-dashboard/research.md` — Dashboard structure and Finances placeholder
- `context/changes/testing-bootstrap-first-integration/research.md` — Test infrastructure setup
- `context/foundation/test-plan.md` — Risk #2 definition and test strategy
- `context/foundation/prd.md` — Functional requirements FR-005, FR-016, FR-017
- `context/foundation/roadmap.md` — Slice S-05 (view-finances-summary) definition

## Open Questions

1. **Should guests have a cost field?** — PRD FR-005 says yes ("associated costs (e.g., meal price)"), but schema doesn't have it. This needs to be added before S-05 can be implemented.

2. **What is the correct guest cost formula?** — Is it a simple per-guest meal price, or does it involve childrenCount, spouse presence, or other factors? PRD doesn't specify.

3. **Should the Finances page exist as a separate route?** — Currently `/finances` doesn't exist (only a DashboardCard placeholder). Should S-05 create a dedicated page, or just update the dashboard card?

4. **How should cost breakdown by category work (FR-017)?** — Should it show "Guests: X zł, Services: Y zł", or more granular categories? PRD says "visual diagram" but defers implementation (roadmap "Parked" section).

## Recommended Next Steps

1. **Create a follow-up change** to add guest cost field to schema (PRD compliance for FR-005)
2. **Implement S-05** (view-finances-summary) with integration tests proving:
   - Total = sum of all guest costs + sum of all service costs
   - Changing any cost updates the total
   - Deleting any item updates the total
3. **Add to test-plan.md §6 cookbook** — Document the cost aggregation test pattern once S-05 ships
