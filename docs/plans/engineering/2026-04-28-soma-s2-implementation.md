Category: engineering

# Soma — Sprint 2 Implementation-Ready Breakdown

**Owner:** Tribesh
**Created:** 2026-04-28
**Parent spec:** `2026-04-28-soma-marketability-sprints.md` (S2 section)
**Depends on:** `2026-04-28-soma-s1-implementation.md` (Voice/Theme/Preferences must be live)
**Goal:** Sunrise-anchored tithi with panchanga-grade accuracy parity to Drik Panchang. Adds `Location` storage, `computeSunrise`, sunrise-anchored `computeTithi`, 30-tithi metadata seed, 24 named Ekadashis, three new SomaDayKinds (Pradosh / Sankashti Chaturthi / Shivaratri), parana-window math, citation system, and Receipts UI.

---

## A. Ordered Task List

28 tasks. Each leaves typecheck + build + tests green. Total effort ≈ 22 hours.

| # | Task | Files | Effort | Deps |
|---|---|---|---|---|
| T01 | Add `Location`, `City`, `TithiAccuracy` types; extend `UserProfile.location` | `src/lib/types.ts` | 30 min | S1 done |
| T02 | Storage migration v2 → v3 (additive `profile.location`, `schedule[].sunrise`, `schedule[].tithi.accuracy`) | `src/lib/storage.ts`, `src/lib/__tests__/migration.v3.test.ts` | 60 min | T01 |
| T03 | Wire `setLocation` into `AppStateContext` | `src/state/AppStateContext.tsx` | 20 min | T02 |
| T04 | Cities seed file (30 in code, 200 in JSON) | `src/lib/cities.ts`, `src/lib/data/cities.json` | 60 min | T01 |
| T05 | City lookup + slug helpers | `src/lib/cities.ts` + test | 30 min | T04 |
| T06 | `computeSunrise(date, lat, lon, tz?)` using `astronomy-engine` `SearchRiseSet` | `src/lib/sunrise.ts` (new) | 75 min | T01 |
| T07 | Polar fallback (`|lat| > 66.5°` returns null; caller falls back to UTC noon) | `src/lib/sunrise.ts` | 15 min | T06 |
| T08 | `sunrise.test.ts` — 5 cities × 3 dates ±2 min vs reference | `src/lib/__tests__/sunrise.test.ts` | 60 min | T07 |
| T09 | New `computeTithiAtSunrise(date, location)` keeping legacy `computeTithi(date)` | `src/lib/tithi.ts` | 60 min | T06 |
| T10 | `tithiBoundaries(date, location): { start, end }` (binary search on 12° elongation step) | `src/lib/tithi.ts` + test | 75 min | T09 |
| T11 | 30-tithi metadata seed table | `src/lib/tithiMeta.ts` (new) + test | 90 min | T01 |
| T12 | 24 named Ekadashi mapping (lunar month × paksha → name) | `src/lib/ekadashiNames.ts` (new) + test | 60 min | T09 |
| T13 | Lunar month resolver (Chaitra → Phalguna; Amanta convention) | `src/lib/lunarMonth.ts` (new) + test | 75 min | T09 |
| T14 | Adhik (intercalary) month detector | `src/lib/lunarMonth.ts` | 45 min | T13 |
| T15 | Extend `SomaDayKind` union: `pradosh`, `sankashti-chaturthi`, `shivaratri` | `src/lib/types.ts` | 15 min | T01 |
| T16 | New TARGETS in `lunar.ts` for Pradosh / Sankashti / Shivaratri | `src/lib/lunar.ts` | 75 min | T09, T15 |
| T17 | Migrate all `computeTithi(date)` call sites to `computeTithiAtSunrise(date, location)` | `src/lib/lunar.ts`, `src/screens/Today.tsx`, `src/screens/Calendar.tsx`, `src/components/Calendar.tsx` | 60 min | T09 |
| T18 | `paranaWindow(fastDate, location): { earliest, latest }` | `src/lib/parana.ts` (new) + test | 60 min | T10 |
| T19 | Citations module + 30 seed entries | `src/lib/citations.ts` (new) + test | 75 min | — |
| T20 | `<ReceiptChip />` component (icon + popover) | `src/components/ReceiptChip.tsx` (new) + test | 45 min | T19 |
| T21 | Receipts banner: "computed at sunrise <city>, source: astronomy-engine" | `src/components/ComputedAtBanner.tsx` (new) | 30 min | T17 |
| T22 | Onboarding: optional "Where are you?" step with autocomplete | `src/screens/onboarding/LocationStep.tsx` (new), `src/screens/Onboarding.tsx` | 90 min | T03, T05 |
| T23 | Settings: change-location control | `src/screens/Settings.tsx` | 30 min | T22 |
| T24 | Calendar cell decorations: Pradosh (▲), Sankashti (◼), Shivaratri (✚), Ekadashi (gold ring), Purnima (filled glow), Amavasya (dark dot) | `src/components/Calendar.tsx` | 60 min | T16 |
| T25 | `whyThisDay.ts` copy for `pradosh`, `sankashti-chaturthi`, `shivaratri` in 3 voices | `src/lib/whyThisDay.ts`, `src/i18n/copy.ts` | 75 min | T15, S1 voices |
| T26 | Today selected-day card: named Ekadashi title + parana window | `src/screens/Today.tsx` | 45 min | T12, T18 |
| T27 | ICS event description includes parana window + computed-at-sunrise note | `src/lib/ics.ts` | 30 min | T18 |
| T28 | Drik Panchang parity test fixture: 3 cities × 30 dates | `src/lib/__tests__/drikParity.test.ts`, `src/lib/data/drik-fixtures.json` | 90 min | T17 |

