# View Finances Implementation Plan

## Overview

Implementacja strony `/finances` pokazującej całkowity koszt wesela zagregowany z trzech źródeł: Usługi, Catering i Goście. Każdy gość jest liczony jako `liczba miejsc × costPerPlate`, gdzie liczba miejsc = 1 (gość) + 1 (partner jeśli nie comingAlone) + dzieci.

## Current State Analysis

**Co istnieje:**
- Dashboard Card Finances na stronie głównej (`src/app/page.tsx:44-49`) — placeholder z linkiem do `/finances`
- Funkcja `getTotalCateringCost()` w `src/lib/db/catering.ts:49-59` — oblicza koszt cateringu: `costPerPlate × totalSeats`
- Usługi mają pola `cost` i `paidAmount` (`src/lib/db/schema.ts:42-50`)
- Goście **nie mają** pola `cost` — koszt jest liczony na podstawie liczby miejsc × costPerPlate (ten sam pattern co catering)
- Brak strony `/finances` i brak API do agregacji

**Pattern do naśladowania:**
- `ServicesDashboardCard` (`src/components/services-dashboard-card.tsx`) — server component fetchujący dane
- `CateringDashboardCard` (`src/components/catering-dashboard-card.tsx`) — używa `getTotalCateringCost()`

## Desired End State

Strona `/finances` pokazuje:
1. **Łączny koszt wesela** (suma: Usługi + Catering + Goście×talerz)
2. **Breakdown na kategorie** z kwotami dla każdej
3. Wszystkie dane są żywe — odświeżane przy każdym wejściu (Server Component)

### Key Discoveries:

- `src/lib/db/catering.ts:49-59` — `getTotalCateringCost()` już liczy miejsca według wzoru: `1 + (comingAlone ? 0 : 1) + childrenCount`
- Goście nie mają własnego pola `cost` — ich "koszt" to `liczba miejsc × costPerPlate` (to samo co catering, więc można użyć tej samej logiki)
- `src/app/page.tsx:44-49` — DashboardCard Finances już istnieje, tylko placeholder

## What We're NOT Doing

- **Nie dodajemy pola `cost` do guests** — goście są liczeni jako `miejsca × costPerPlate` (consistent z catering)
- **Nie dodajemy wykresów ani wizualizacji** — PRD FR-017 "visual diagram" jest parked w roadmap
- **Nie dodajemy edycji kosztów z tej strony** — tylko widok
- **Nie cache'ujemy danych** — server component fetchuje przy każdym renderze

## Implementation Approach

1. **Dodać funkcję agregującą** `src/lib/db/finances.ts` — nowy moduł z funkcjami:
   - `getTotalServicesCost()` — suma services.cost
   - `getTotalGuestCost()` — liczba miejsc × costPerPlate (reuse z catering.ts)
   - `getTotalWeddingCost()` — suma wszystkich trzech źródeł
   - `getFinancesBreakdown()` — obiekt z breakdownem na kategorie

2. **Dodać API endpoint** `src/app/api/finances/route.ts` — GET zwracający agregację

3. **Dodać stronę** `src/app/finances/page.tsx` — Server Component wyświetlający dane

