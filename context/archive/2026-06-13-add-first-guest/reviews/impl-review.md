<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Guest Management (Add First Guest)

- **Plan**: `context/changes/add-first-guest/plan.md`
- **Scope**: All 5 phases (full plan review)
- **Date**: 2026-06-13
- **Verdict**: NEEDS ATTENTION
- **Findings**: 1 critical, 6 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | WARNING ⚠️ (3 findings) |
| Scope Discipline | WARNING ⚠️ (1 finding) |
| Safety & Quality | FAIL ❌ (1 critical) |
| Architecture | PASS ✅ |
| Pattern Consistency | WARNING ⚠️ (2 findings) |
| Success Criteria | PASS ✅ |

**► Overall: NEEDS ATTENTION**

═══════════════════════════════════════════════════════════
  CRITICAL FINDINGS ❌
═══════════════════════════════════════════════════════════

  F1 — Missing authentication on API routes
  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
    Severity:  ❌ CRITICAL
    Impact:    🔎 MEDIUM — real tradeoff; pause to reason through it
    Dimension: Safety & Quality
    Location:  src/app/api/guests/route.ts, src/app/api/guests/[id]/route.ts

    Detail:
    All API endpoints (GET, POST, PUT, DELETE) lack authentication
    checks. The page-level auth redirects unauthenticated users, but
    the API routes are completely open — any client can read, create,
    modify, or delete guest data without a valid session.

    Fix: Add `const session = await auth()` at the top of each handler
         and return 401 Unauthorized if no session exists.
      Strength:   Matches the pattern in src/app/guests/page.tsx and
                  closes the security gap entirely.
      Tradeoff:   Minor — 3-4 lines per handler, 6 handlers total.
      Confidence: HIGH — identical pattern used in page component.
      Blind spot: Haven't verified if NextAuth middleware could provide
                  alternative auth layer at /api level.

═══════════════════════════════════════════════════════════
  WARNING FINDINGS ⚠️
═══════════════════════════════════════════════════════════

  F2 — Extra database field not in plan
  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
    Severity:  ⚠️ WARNING
    Impact:    🏃 LOW — quick decision; fix is obvious and narrowly scoped
    Dimension: Scope Discipline
    Location:  src/lib/db/schema.ts:34

    Detail:
    Plan specified using `spouseName: null` to indicate "coming alone".
    Implementation adds a separate `comingAlone` boolean field instead.
    This is a reasonable design improvement but was not documented.

    Fix A ⭐ Recommended: Document in plan as an addendum
      Strength:   Preserves the implemented design which is more explicit
                  and clearer than overloading spouseName null.
      Tradeoff:   Plan becomes a slightly moving target.
      Confidence: HIGH — schema migrations are already tracked; this is
                  a legitimate refinement discovered during implementation.
      Blind spot: None significant.

  F3 — Guest list component props differ from plan
  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
    Severity:  ⚠️ WARNING
    Impact:    🏃 LOW — quick decision; fix is obvious and narrowly scoped
    Dimension: Plan Adherence
    Location:  src/components/guest-list.tsx:12

    Detail:
    Plan specified `props: { guests: Guest[] }`. Implementation uses
    `props: { guests: Guest[], onRefresh: () => void }` to enable
    refetching after mutations.

    Fix: Update plan's "Contract" section to include onRefresh prop.
      Strength:   Plan accurately reflects the implemented interface.
      Tradeoff:   None — this is a documentation-only change.
      Confidence: HIGH — the prop is necessary for the refresh pattern.
      Blind spot: None.

  F4 — Validation errors shown in banner, not inline
  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
    Severity:  ⚠️ WARNING
    Impact:    🏃 LOW — quick decision; fix is obvious and narrowly scoped
    Dimension: Plan Adherence
    Location:  src/components/add-guest-modal.tsx:78

    Detail:
    Plan specified "Show inline error messages below fields in Polish".
    Implementation shows errors in a single banner at top of form.

    Fix: Update plan to reflect banner-style error display.
      Strength:   Single change, accurate documentation.
      Tradeoff:   Banner is less precise than inline (user must scan).
      Confidence: HIGH — banner pattern is common and functional.
      Blind spot: Haven't verified if banner meets accessibility needs
                  (screen reader announcement timing).

  F5 — API error messages mix Polish and English
  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
    Severity:  ⚠️ WARNING
    Impact:    🏃 LOW — quick decision; fix is obvious and narrowly scoped
    Dimension: Pattern Consistency
    Location:  src/app/api/guests/route.ts:11

    Detail:
    API returns Polish error messages ("Nie udało się pobrać gości")
    while login page shows English ("Invalid credentials"). Plan
    specified "Full Polish UI" but didn't address API error language.

    Fix: Standardize API errors to Polish to match UI.
      Strength:   Consistent user experience across the app.
      Tradeoff:   None significant — all UI text is already Polish.
      Confidence: HIGH — simple string replacements.
      Blind spot: None.

  F6 — Typo in modal label: "guest" instead of "gość"
  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
    Severity:  ⚠️ WARNING
    Impact:    🏃 LOW — quick decision; fix is obvious and narrowly scoped
    Dimension: Pattern Consistency
    Location:  src/components/add-guest-modal.tsx:106

    Detail:
    Label reads "Czy guest przychodzi z osobą towarzyszącą?" — contains
    English word "guest" in an otherwise Polish sentence.

    Fix: Change "guest" to "gość".
      Strength:   Corrects the typo, maintains Polish UI consistency.
      Tradeoff:   None.
      Confidence: HIGH — one-word fix.
      Blind spot: None.