---

## B. Type Definitions

### `src/lib/types.ts` additions

```ts
// Location & geographic
export interface Location {
  lat: number;             // -90..90
  lon: number;             // -180..180
  label: string;           // "Kathmandu" or "37.77, -122.42"
  slug: string;            // "kathmandu", used for SEO + URL routing in S5
  tz: string;              // IANA zone e.g. "Asia/Kathmandu"
  countryCode?: string;    // ISO 3166-1 alpha-2
}

export interface City {
  slug: string;
  label: string;
  lat: number;
  lon: number;
  tz: string;
  countryCode: string;
  population?: number;
}

// Tithi accuracy provenance
export type TithiAccuracy = 'sunrise' | 'approximate' | 'polar-fallback';

// Extended SomaDayKind
export type SomaDayKind =
  | 'ekadashi'
  | 'full-moon'      // existing → maps to Purnima
  | 'new-moon'       // existing → maps to Amavasya
  | 'chaturthi'      // existing — Shukla Chaturthi (Vinayaka)
  | 'pradosh'              // NEW — Trayodashi (13th tithi), Shukla & Krishna
  | 'sankashti-chaturthi'  // NEW — Krishna Chaturthi (lunar month-bound)
  | 'shivaratri';          // NEW — Krishna Chaturdashi monthly + Maha Shivaratri yearly

// Profile extension
export interface UserProfile {
  // ...existing fields
  location?: Location | null;
}

// SomaDay extension
export interface SomaDay {
  // ...existing
  /** ISO 8601 sunrise instant used to anchor the tithi computation. */
  sunriseAt?: string | null;
  /** Optional named Ekadashi like "Putrada", "Vaikuntha". */
  ekadashiName?: string | null;
  /** Lunar month index 1..12 (Chaitra=1) — present when location provided. */
  lunarMonth?: number;
  /** True if this day falls inside an Adhik (intercalary) month. */
  adhik?: boolean;
  tithi?: {
    index: number;
    indexInPaksha: number;
    paksha: 'shukla' | 'krishna';
    name: string;
    accuracy: TithiAccuracy;        // NEW
    boundaryStart?: string | null;  // ISO instant, NEW
    boundaryEnd?: string | null;    // ISO instant, NEW
  };
}

export interface AppState {
  profile: UserProfile | null;
  schedule: SomaDay[];
  sessions: FastSession[];
  onboardingComplete: boolean;
  preferences: Preferences;
  version: 3;                      // bumped from 2
}
```

### `src/lib/tithi.ts` — new signatures (legacy retained)

```ts
export interface TithiInfo extends Tithi {
  accuracy: TithiAccuracy;
  anchor: 'sunrise' | 'utc-noon';
  anchorAt: Date;
}

/** Legacy — kept for non-location call sites; flagged 'approximate'. */
export function computeTithi(date: Date): Tithi;

/** NEW canonical entry point. */
export function computeTithiAtSunrise(
  date: Date,
  location?: Location | null,
): TithiInfo;

/** Returns the local-day tithi window in UTC instants. */
export function tithiBoundaries(
  date: Date,
  location?: Location | null,
): { start: Date; end: Date };
```

### `src/lib/sunrise.ts`

```ts
export interface SunriseResult {
  date: Date;                          // UTC instant of sunrise
  approximate: boolean;                // true if polar fallback applied
}

export function computeSunrise(
  date: Date,
  lat: number,
  lon: number,
): SunriseResult | null;
```

### `src/lib/tithiMeta.ts`