4. **Dodać test** `src/app/api/finances/route.test.ts` — test agregacji (Risk #2 z test-plan.md)

5. **Zaktualizować DashboardCard** — podmienić placeholder na rzeczywistą sumę

## Critical Implementation Details

- **Timing & lifecycle:** Funkcje agregujące muszą być wywołane **po** zainicjalizowaniu DB — używamy `src/lib/db/index.ts` exportów
- **Guest cost logic:** Goście nie mają pola `cost` — ich koszt to `totalSeats × costPerPlate`, gdzie `totalSeats` liczymy tak samo jak w `getTotalCateringCost()` (catering.ts:54-56)
- **Performance:** Przy dużej liczbie gości (>1000) warto rozważyć cache, ale na MVP z <100 gośćmi server component jest OK

---

## Phase 1: Agregacja kosztów — logika biznesowa

### Overview

Dodanie funkcji agregujących w `src/lib/db/finances.ts` — czysta logika biznesowa bez zależności od UI.

### Changes Required:

#### 1. Nowy moduł `src/lib/db/finances.ts`

**Intent**: Dodać funkcje agregujące koszty z trzech źródeł: usługi, catering, goście.

**Contract**: 
- `getTotalServicesCost(): Promise<number>` — suma `services.cost`
- `getTotalGuestCost(): Promise<number>` — `totalSeats × costPerPlate` (używa tego samego wzoru co catering.ts:54-56)
- `getFinancesBreakdown(): Promise<{ services: number, catering: number, guests: number, total: number }>` — obiekt z breakdownem
- Wszystkie funkcje zwracają `0` dla pustych danych (nie `null`/`undefined`)

---

## Phase 2: API endpoint

### Overview

Dodanie GET `/api/finances` zwracającego zagregowane dane.

### Changes Required:

#### 1. Endpoint `src/app/api/finances/route.ts`

**Intent**: Udostępnić dane finansowe przez API (przydatne dla UI i testów integracyjnych).

**Contract**:
- `GET /api/finances` — zwraca `{ services: number, catering: number, guests: number, total: number }`
- Wymaga sesji (auth) — zwraca 401 jeśli brak
- Błąd 500 z komunikatem w razie problemu z bazą

---

## Phase 3: Strona /finances

### Overview

Stworzenie strony `/finances` z widokiem sumy i breakdownu.

### Changes Required:

#### 1. Strona `src/app/finances/page.tsx`

**Intent**: Wyświetlić całkowity koszt wesela z breakdownem na kategorie.

**Contract**:
- Server Component (async)
- Wymaga sesji — redirect do `/login` jeśli brak (pattern z `src/app/page.tsx:12-13`)
- Wyświetla:
  - Wielki nagłówek z sumą całkowitą (X zł)
  - Trzy sekcje z breakdownem: Usługi (A zł), Catering (B zł), Goście (C zł)
  - Empty state jeśli wszystkie koszty = 0

#### 2. DashboardCard update `src/app/page.tsx`

**Intent**: Zamiast placeholdera "$0.00" pokazać rzeczywistą sumę.

**Contract**:
- Import `getFinancesBreakdown` z `@/lib/db/finances`
- Przekazać `total` do DashboardCard (może wymagać dodania props `totalCost` do komponentu)

---

## Phase 4: Testy

### Overview

Test integracyjny weryfikujący poprawność agregacji kosztów (Risk #2 z test-plan.md).

### Changes Required:

#### 1. Test `src/app/api/finances/route.test.ts`

**Intent**: Udowodnić, że agregacja działa poprawnie — dodanie kosztu zwiększa sumę, usunięcie zmniejsza.

**Contract**:
- Pattern z `src/app/api/guests/route.test.ts` — mock `@root/auth`, `resetTestDb()` w `beforeEach`
- Test: dodaj usługę z cost=100 → GET zwraca total=100
- Test: dodaj catering z costPerPlate=50 i 10 miejsc → total rośnie o 500
- Test: usuń usługę → total maleje

---

## Testing Strategy

### Unit Tests:

- Funkcje w `finances.ts` — testować osobno (czysta logika, bez DB)

### Integration Tests:

- `src/app/api/finances/route.test.ts` — pełny przepływ: mutacja → agregacja → weryfikacja

### Manual Testing Steps:

1. Otworzyć `/finances` z pustą bazą — zobaczyć empty state
2. Dodać usługę z kosztem 100 zł — odświeżyć, zobaczyć total=100
3. Dodać catering z costPerPlate=50 i 10 gościami — zobaczyć total=100+500=600
4. Usunąć usługę — zobaczyć total=500
5. Sprawdzić breakdown — każda kategoria pokazuje poprawną kwotę

## Performance Considerations

- Server Component fetchuje dane przy każdym wejściu — dla <100 gości i <50 usług to <10ms
- Przy >1000 rekordów rozważyć cache (5 min) lub revalidation po mutacji

## Migration Notes

- Brak migracji schema — nie dodajemy nowych pól
- Funkcje w `finances.ts` używają istniejących tabel

## References

- Pattern: `src/lib/db/catering.ts:49-59` — `getTotalCateringCost()`
- Pattern: `src/components/services-dashboard-card.tsx` — server component z danymi
- Test pattern: `src/app/api/guests/route.test.ts`
- Risk #2: `context/foundation/test-plan.md:30` — "cost aggregation double-counts or loses costs"

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Agregacja kosztów — logika biznesowa

#### Automated

- [x] 1.1 `src/lib/db/finances.ts` istnieje i eksportuje 4 funkcje — fee3ac0
- [x] 1.2 TypeScript typecheck przechodzi: `npm run typecheck` — fee3ac0

#### Manual

- [x] 1.3 Funkcje zwracają poprawne wyniki na testowych danych — fee3ac0

### Phase 2: API endpoint

#### Automated

- [x] 2.1 `src/app/api/finances/route.ts` istnieje — 5815dda
- [x] 2.2 GET zwraca 200 z poprawnym kształtem odpowiedzi — 5815dda
- [x] 2.3 GET bez sesji zwraca 401 — 5815dda

#### Manual

- [x] 2.4 API zwraca poprawne sumy dla testowych danych — 5815dda

### Phase 3: Strona /finances

#### Automated

- [x] 3.1 `src/app/finances/page.tsx` istnieje — 532b814
- [x] 3.2 Strona renderuje się bez błędów (brak 500) — 532b814
- [x] 3.3 DashboardCard na stronie głównej pokazuje rzeczywistą sumę — 532b814

#### Manual

- [x] 3.4 Widok poprawny: suma całkowita + breakdown na 3 kategorie — 532b814
- [x] 3.5 Empty state widoczny dla pustej bazy — 532b814

### Phase 4: Testy

#### Automated

- [x] 4.1 `src/app/api/finances/route.test.ts` istnieje — acc813c
- [x] 4.2 Testy przechodzą: `npm run test` — acc813c
- [x] 4.3 Test pokrywa Risk #2 (agregacja) — acc813c

#### Manual

- [x] 4.4 Uruchomić testy ręcznie i zweryfikować, że łapią błędy agregacji — acc813c