═══════════════════════════════════════════════════════════
  OBSERVATION FINDINGS 📝
═══════════════════════════════════════════════════════════

  F7 — Hard delete without rollback mechanism
  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
    Severity:  📝 OBSERVATION
    Impact:    🔎 MEDIUM — real tradeoff; pause to reason through it
    Dimension: Data Safety
    Location:  src/lib/db/guests.ts:41-50

    Detail:
    deleteGuest() performs a hard delete with no soft-delete or undo
    mechanism. Accidental deletions permanently lose data.

    Consider: Soft-delete with deletedAt field, or "Undo" toast after
              deletion, or audit log for compliance.
      Strength:   Prevents data loss from accidental deletion.
      Tradeoff:   Adds complexity (schema change, query filters, UI).
      Confidence: MEDIUM — depends on production requirements.
      Blind spot: Haven't discussed with stakeholders whether accidental
                  deletion is a real concern for this app's scale.

  F8 — No runtime validation on schema
  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
    Severity:  📝 OBSERVATION
    Impact:    🔎 MEDIUM — real tradeoff; pause to reason through it
    Dimension: Data Safety
    Location:  src/lib/db/schema.ts:28-35

    Detail:
    Schema defines TypeScript types but no runtime validation (e.g.,
    max length for names, constraints on childrenCount). Malicious or
    erroneous data could be inserted.

    Consider: Add drizzle-orm validations or Zod for runtime validation
              before database operations.
      Strength:   Catches invalid data at API boundary, not just DB.
      Tradeoff:   Adds dependency and validation boilerplate.
      Confidence: MEDIUM — depends on threat model.
      Blind spot: Haven't assessed whether API-level validation is
                  needed given the authenticated, single-org use case.

  F9 — Unbounded result set
  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
    Severity:  📝 OBSERVATION
    Impact:    🏃 LOW — quick decision; fix is obvious and narrowly scoped
    Dimension: Performance
    Location:  src/lib/db/guests.ts:9

    Detail:
    getGuests() returns ALL guests without pagination. For a wedding
    guest list (<500 typically) this is acceptable, but worth noting.

    Consider: Add limit/offset if guest lists may grow large.
      Strength:   Prevents performance degradation at scale.
      Tradeoff:   Adds pagination UI and query complexity.
      Confidence: HIGH — unnecessary for current scope.
      Blind spot: None — wedding guest lists are bounded by nature.