```ts
export type FastingClass =
  | 'major-fast'   // Ekadashi, Maha Shivaratri
  | 'minor-fast'   // Pradosh, Sankashti, Shivaratri (monthly)
  | 'observance'   // Purnima, Amavasya
  | 'auspicious'   // Akshaya Tritiya-class days
  | 'neutral';

export type Energy = 'rising' | 'peak' | 'falling' | 'still';

export type RecommendedPractice =
  | 'fast' | 'meditate' | 'reflect' | 'celebrate' | 'rest';

export interface TithiMeta {
  index: number;                       // 1..30
  paksha: 'shukla' | 'krishna';
  name: string;                        // ASCII e.g. "Pratipada"
  iast: string;                        // IAST e.g. "Pratipadā"
  deity: string;                       // "Agni"
  fastingClass: FastingClass;
  fastingName?: string;                // "Ekadashi", "Pradosh"
  oneWordBenefit: string;              // "Clarity"
  energy: Energy;
  recommendedPractice: RecommendedPractice;
  citationIds: string[];               // keys into CITATIONS
}

export const TITHI_META: Record<number, TithiMeta>;
export function getTithiMeta(index: number): TithiMeta;
```

### `src/lib/citations.ts`

```ts
export type CitationType = 'study' | 'tradition';
export type CitationTradition = 'puranic' | 'vedic' | 'ayurvedic' | 'modern';

export interface Citation {
  id: string;                          // 'autophagy-mizushima-2008'
  type: CitationType;
  title: string;
  summary: string;                     // ≤140 chars
  url: string;
  tradition?: CitationTradition;
  doi?: string;
  year?: number;
}

export const CITATIONS: Record<string, Citation>;
export function getCitation(id: string): Citation | null;
```

---

## C. Sunrise Pseudocode (T06)

```ts
import { Body, MakeTime, Observer, SearchRiseSet } from 'astronomy-engine';

export function computeSunrise(
  date: Date,
  lat: number,
  lon: number,
): SunriseResult | null {
  // Polar safety: above ~66.5° sun may not rise/set on a given day.
  if (Math.abs(lat) > 66.5) return null;

  const observer = new Observer(lat, lon, 0);
  // Search up to 1 day forward from local-midnight-UTC of the target date.
  const startUtc = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    0, 0, 0, 0,
  ));
  const startTime = MakeTime(startUtc);
  // direction +1 = rising; limitDays = 1
  const result = SearchRiseSet(Body.Sun, observer, +1, startTime, 1.0);
  if (!result) return null;
  return { date: result.date, approximate: false };
}
```

`computeTithiAtSunrise`:

```ts
export function computeTithiAtSunrise(
  date: Date,
  location?: Location | null,
): TithiInfo {
  if (!location) {
    const noon = new Date(date); noon.setUTCHours(12, 0, 0, 0);
    return { ...computeTithi(noon), accuracy: 'approximate', anchor: 'utc-noon', anchorAt: noon };
  }
  const sr = computeSunrise(date, location.lat, location.lon);
  if (!sr) {
    const noon = new Date(date); noon.setUTCHours(12, 0, 0, 0);
    return { ...computeTithi(noon), accuracy: 'polar-fallback', anchor: 'utc-noon', anchorAt: noon };
  }
  return { ...computeTithi(sr.date), accuracy: 'sunrise', anchor: 'sunrise', anchorAt: sr.date };
}
```

`tithiBoundaries` finds the elongation crossings of `floor(elong/12)*12` and `(floor(elong/12)+1)*12` via 30-iter bisection over a ±36 hour window around the anchor.

---

## D. 30-Tithi Seed Table (data table — full populated in `tithiMeta.ts`)

