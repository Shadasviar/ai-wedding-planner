# View Finances — Plan Brief

> Full plan: `context/changes/view-finances/plan.md`

## What & Why

Strona `/finances` pokazująca całkowity koszt wesela zagregowany z trzech źródeł: **Usługi** (vendorzy), **Catering** (costPerPlate × miejsca), **Goście** (miejsca × costPerPlate). Realizuje PRD FR-016 (total wedding cost) i FR-017 (breakdown by category) — daje użytkownikowi jeden widok pełnego budżetu bez ręcznego sumowania.

## Starting Point

Dashboard Card Finances istnieje na stronie głównej (`src/app/page.tsx:44-49`), ale to tylko placeholder z "$0.00". Funkcja `getTotalCateringCost()` już agreguje catering (catering.ts:49-59). Goście nie mają pola `cost` — ich koszt to liczba miejsc × costPerPlate (ten sam wzór co catering).

## Desired End State

Użytkownik wchodzi na `/finances` i widzi:
1. **Wielką liczbę** z całkowitym kosztem wesela
2. **Breakdown** na 3 kategorie z kwotami (Usługi X zł, Catering Y zł, Goście Z zł)
3. Empty state jeśli brak danych

## Key Decisions Made

| Decision                       | Choice                          | Why (1 sentence)                        | Source |
|--------------------------------|---------------------------------|-----------------------------------------|--------|
| Źródła kosztów                 | Usługi + Catering + Goście      | Goście liczeni jako miejsca × talerz    | User   |
| Goście — pole cost?            | NIE — używamy istniejącego wzoru| Brak migracji, consistent z catering    | Plan   |
| Widok szczegółowości           | Suma + breakdown na kategorie   | Realizuje PRD FR-016 + FR-017           | User   |
| Testy                          | Tak — integracyjny agregacji    | Adresuje Risk #2 z test-plan.md         | User   |
| Priorytet                      | Wszystko must-have              | Pełne MVP za jednym razem               | User   |

## Scope

**In scope:**
- Funkcje agregujące w `src/lib/db/finances.ts`
- API endpoint `GET /api/finances`
- Strona `/finances` z sumą i breakdownem
- Aktualizacja DashboardCard o rzeczywistą sumę
- Test integracyjny (Risk #2)

**Out of scope:**
- Pole `cost` dla gości (wymagałoby migracji + zmian w UI)
- Wykresy / wizualizacje (PRD FR-017 "visual diagram" jest parked)
- Edycja kosztów z tej strony
- Cache / optymalizacje wydajnościowe

## Architecture / Approach

Server Components (Next.js App Router) — dane fetchowane przy każdym renderze. Pattern zgodny z `GuestsDashboardCard`, `ServicesDashboardCard`, `CateringDashboardCard`. Agregacja w warstwie DB (`finances.ts`), API jako dodatkowa warstwa (przydatna dla testów), UI jako thin wrapper.

## Phases at a Glance

| Phase | Co deliverszy | Kluczowe ryzyko |
|-------|---------------|-----------------|
| 1. Agregacja (logika) | Funkcje w `finances.ts` | Błędne liczenie miejsc gości (partner + dzieci) |
| 2. API | `GET /api/finances` | Brak auth protection |
| 3. Strona | `/finances` + DashboardCard update | Empty state nie działa poprawnie |
| 4. Testy | Integracyjny na Risk #2 | Test nie łapie błędów agregacji |

**Prerequisites:** F-01 (auth), F-02 (database) — oba done w roadmap
**Estimated effort:** ~2-3 sesje (4 fazy)

## Open Risks & Assumptions

- **Assumption:** Goście są liczeni poprawnie w `getTotalCateringCost()` — wzór `1 + (comingAlone ? 0 : 1) + childrenCount` jest użyty w catering.ts:54-56
- **Risk:** Przy dużej liczbie gości (>1000) server component może być wolny — na MVP z <100 nie jest to problem
- **Risk:** Jeśli costPerPlate nie jest ustawione (catering settings puste), guest cost = 0 — to jest poprawne zachowanie

## Success Criteria (Summary)

- ✅ `/finances` pokazuje sumę: Usługi + Catering + Goście×talerz
- ✅ Breakdown na 3 kategorie widoczny z kwotami
- ✅ Test integracyjny łapie błędy agregacji (Risk #2)
- ✅ DashboardCard na głównej pokazuje rzeczywistą sumę zamiast "$0.00"