| idx | paksha | name | iast | deity | fastingClass | fastingName | benefit | energy | practice |
|-----|--------|------|------|-------|--------------|-------------|---------|--------|----------|
| 1 | shukla | Pratipada | Pratipadā | Agni | neutral | — | Beginning | rising | reflect |
| 2 | shukla | Dwitiya | Dvitīyā | Brahma/Ashwini | neutral | — | Steadiness | rising | reflect |
| 3 | shukla | Tritiya | Tṛtīyā | Gauri | auspicious | Akshaya | Abundance | rising | celebrate |
| 4 | shukla | Chaturthi | Caturthī | Ganesha | minor-fast | Vinayaka Chaturthi | Removal | rising | reflect |
| 5 | shukla | Panchami | Pañcamī | Naga | neutral | — | Knowledge | rising | reflect |
| 6 | shukla | Shashthi | Ṣaṣṭhī | Kartikeya | neutral | — | Vitality | rising | meditate |
| 7 | shukla | Saptami | Saptamī | Surya | observance | — | Radiance | rising | meditate |
| 8 | shukla | Ashtami | Aṣṭamī | Durga | minor-fast | Durga Ashtami | Strength | rising | meditate |
| 9 | shukla | Navami | Navamī | Durga/Rama | observance | Rama Navami | Devotion | rising | celebrate |
| 10 | shukla | Dashami | Daśamī | Yama | neutral | — | Patience | peak | reflect |
| 11 | shukla | Ekadashi | Ekādaśī | Vishnu | major-fast | Ekadashi | Clarity | peak | fast |
| 12 | shukla | Dwadashi | Dvādaśī | Vishnu | observance | Parana | Release | peak | rest |
| 13 | shukla | Trayodashi | Trayodaśī | Shiva (Pradosh) | minor-fast | Pradosh | Surrender | peak | meditate |
| 14 | shukla | Chaturdashi | Caturdaśī | Shiva | observance | — | Discernment | peak | reflect |
| 15 | shukla | Purnima | Pūrṇimā | Soma (Moon) | observance | Purnima | Fullness | peak | celebrate |
| 16 | krishna | Pratipada | Pratipadā | Agni | neutral | — | Letting-go | falling | reflect |
| 17 | krishna | Dwitiya | Dvitīyā | Brahma | neutral | — | Yielding | falling | rest |
| 18 | krishna | Tritiya | Tṛtīyā | Gauri | neutral | — | Gentleness | falling | rest |
| 19 | krishna | Chaturthi | Caturthī | Ganesha | minor-fast | Sankashti Chaturthi | Obstacle-clearing | falling | fast |
| 20 | krishna | Panchami | Pañcamī | Naga | neutral | — | Caution | falling | reflect |
| 21 | krishna | Shashthi | Ṣaṣṭhī | Kartikeya | neutral | — | Resilience | falling | rest |
| 22 | krishna | Saptami | Saptamī | Surya | neutral | — | Endurance | falling | rest |
| 23 | krishna | Ashtami | Aṣṭamī | Kalashtami | minor-fast | Kalashtami | Inner-fire | falling | meditate |
| 24 | krishna | Navami | Navamī | Durga | neutral | — | Quietude | falling | reflect |
| 25 | krishna | Dashami | Daśamī | Yama | neutral | — | Acceptance | still | rest |
| 26 | krishna | Ekadashi | Ekādaśī | Vishnu | major-fast | Ekadashi | Clarity | still | fast |
| 27 | krishna | Dwadashi | Dvādaśī | Vishnu | observance | Parana | Release | still | rest |
| 28 | krishna | Trayodashi | Trayodaśī | Shiva (Pradosh) | minor-fast | Pradosh | Surrender | still | meditate |
| 29 | krishna | Chaturdashi | Caturdaśī | Shiva | minor-fast | Shivaratri (monthly) | Stillness | still | meditate |
| 30 | krishna | Amavasya | Amāvasyā | Pitru | observance | Amavasya | Reset | still | rest |

Each row also carries `citationIds` referencing 1–3 entries from `CITATIONS` (e.g. `['ekadashi-padma-purana', 'autophagy-mizushima-2008']`).

---

## E. 24 Named Ekadashi Mapping (T12)

`ekadashiName(lunarMonth: 1..12, paksha: 'shukla'|'krishna', adhik: boolean): string`. If `adhik` is true, Ekadashis use prefix `Padmini` (Shukla) / `Parama` (Krishna) overriding both columns.

| Lunar Month | Shukla Ekadashi | Krishna Ekadashi |
|-------------|-----------------|------------------|
| 1 Chaitra | Kamada | Varuthini |
| 2 Vaishakha | Mohini | Apara |
| 3 Jyeshtha | Nirjala | Yogini |
| 4 Ashadha | Devshayani (Shayani) | Kamika |
| 5 Shravana | Pavitra (Putrada) | Aja |
| 6 Bhadrapada | Parsva (Parivartini) | Indira |
| 7 Ashwin | Papankusha | Rama |
| 8 Kartika | Devotthani (Prabodhini) | Utpanna |
| 9 Margashirsha | Mokshada | Saphala |
| 10 Pausha | Pausha Putrada | Shattila |
| 11 Magha | Jaya | Vijaya |
| 12 Phalguna | Amalaki | Papamochani |

Full list of 24 + 2 Adhik names = 26 entries in the file. Source: Drik Panchang almanac and Padma Purana citation `ekadashi-padma-purana` in `citations.ts`.

---

## F. Cities Seed (T04)

`src/lib/cities.ts` exports the 30 most-relevant seed cities inline; `src/lib/data/cities.json` carries the full top-200 list (loaded lazily). Bundle budget: ≤15 KB gzipped for the JSON; ≤2 KB for inline seed.

Inline seed (30 cities, abbreviated columns: `slug · label · lat · lon · tz · cc`):

```
varanasi · Varanasi · 25.3176 · 82.9739 · Asia/Kolkata · IN
delhi · Delhi · 28.6139 · 77.2090 · Asia/Kolkata · IN
mumbai · Mumbai · 19.0760 · 72.8777 · Asia/Kolkata · IN
bengaluru · Bengaluru · 12.9716 · 77.5946 · Asia/Kolkata · IN
chennai · Chennai · 13.0827 · 80.2707 · Asia/Kolkata · IN
kolkata · Kolkata · 22.5726 · 88.3639 · Asia/Kolkata · IN
hyderabad · Hyderabad · 17.3850 · 78.4867 · Asia/Kolkata · IN
ahmedabad · Ahmedabad · 23.0225 · 72.5714 · Asia/Kolkata · IN
pune · Pune · 18.5204 · 73.8567 · Asia/Kolkata · IN
jaipur · Jaipur · 26.9124 · 75.7873 · Asia/Kolkata · IN
kathmandu · Kathmandu · 27.7172 · 85.3240 · Asia/Kathmandu · NP
colombo · Colombo · 6.9271 · 79.8612 · Asia/Colombo · LK
dhaka · Dhaka · 23.8103 · 90.4125 · Asia/Dhaka · BD
singapore · Singapore · 1.3521 · 103.8198 · Asia/Singapore · SG
dubai · Dubai · 25.2048 · 55.2708 · Asia/Dubai · AE
london · London · 51.5074 · -0.1278 · Europe/London · GB
new-york · New York · 40.7128 · -74.0060 · America/New_York · US
los-angeles · Los Angeles · 34.0522 · -118.2437 · America/Los_Angeles · US
san-francisco · San Francisco · 37.7749 · -122.4194 · America/Los_Angeles · US
chicago · Chicago · 41.8781 · -87.6298 · America/Chicago · US
toronto · Toronto · 43.6532 · -79.3832 · America/Toronto · CA
vancouver · Vancouver · 49.2827 · -123.1207 · America/Vancouver · CA
sydney · Sydney · -33.8688 · 151.2093 · Australia/Sydney · AU
melbourne · Melbourne · -37.8136 · 144.9631 · Australia/Melbourne · AU
auckland · Auckland · -36.8485 · 174.7633 · Pacific/Auckland · NZ
johannesburg · Johannesburg · -26.2041 · 28.0473 · Africa/Johannesburg · ZA
nairobi · Nairobi · -1.2921 · 36.8219 · Africa/Nairobi · KE
tokyo · Tokyo · 35.6762 · 139.6503 · Asia/Tokyo · JP
hong-kong · Hong Kong · 22.3193 · 114.1694 · Asia/Hong_Kong · HK
paris · Paris · 48.8566 · 2.3522 · Europe/Paris · FR
```

The remaining 170 cities live in `src/lib/data/cities.json` (capitals + cities >1M population + diaspora hubs).

Helpers: `findCityBySlug(slug)`, `searchCities(q, limit=8)` (case-insensitive prefix + substring score).

---

## G. Migration Matrix — `computeTithi` Call Sites (T17)

| File | Line | Current call | Replacement | Notes |
|---|---|---|---|---|
| `src/lib/lunar.ts` | 101 | `computeTithi(eventDate)` | `computeTithiAtSunrise(eventDate, profile?.location ?? null)` | `generateSchedule` gains `location?: Location` parameter; thread through |
| `src/screens/Today.tsx` | 47 | `computeTithi(selectedDateNoonUtc)` | `computeTithiAtSunrise(selectedDateNoonUtc, state.profile?.location)` | UI unchanged, badge added |
| `src/screens/Calendar.tsx` | 31 | `computeTithi(noonUtc)` | `computeTithiAtSunrise(noonUtc, state.profile?.location)` | Selected-day metadata only |
| `src/components/Calendar.tsx` | 70 | `computeTithi(noonUtc)` | `computeTithiAtSunrise(noonUtc, location)` | Pass `location` prop down from screen |
| `src/lib/__tests__/tithi.test.ts` | multi | `computeTithi(...)` | Keep legacy tests; add new `tithi.sunrise.test.ts` | No breakage |

`generateSchedule` signature change:

```ts
// before
export function generateSchedule(from: Date, days: number, intensity: Intensity): SomaDay[];
// after
export function generateSchedule(
  from: Date,
  days: number,
  intensity: Intensity,
  location?: Location | null,
): SomaDay[];
```

All callers in `Onboarding.tsx`, `Today.tsx`, `AppStateContext.tsx` updated to pass `state.profile?.location ?? null`.

---

## H. Parana Window (T18)

Rule (per Drik Panchang convention):
- Parana opens at **sunrise of the day after** the Ekadashi fast day.
- It must close before **Dwadashi tithi end** OR within the **first quarter of Dwadashi duration**, whichever is shorter.
- If Dwadashi ends before sunrise next day, parana shifts: open at sunrise of the *next* day where Dwadashi is still active.

```ts
export interface ParanaWindow {
  earliest: Date;   // sunrise of parana day
  latest: Date;     // min(dwadashiEnd, sunrise + dwadashiDuration/4)
  paranaDay: Date;  // ISO date used for display
}

export function paranaWindow(
  fastDate: Date,
  location?: Location | null,
): ParanaWindow | null;
```

Returns `null` when location absent (degraded UI: "Break fast at sunrise tomorrow").

---

## I. Receipts UI (T20–T21)

**`<ComputedAtBanner />`** — small inline pill above Today/Calendar selected-day card:

```
🌅 Computed at sunrise · Kathmandu (06:42 NST) · source: astronomy-engine
```

When `accuracy === 'approximate'`: yellow caution dot + "Set your location for sunrise-accurate timing →".
When `accuracy === 'polar-fallback'`: gray dot + "Polar region — using UTC noon fallback".

**`<ReceiptChip citationId="autophagy-mizushima-2008" />`** — inline `<sup>` link with bookmark icon. On tap: opens overlay with title, 1-line summary, "Read source →" outbound link. Honors `prefers-reduced-motion`. ESC closes.

Voice-aware overlay header per `useVoice()`:
- coach: "Why we're saying this"
- scientific: "Reference"
- traditional: "Source"

---

## J. Calendar Cell Decorations (T24)

| Kind | Decoration | A11y label |
|---|---|---|
| ekadashi | gold ring, 2px | "Ekadashi — major fast" |
| full-moon (purnima) | filled radial glow + soft halo | "Purnima — full moon" |
| new-moon (amavasya) | small dark dot center | "Amavasya — new moon" |
| pradosh | small upward triangle bottom-right | "Pradosh — Trayodashi observance" |
| sankashti-chaturthi | small filled square bottom-right | "Sankashti Chaturthi" |
| shivaratri | cross/plus glyph bottom-right | "Shivaratri" |
| chaturthi (Vinayaka) | hollow circle bottom-right | "Vinayaka Chaturthi" |

All decorations use `var(--accent)` so they remain theme-aware. Min cell touch target 44×44.

---

## K. Citation Seed (T19) — 30 entries

Authored set covers (file `src/lib/citations.ts`):

**Modern studies (15):**
- `autophagy-mizushima-2008` — Autophagy fights disease through cellular self-digestion (Nature 2008)
- `tre-de-cabo-2019` — Effects of Time-Restricted Eating on Health (NEJM 2019)
- `tre-anton-2018` — Flipping the Metabolic Switch (Obesity 2018)
- `lunar-cajochen-2013` — Evidence that the Lunar Cycle Influences Human Sleep (Current Biology 2013)
- `lunar-casiraghi-2021` — Moonstruck sleep: Synchronization of human sleep with the moon cycle (Science Advances 2021)
- `parasympathetic-fasting-mattson-2017` — Impact of intermittent fasting on health (Ageing Res Rev 2017)
- `hrv-fasting-zarse-2012` — Differential effects of caloric restriction on HRV (PLoS One 2012)
- `cognition-fasting-currenti-2021` — Effects of intermittent fasting on cognition (Nutrients 2021)
- `circadian-panda-2016` — Circadian physiology of metabolism (Science 2016)
- `meditation-tang-2015` — The neuroscience of mindfulness meditation (Nat Rev Neurosci 2015)
- `breaking-fast-paoli-2019` — The influence of meal frequency and timing on health (Nutrients 2019)
- `bmi-tre-wilkinson-2020` — Ten-Hour Time-Restricted Eating Reduces Weight (Cell Metabolism 2020)
- `gut-circadian-thaiss-2014` — Trans-kingdom control of microbiota diurnal oscillations (Cell 2014)
- `cortisol-fasting-stewart-1973` — Adrenal cortex response to prolonged fasting (J Clin Endocrinol 1973)
- `insulin-tre-sutton-2018` — Early Time-Restricted Feeding Improves Insulin Sensitivity (Cell Metabolism 2018)

**Tradition (15):**
- `ekadashi-padma-purana` — Padma Purana, Uttara Khanda, ch. 47–58 (Ekadashi mahatmya)
- `ekadashi-skanda-purana` — Skanda Purana on Ekadashi observance
- `pradosh-skanda-purana` — Pradosh Vrata mahatmya (Skanda Purana)
- `sankashti-ganesha-purana` — Ganesha Purana on Sankashti Chaturthi
- `shivaratri-ishana-samhita` — Ishana Samhita on Maha Shivaratri
- `purnima-vishnu-dharmottara` — Vishnu Dharmottara Purana on Purnima
- `amavasya-garuda-purana` — Garuda Purana on Pitru observance
- `tithi-surya-siddhanta` — Surya Siddhanta on tithi computation (sunrise anchor)
- `panchanga-narada-purana` — Narada Purana on panchanga elements
- `parana-hemadri-vrata-khanda` — Hemadri's Vrata Khanda on parana rules
- `ayurveda-charaka-vimana` — Charaka Samhita Vimana Sthana on fasting (langhana)
- `ayurveda-sushruta-uttara` — Sushruta Samhita Uttara Tantra on dosha effects
- `ayurveda-ashtanga-hridaya` — Ashtanga Hridaya on circadian rhythm
- `nirjala-bhavishya-purana` — Bhavishya Purana on Nirjala Ekadashi
- `mokshada-brahmavaivarta` — Brahmavaivarta Purana on Mokshada Ekadashi

Each `Citation.summary` ≤140 chars. URLs preferred to public archives (sacred-texts.com, archive.org, doi.org). All entries reviewed in `docs/CONTENT_REVIEW.md` (PR-attached).

---

## L. Codebase-Specific Risks (15)

| # | Risk | Where | Mitigation |
|---|---|---|---|
| H1 | `astronomy-engine`'s `SearchRiseSet` requires elevation `Observer(lat, lon, 0)` — mismatch with high-altitude cities | `sunrise.ts` | Document; ±2 min tolerance covers ≤1 km altitude error; revisit if user reports |
| H2 | Polar fallback at 66.5° but Iceland (Reykjavik 64.1°) still has near-no-set days near solstice | `sunrise.ts` | Detect `result==null` from `SearchRiseSet`, fall back regardless of lat threshold |
| H3 | `generateSchedule` signature change breaks `Onboarding.tsx`, `AppStateContext.tsx` callers | `lunar.ts:84` | T17 includes a tree-wide grep + fixup; default `location=null` keeps legacy behavior |
| H4 | Existing `computeTithi(date)` UTC-noon callers would now silently shift if migrated naively | `tithi.ts:44` | Keep legacy function; add new `computeTithiAtSunrise`; migrate explicitly in T17 |
| H5 | `tithiBoundaries` bisection drift near tithi-junction during Vrishchika sankranti | `tithi.ts` | Use 30-iter bisection (≤2 sec resolution); test with ±10 known boundary timestamps |
| H6 | 24 named Ekadashi mapping depends on lunar month resolution (Amanta vs Purnimanta) | `lunarMonth.ts` | Standardize on **Amanta** (South Indian); document; add toggle later if needed |
| H7 | Adhik (intercalary) month detection is non-trivial — requires sankranti calc | `lunarMonth.ts` | Use simple rule: if synodic month contains no solar sankranti → Adhik; cite Surya Siddhanta |
| H8 | Top-200 cities JSON inflates bundle if eagerly imported | `cities.ts` | Lazy import via `import('./data/cities.json')` inside `searchCities` only when query.length ≥ 2 |
| H9 | Existing uncommitted changes in working tree (`src/lib/tithi.ts`, `src/screens/Today.tsx`, `src/screens/Calendar.tsx`) | git status | Read working-tree files before T01; rebase tasks on top, don't overwrite |
| H10 | Calendar component currently computes tithi for all 42 cells per render — adding sunrise per cell is 42× sunrise calls | `components/Calendar.tsx:70` | Memoize sunrise per `(iso, location.slug)`; cap at 42; benchmark <50 ms p95 |
| H11 | Drik parity fixture may diverge as ephemeris precision improves in `astronomy-engine` releases | `drikParity.test.ts` | Pin `astronomy-engine` version in `package.json`; tolerance ±2 min on boundaries, ±1 tithi index |
| H12 | `paranaWindow` returns localized `Date` objects but ICS expects DTSTART in IANA tz | `ics.ts` | Reuse existing `formatLocal` helper from `ics.ts`; Date in UTC, format with profile.timezone |
| H13 | New `SomaDayKind` union members break exhaustive switches in `whyThisDay.ts`, `Calendar.tsx`, `lunar.ts::TARGETS` | grep `SomaDayKind` | T15 includes `// @ts-expect-error` audit; CI fails on missing case |
| H14 | Storage migration v3 must not corrupt v2 beta state (preferences from S1) | `storage.ts` | Additive-only: spread previous state, add new fields with defaults; idempotent test |
| H15 | Settings already has `confirm()` for reset; adding location-change prompt grows modal coupling | `Settings.tsx` | Use existing toast pattern; no extra `confirm()` for non-destructive change |

---

## M. PR Slicing — 4 PRs (each <30 min review)

| PR | Scope | Tasks | LOC | Review |
|---|---|---|---|---|
| **PR 1** Geography & sunrise | types, migration v3, cities, sunrise lib, AppStateContext wiring | T01–T08 | ~550 | 30 min |
| **PR 2** Sunrise-anchored tithi + metadata | new computeTithi, boundaries, parana, 30-tithi seed, ekadashi names, lunar month, adhik | T09–T18 | ~700 | 30 min |
| **PR 3** New SomaDayKinds + UI migration | SomaDayKind extension, TARGETS, call-site migration, Calendar decorations, whyThisDay copy | T15, T16, T17, T24, T25 | ~600 | 30 min |
| **PR 4** Receipts + onboarding + parity | citations, ReceiptChip, ComputedAtBanner, LocationStep, Settings, Today named-Ekadashi + parana, ICS, Drik parity test | T19–T23, T26–T28 | ~650 | 30 min |

**Sequencing:** PR 2 needs PR 1 (types + sunrise). PR 3 needs PR 2 (computeTithiAtSunrise). PR 4 needs PR 3 (SomaDayKind kinds populate calendar before Receipts can label them).

Each PR ships with green typecheck + test + build.

---

## N. Test Additions

- `src/lib/__tests__/sunrise.test.ts` — 5 cities × 3 dates ±2 min: Varanasi 2026-04-28, Kathmandu 2026-06-21, NYC 2025-12-21, Reykjavik 2026-06-21 (returns null), Sydney 2025-09-22.
- `src/lib/__tests__/tithi.sunrise.test.ts` — anchor difference: same date, Kathmandu vs LA returns different tithi index ~6× per year (boundary days).
- `src/lib/__tests__/tithi.boundaries.test.ts` — 10 known boundary timestamps × 3 cities; assert `start < anchor < end`.
- `src/lib/__tests__/tithiMeta.test.ts` — all 30 entries have non-empty name, iast, deity, oneWordBenefit; citationIds resolve.
- `src/lib/__tests__/ekadashiNames.test.ts` — full year 2026 Ekadashi dates (24) produce expected names; Adhik Padmini test fixture.
- `src/lib/__tests__/lunarMonth.test.ts` — sample dates produce expected month index; Adhik detection 2023-Shravana fixture.
- `src/lib/__tests__/parana.test.ts` — parana window respects Dwadashi end; null when location missing.
- `src/lib/__tests__/cities.test.ts` — slug uniqueness; lazy load doesn't bloat initial; `searchCities('var')` returns Varanasi first.
- `src/lib/__tests__/citations.test.ts` — every TithiMeta.citationIds resolves to a CITATIONS entry.
- `src/lib/__tests__/migration.v3.test.ts` — v2 → v3 idempotent; preserves preferences; adds `profile.location=null`.
- `src/lib/__tests__/drikParity.test.ts` — fixture: 3 cities × 30 dates from `drik-fixtures.json`; tithi index match exact, paksha match exact, sunrise ±2 min.
- `src/components/__tests__/ReceiptChip.test.tsx` — opens overlay, ESC closes, focus returns to trigger.
- `src/components/__tests__/ComputedAtBanner.test.tsx` — 3 accuracy modes render correct copy.
- `src/__tests__/regression.test.tsx` — full flow: pick city → schedule shows Pradosh + Sankashti + Shivaratri in 60-day window; named Ekadashi appears.

Coverage target ≥80% per repo policy.

---

## O. Acceptance Criteria

- [ ] `Location` persisted in `state.profile.location` and survives reload
- [ ] `computeSunrise` returns within ±2 min vs reference for all seed cities <60° latitude
- [ ] Polar regions return null and `accuracy: 'polar-fallback'` propagates to UI
- [ ] All `computeTithi(date)` call sites in `src/screens/*` and `src/components/Calendar.tsx` migrated to `computeTithiAtSunrise`
- [ ] `generateSchedule` accepts optional `location` and tags each `SomaDay` with `sunriseAt` and `tithi.accuracy`
- [ ] Pradosh, Sankashti Chaturthi, and Shivaratri appear in a 60-day generated schedule
- [ ] Named Ekadashi appears in Today header (e.g. "Putrada Ekadashi · Lunar Day 11 · Clarity")
- [ ] Parana window displays on Ekadashi selected-day card and ICS event description
- [ ] All 30 tithis have full `TithiMeta` populated; lint enforces non-empty fields
- [ ] All 24 Ekadashi names + 2 Adhik names resolve correctly for 2026 calendar year
- [ ] `<ComputedAtBanner />` renders with city, sunrise time, and "source: astronomy-engine"
- [ ] `<ReceiptChip />` opens overlay; voice-aware header copy
- [ ] Calendar cells visually distinguish all 7 kinds (gold ring / glow / dot / triangle / square / cross / hollow circle)
- [ ] Tithi index for 3 reference cities × 30 dates matches Drik Panchang fixture (≥97% exact, 100% within ±1 index)
- [ ] Storage migrates v2 → v3 without data loss; idempotent test passes
- [ ] Bundle size delta <30 KB gzipped (cities JSON lazy)
- [ ] `npm run typecheck && npm run test && npm run build` green

---

## P. Citations to Cite In-Spec (this doc)

- Drik Panchang (https://www.drikpanchang.com/) — primary parity reference
- `astronomy-engine` (https://github.com/cosinekitty/astronomy) — Don Cross, MIT licensed, CC0 ephemeris derivations
- Surya Siddhanta — sunrise anchoring tradition
- Hemadri's Chaturvarga Chintamani, Vrata Khanda — parana rules
- Padma Purana, Skanda Purana, Bhavishya Purana — Ekadashi names + mahatmya
- Padmini & Parama Ekadashi (Adhik) — Padma Purana, Uttara Khanda

---

Status: ready for implementation
