Category: engineering

# Soma — Marketability Sprint Specs (S1–S5)

**Owner:** Tribesh
**Created:** 2026-04-28
**Goal:** Translate Soma's USP ("panchanga-grade Vedic accuracy + modern wellness UX") into product changes that make the app marketable to seven distinct general-user audiences without forking the codebase.

---

## Cross-Cutting Conventions

| Rule | Detail |
|---|---|
| State key | Bump `soma.state.v1` → `soma.state.v2` with a one-shot migration. |
| Voice keys | `t(key, voice)` with three voices: `scientific` / `traditional` / `coach`. Default = `coach`. |
| Theme tokens | Tailwind plugin reading `data-theme="performance|devotional|minimal"` on `<html>`. |
| Storage | Single `localStorage` key, JSON, immutable updates, schema-versioned. |
| Tests | Vitest unit + RTL component + 1 regression flow per sprint. ≥80% coverage. |
| Type discipline | No `any`. Every new module exports a typed interface. |
| Files | New files <300 lines; split when approaching it. |

---

# SPRINT 1 — Foundation (1 week)

**Goal:** Voice + Theme + Intent Router infrastructure so future copy and design lands per audience without duplicating screens.

## 1.1 Voice System

**New files:**
- `src/i18n/voices.ts` — voice type + registry
- `src/i18n/copy.ts` — copy keys with three variants
- `src/i18n/useVoice.ts` — hook
- `src/i18n/__tests__/copy.test.ts`

**Type:**
```ts
export type Voice = 'scientific' | 'traditional' | 'coach';

export interface CopyEntry {
  scientific: string;
  traditional: string;
  coach: string;
}

export type CopyKey =
  | 'today.fast.title'
  | 'today.fast.subtitle'
  | 'today.regular.title'
  | 'today.regular.subtitle'
  | 'today.empty.cta'
  | 'fast.start.cta'
  | 'fast.complete.celebration'
  | 'fast.late.encouragement'
  | 'mandala.label'
  | 'reset.newmoon.title'
  | 'reset.fullmoon.title'
  | 'wisdom.receipts.toggle'
  // ... full list in copy.ts
  ;
```

**Migration plan:** All hard-coded strings in `Today.tsx`, `FastTimer.tsx`, `Onboarding.tsx`, `Settings.tsx`, `whyThisDay.ts` move to copy keys. Keep current strings as the `coach` voice. Author `scientific` and `traditional` voices in the same PR.

**Storage:** `state.preferences.voice: Voice` (default `coach`).

**Acceptance:**
- Switching voice in Settings re-renders all screens with new copy within one tick.
- Snapshot tests for each voice across Today / FastTimer / Onboarding.
- Zero hard-coded user-facing strings in screens.

## 1.2 Theme System

**New files:**
- `src/themes/themes.ts` — token sets per theme
- `src/themes/useTheme.ts`
- `tailwind.config.js` — extend with theme-aware tokens

**Themes:**

| Token | Performance | Devotional | Minimal |
|---|---|---|---|
| `--surface` | `#0b1020` (cool ink) | `#120907` (warm ink) | `#0a0a0a` |
| `--accent` | `#7dd3fc` (cyan) | `#f5b042` (gold) | `#ffffff` |
| `--moon-tint` | sky-blue | warm gold | mono white |
| `--type-display` | Inter | Cormorant Garamond | Inter |
| `--data-emphasis` | strong (charts prominent) | soft (charts secondary) | minimal |

**Implementation:** CSS variables under `[data-theme=...]`. Tailwind `theme.extend.colors` reads `var(--accent)` etc.

**Storage:** `state.preferences.theme: Theme` (default `performance`).

## 1.3 Intent Router (Onboarding Step 1)

**Edit:** `src/screens/Onboarding.tsx`

**New screen position:** Insert before existing welcome step.

**Component:** `<IntentRouter />` — 4 cards in 2×2 grid.

| Card label | Sub-copy | Sets |
|---|---|---|
| "Optimize my body" | Fasting, sleep, energy data | `theme=performance`, `voice=scientific` |
| "Follow tradition" | Ekadashi, panchanga, dharma | `theme=devotional`, `voice=traditional` |
| "Tired of fasting apps" | Less choice, more rhythm | `theme=minimal`, `voice=coach` |
| "Curious about the moon" | Lunar wellness for everyone | `theme=performance`, `voice=coach` |

User can reset anytime in Settings.

**Acceptance:**
- Selecting any card persists `intent`, `theme`, `voice` to state.
- Deep-link `?reset_intent=1` allows re-running the router.
- Regression test: each of 4 paths renders Today with the correct theme + voice combo.

## 1.4 Dual Labeling

**Edit:** `src/screens/Today.tsx`, `src/components/Calendar.tsx`, `src/lib/whyThisDay.ts`

**Format:** `Lunar Day {n} · {Traditional Name} · {1-word benefit}`
- Example: `Lunar Day 11 · Putrada Ekadashi · Clarity`
- Devotional theme reverses order: `Putrada Ekadashi · Lunar Day 11 · Clarity`
- Minimal theme drops "Lunar Day": `Putrada Ekadashi · Clarity`

**New file:** `src/lib/tithiLabel.ts` — `formatTithiLabel(tithi, theme): string`

## 1.5 Synced-Now Counter

**New component:** `src/components/SyncedNowPill.tsx`

**Logic:** Deterministic pseudo-realtime number based on:
- Date (seed)
- UTC hour (modulo)
- Total observers (constant: 1.05B Hindus globally × 0.4 typical observance rate × 0.7 awake-hour decay)

**Acceptance:**
- Same number for same minute across devices (deterministic).
- Number drifts naturally minute-to-minute (±200/min).
- Only renders on observance days.
- A11y label: "Approximately 412,000 people observing today."

## 1.6 Storage Migration v1 → v2

**Edit:** `src/lib/storage.ts`

**Schema additions:**
```ts
preferences: {
  voice: Voice;        // default 'coach'
  theme: Theme;        // default 'performance'
  intent: Intent | null;
  notificationPhilosophy: 'quiet' | 'standard' | 'detailed';  // default 'quiet'
}
```

**Migration:** if `state.version === 1` (or absent), set defaults, bump to `2`. Idempotent.

## 1.7 Sprint 1 Test Plan

- `voices.test.ts` — every CopyKey has all 3 voices populated.
- `themes.test.ts` — theme switching updates `data-theme` attribute.
- `IntentRouter.test.tsx` — 4 cards render, each persists correct prefs.
- `SyncedNowPill.test.tsx` — deterministic; same minute → same number.
- `storage.migration.test.ts` — v1 state migrates cleanly with defaults.
- `regression.test.tsx` — full flow with each of 3 voice/theme combos.

**Definition of Done:**
- [ ] All hard-coded user copy migrated to keys
- [ ] Theme switch works on Today, Calendar, Settings
- [ ] Intent Router default-routes new users
- [ ] Synced-now pill renders on Ekadashi/Purnima/Amavasya
- [ ] Migration v1 → v2 covered by test
- [ ] `npm run typecheck && npm run test && npm run build` green

---

# SPRINT 2 — Authority Depth (1.5 weeks)

**Goal:** Soma's lunar data matches Drik Panchang. Vedic credibility is verifiable. Receipts mode proves the science.

## 2.1 Sunrise-Anchored Tithi

**New file:** `src/lib/sunrise.ts`
- `computeSunrise(date: Date, lat: number, lon: number): Date | null`
- Uses `astronomy-engine`'s `SearchRiseSet`
- Handles polar regions (returns null; falls back to UTC noon)

**Edit:** `src/lib/tithi.ts`
- New signature: `computeTithi(date: Date, location?: Location): TithiInfo`
- When `location` present: anchors to that day's local sunrise.
- When absent: keeps current UTC-noon behavior with an `accuracy: 'approximate'` flag.

**Edit:** `src/lib/types.ts`
```ts
export interface Location {
  lat: number;
  lon: number;
  label: string;       // "Kathmandu" or "37.77, -122.42"
  tz?: string;         // optional IANA tz
}

// UserProfile extension:
location?: Location | null;
```

**Onboarding addition:** New optional step "Where are you?" with city autocomplete.

**New file:** `src/lib/cities.ts` — top 200 cities with lat/lon + tz. Bundle size budget: <15 KB gzipped.

## 2.2 30-Tithi Metadata

**New file:** `src/lib/tithiMeta.ts`

**Type:**
```ts
export interface TithiMeta {
  index: number;                          // 1..30
  paksha: 'shukla' | 'krishna';
  name: string;                           // "Pratipada"
  romanizedSanskrit: string;              // "Pratipadā"
  deity: string;                          // "Agni"
  fastingClass:
    | 'major-fast'
    | 'minor-fast'
    | 'observance'
    | 'auspicious'
    | 'neutral';
  fastingName?: string;                   // "Ekadashi", "Pradosh"
  oneWordBenefit: string;                 // "Clarity"
  significance: { coach: string; scientific: string; traditional: string };
  ayurveda: {
    doshaEffect: ('vata'|'pitta'|'kapha')[];
    rationale: string;
    dietGuidance: string;
  };
  energy: 'rising' | 'peak' | 'falling' | 'still';
  recommendedPractice:
    | 'fast' | 'meditate' | 'reflect' | 'celebrate' | 'rest';
}

export const TITHI_META: Record<number, TithiMeta>;  // keyed 1..30
```

Full table populated for all 30 tithis. Source: Drik Panchang + Ayurveda primary sources cited in `CONTENT_REVIEW.md`.

## 2.3 Extended SomaDayKind

**Edit:** `src/lib/types.ts`
```ts
export type SomaDayKind =
  | 'ekadashi'
  | 'purnima'
  | 'amavasya'
  | 'chaturthi'
  | 'pradosh'             // NEW — Trayodashi (13th)
  | 'sankashti-chaturthi' // NEW — Krishna Chaturthi
  | 'shivaratri'          // NEW — Krishna Chaturdashi monthly
  | 'regular';
```

**Edit:** `src/lib/lunar.ts` — add new TARGETS for Pradosh / Sankashti / Shivaratri using sunrise-anchored tithi index lookups.

**Edit:** `src/lib/whyThisDay.ts` — copy for the 3 new kinds in all 3 voices.

**Edit:** `src/components/Calendar.tsx` — distinct cell decoration:
- Ekadashi: gold ring
- Purnima: filled glow
- Amavasya: dark dot
- Pradosh: triangle indicator
- Sankashti Chaturthi: small square
- Shivaratri: cross indicator

## 2.4 Named Ekadashi

**New file:** `src/lib/ekadashiNames.ts`

```ts
// Maps (lunar month, paksha) → Ekadashi name
// 24 named Ekadashis covering 12 lunar months × 2 pakshas
export function ekadashiName(date: Date, location?: Location): string;
```

Names: Putrada, Mokshada, Vaikuntha, Saphala, Kamada, Varuthini, Mohini, Apara, Nirjala, Yogini, Devshayani, Kamika, Pavitra, Aja, Parsva (Parivartini), Indira, Papankusha, Rama, Devotthani (Prabodhini), Utpanna, Saphala, Pausha Putrada... (full list of 24 in file).

**Display:** `Today.tsx` selected-day card title becomes `"{Ekadashi name} Ekadashi"`.

## 2.5 Parana Time

**Edit:** `src/lib/tithi.ts`
- New: `tithiBoundaries(date: Date, location?: Location): { start: Date; end: Date }`
- New: `paranaWindow(fastDate: Date, location?: Location): { earliest: Date; latest: Date }`
  - Rule: Parana opens at sunrise next day, must close before Dwadashi tithi ends OR within 1/4 of Dwadashi duration (whichever is shorter).

**Display:** Today selected-day card and ICS event description: *"Break fast tomorrow between 6:42 AM and 9:18 AM"*.

## 2.6 Receipts Mode

**Edit:** `src/screens/Learn.tsx` (rename to Wisdom in S4)

**New component:** `<ReceiptChip />` — small inline link with citation icon. On tap: opens overlay with study/source title + 1-sentence summary + outbound link.

**New file:** `src/lib/citations.ts`
```ts
export interface Citation {
  id: string;
  type: 'study' | 'tradition';
  title: string;
  summary: string;
  url: string;
  tradition?: 'puranic' | 'vedic' | 'ayurvedic' | 'modern';
  doi?: string;
  year?: number;
}
export const CITATIONS: Record<string, Citation>;
```

Authored set of ~30 citations covering: time-restricted eating, autophagy, lunar sleep effect, parasympathetic activation by fasting, Ekadashi puranic source, Pradosh tradition.

## 2.7 Sprint 2 Test Plan

- `sunrise.test.ts` — known sunrise times for 5 cities × 3 dates within ±2 min tolerance.
- `tithi.boundaries.test.ts` — tithi spans across 10 boundary dates × 3 cities.
- `tithiMeta.test.ts` — all 30 entries populated, all required fields non-empty.
- `ekadashiNames.test.ts` — full year of Ekadashi dates produce correct names.
- `parana.test.ts` — parana window respects Dwadashi end constraint.
- Regression: `Pradosh appears in 60-day schedule from arbitrary start date`.

**Definition of Done:**
- [ ] Soma days match Drik Panchang for 3 reference cities × 30 dates
- [ ] All 30 tithis have full metadata in 3 voices
- [ ] Pradosh/Sankashti/Shivaratri appear on calendar
- [ ] Named Ekadashi shows in Today title
- [ ] Parana time shows on selected-day card
- [ ] Receipts mode toggles in Wisdom

---

# SPRINT 3 — Habit Reframe (1 week)

**Goal:** Replace streak-driven anxiety with mandala completion. Anti-streak product semantics. Personal deltas surface real outcome data.

## 3.1 Mandala Engine

**New file:** `src/lib/mandala.ts`

**Concept:** A mandala = 40 days. After completing a mandala, user begins the next. Completion = observed ≥X out of N possible observance days within the 40-day window (X defaults to 60% of major fasts in window, configurable).

```ts
export interface Mandala {
  index: number;                 // sequential, starts at 1
  startDate: string;             // ISO
  endDate: string;               // ISO (start + 40 days)
  observed: string[];            // ISO dates of completed fasts
  expected: string[];            // ISO dates of observance days in window
  completionRate: number;        // 0..1
  status: 'in-progress' | 'completed' | 'partial';
}

export function currentMandala(state: AppState): Mandala;
export function mandalaHistory(state: AppState): Mandala[];
```

**No streak break logic.** Missed days reduce completion rate but never reset progress.

## 3.2 Trends → Rhythm Rename

**Edit:** `src/components/BottomNav.tsx`, `src/screens/Trends.tsx` → `src/screens/Rhythm.tsx`.

**Layout (top to bottom):**
1. **Mandala progress** — visual ring + "Mandala 3 of 12 · 23 of 40 days · 4 fasts observed"
2. **Personal deltas** (when ≥3 sessions logged)
   - "Your focus rises +0.7 on Shukla Ekadashi (vs baseline)"
   - "Your sleep improves +0.4 hr around Purnima"
   - Hidden until enough data; explanatory empty state otherwise
3. **Paksha grouping** — sessions list grouped by Shukla / Krishna pairs
4. **Lunar season chart** — last 12 mandalas as a horizontal strip

**No streak counters anywhere.**

## 3.3 Notification Philosophy

**Edit:** `src/components/ReminderSettings.tsx`

Replace toggles with a single radio:

| Option | Behavior |
|---|---|
| **Quiet** | 3 prompts/month: morning of major fasts only |
| **Standard** | 7 prompts/month: + Pradosh + parana reminder |
| **Detailed** | 15 prompts/month: + Sankashti + Shivaratri + sunrise tithi + reflection prompts |

Default **Quiet**. Copy framing: *"Soma is the slow app. Choose how often we should ping you."*

## 3.4 FastTimer Reframe

**Edit:** `src/screens/FastTimer.tsx`

- Primary text changes from countdown to *"You're synced with {N} people."*
- Countdown becomes secondary (smaller, below)
- Phase glyph at progress-ring head (small moon icon matching today's phase)
- **Late completion never red.** If user breaks fast late, copy says: *"Bodies aren't clocks. Logged."*
- Anti-anxiety palette: replace any red/urgent colors with theme accent

## 3.5 Sprint 3 Test Plan

- `mandala.test.ts` — completion math; no break on missed day; rolls into next mandala on day 41.
- `Rhythm.test.tsx` — renders mandala + paksha grouping; deltas hidden when <3 sessions.
- `ReminderSettings.philosophy.test.tsx` — all 3 levels produce correct schedule counts.
- Regression: missing 2 fasts in a mandala still yields a `partial` status, not break.

**Definition of Done:**
- [ ] Streak counters removed from all screens
- [ ] Mandala progress visible on Rhythm + Today header
- [ ] Notification philosophy default = Quiet for new users
- [ ] FastTimer never shows red on late completion
- [ ] Personal deltas card appears with synthetic test data

---

# SPRINT 4 — Shareability + Polish (1 week)

**Goal:** Shareable moments for organic growth. Visual polish so screenshots earn attention. Energy archetype for personalization that doesn't require Ayurveda literacy.

## 4.1 Wisdom (Learn rename) + Daily Card

**Edit:** `src/components/BottomNav.tsx`, `src/screens/Learn.tsx` → `src/screens/Wisdom.tsx`.

**New component:** `src/components/WisdomCard.tsx`
- Renders a 1080×1080 square: today's tithi + 1 line of voice-aware wisdom + Soma wordmark
- "Share" button: uses Web Share API; fallback to download PNG
- Image generated via canvas, not screenshot — sharp at any DPI

**Acceptance:**
- Card text changes per voice
- Card matches active theme palette
- File name pattern: `soma-{date}-{tithi}.png`

## 4.2 Calendar Phase Strip

**Edit:** `src/components/Calendar.tsx`

Above the grid: a thin horizontal strip showing the lunar cycle as a gradient (waxing → full → waning → new) with current position marked. Tap → scrolls calendar to that phase.

Pure SVG, no images. <2 KB gzipped.

## 4.3 Phase Glyph on FastTimer

**Edit:** `src/components/MoonPhase.tsx` and `src/screens/FastTimer.tsx`

Small (24px) phase-accurate moon glyph rides at the head of the progress ring. Not the big moon — a positional indicator that mirrors today's actual lunar phase.

## 4.4 Energy Archetype Quiz

**New file:** `src/screens/EnergyArchetype.tsx`
**New file:** `src/lib/archetype.ts`

3 questions, plain-language, no Sanskrit:
1. *"When you're stressed, you usually..."* (Wind/Vata: scattered · Fire/Pitta: irritable · Earth/Kapha: heavy/withdrawn)
2. *"Your default body state is..."* (cool & dry · warm & energized · grounded & slow)
3. *"You feel your best when..."* (in motion · in flow · in routine)

Scores → Wind / Fire / Earth dominant.

**Storage:** `state.profile.archetype: 'wind'|'fire'|'earth'|null`.

**Use:** `whyThisDay` adjusts subtle copy tone per archetype (e.g. Wind types get grounding language on rising tithis).

**Position:** Optional micro-step in onboarding after Intent Router. Skip-able. Available later in Settings.

## 4.5 Onboarding Visual Carousel

**Edit:** `src/screens/Onboarding.tsx`

Replace welcome step with a 3-card swipe carousel:
1. *"Your other rhythm"* — moon + body silhouette illustration
2. *"4 fasts a month, ancient calendar"* — calendar grid with highlights
3. *"Slow app. Loud results."* — minimal moon glyph

Pure SVG illustrations. Auto-advance optional.

## 4.6 A11y + Reduced Motion Pass

- Every animated container: `motion-reduce:animate-none`
- Skeleton loaders: 200 ms shimmer on first hydration
- ErrorBoundary wrapper around `Shell` with quiet recovery + "Reset state" escape
- Two-step destructive Reset Soma: confirm → typed "RESET" → final delete (replaces `confirm()`)
- Color contrast audit: introduce `text-soma-mist-strong` for body copy

## 4.7 Sprint 4 Test Plan

- `WisdomCard.test.tsx` — renders for each voice × theme combo.
- `archetype.test.ts` — scoring math; ties broken consistently.
- `Calendar.phaseStrip.test.tsx` — current position aligns with `tithi.index`.
- `Onboarding.carousel.test.tsx` — keyboard nav + swipe both work.
- A11y: `vitest-axe` smoke test on Today, Rhythm, Wisdom, Settings.

**Definition of Done:**
- [ ] WisdomCard share works on iOS Safari + Chrome desktop
- [ ] Phase strip matches today's tithi within 1 day
- [ ] Energy archetype persisted, recoverable from Settings
- [ ] All animated containers honor `prefers-reduced-motion`
- [ ] Reset Soma requires typed confirmation
- [ ] Lighthouse a11y ≥ 95 on Today + Rhythm

---

# SPRINT 5 — Performance Crowd (deferred, ~3 weeks when prioritized)

**Goal:** Health-data correlation seals the biohacker angle. Programmatic SEO from `tithiMeta` powers organic CAC.

## 5.1 Apple Health Integration

**Approach:** Wrap PWA in Capacitor for iOS so we can use `@capacitor-community/health-kit`.

**Data ingested (read-only):**
- Sleep duration + quality (HKCategoryValueSleepAnalysis)
- Heart rate variability (HRV)
- Resting heart rate
- Body weight (optional, on-demand)

**Storage:** `state.healthSamples` — append-only, user can delete anytime. Local-first, no upload.

**Privacy:** Explicit consent screen pre-permission prompt. Off by default. Settings toggle to disconnect.

## 5.2 Phase × Sleep Scatter

**New component:** `src/components/PhaseSleepChart.tsx`

X-axis: lunar phase (0..1 illumination). Y-axis: sleep duration. Each dot = one night. Trend line + delta callout: *"Your sleep drops 0.8 hr near full moon."*

Renders only when ≥10 nights of data.

## 5.3 Programmatic SEO

**New marketing site** (separate repo or `/marketing` subdirectory).

Generated pages from `tithiMeta`:
- `/lunar-day/{1..30}` — 60 pages
- `/ekadashi/{name}` — 24 pages
- `/{city}-panchanga` — top 200 cities

Each page: server-rendered, schema.org markup, FAQ schema, internal cross-links. Built with Astro for static export.

**Content blocks per page:**
- Today's data for that tithi/city
- Voice-aware significance
- Citations from `citations.ts`
- CTA to install Soma

## 5.4 Sprint 5 Test Plan

- HealthKit consent flow E2E (Detox)
- Synthetic data scatter render
- Programmatic page generation produces valid HTML for sample tithi/city pairs

---

# Sequencing & Dependencies

```
S1 Foundation ──► S2 Authority ──► S3 Habit Reframe ──► S4 Polish ──► S5 Health
   │                  │                  │
   └─ Voice/Theme/Intent infra unlocks copy + design across S2–S4.
                      └─ TithiMeta unlocks Wisdom Receipts + Mandala expectations + SEO content.
```

**Cannot skip S1.** Every later sprint assumes Voice + Theme.
**Can defer S5** indefinitely; S1–S4 ship a complete marketable app.

---

# Risk Register

| Risk | Severity | Mitigation |
|---|---|---|
| Voice copy authoring is huge surface area | M | Bootstrap with current strings as `coach`; author other voices in same PR; reviewer must be content-fluent |
| Theme tokens fight existing Tailwind classes | M | Migrate one screen at a time; keep current palette as Performance theme baseline |
| Sunrise math drifts at high latitudes | L | Detect lat > 60°; fall back to UTC noon with `accuracy: approximate` flag |
| Synced-now counter feels gimmicky | L | Subtle styling; render only on observance days; never animate aggressively |
| Mandala framing confuses users | M | Always show plain-language sub-line: "23 of 40 days, 4 fasts observed"; tooltip on first view |
| Programmatic SEO triggers thin-content penalty | M | Each page authored with ≥400 words unique content; no duplicate templates across cities |
| Capacitor wrap delays App Store ship | H | Treat S5 as separate track; PWA path remains primary |
| Storage migration breaks beta users | H | Additive-only schema changes; test against captured beta state snapshot |

---

# Success Metrics (post-S4)

| Metric | Baseline | Target |
|---|---|---|
| D7 retention | unknown | ≥35% |
| D30 retention | unknown | ≥18% |
| Mean fasts observed per mandala | unknown | ≥3 of ~5 |
| Wisdom card shares | 0 | 5% of weekly actives |
| Tithi accuracy vs Drik Panchang | ±1 day | ±1 minute (cities <60° lat) |
| Lighthouse a11y | unknown | ≥95 |
| Bundle size | TBD | <250 KB gzipped (excluding fonts) |

---

# File Inventory (cumulative S1–S4)

**New files:**
```
src/i18n/voices.ts
src/i18n/copy.ts
src/i18n/useVoice.ts
src/themes/themes.ts
src/themes/useTheme.ts
src/components/SyncedNowPill.tsx
src/components/ReceiptChip.tsx
src/components/WisdomCard.tsx
src/lib/sunrise.ts
src/lib/cities.ts
src/lib/tithiMeta.ts
src/lib/tithiLabel.ts
src/lib/ekadashiNames.ts
src/lib/citations.ts
src/lib/mandala.ts
src/lib/archetype.ts
src/screens/EnergyArchetype.tsx
src/screens/Rhythm.tsx           (renamed from Trends)
src/screens/Wisdom.tsx           (renamed from Learn)
docs/CONTENT_REVIEW.md
```

**Modified:**
```
src/App.tsx
src/lib/types.ts
src/lib/lunar.ts
src/lib/tithi.ts
src/lib/whyThisDay.ts
src/lib/storage.ts
src/lib/reminders.ts
src/lib/ics.ts
src/screens/Today.tsx
src/screens/Onboarding.tsx
src/screens/Settings.tsx
src/screens/FastTimer.tsx
src/components/Calendar.tsx
src/components/BottomNav.tsx
src/components/MoonPhase.tsx
src/components/ReminderSettings.tsx
src/state/AppStateContext.tsx
tailwind.config.js
```

**Removed/replaced:**
```
src/screens/Trends.tsx           → Rhythm.tsx
src/screens/Learn.tsx            → Wisdom.tsx
```

---

# Open Questions

1. **Capacitor vs pure PWA** for S5 — does Apple Health justify the App Store overhead? Decision needed before S5 starts.
2. **Subscription gating** — which features go behind paywall? Recommend: festival calendar, audio meditations, programmatic SEO premium pages. Free tier covers S1–S3 entirely.
3. **Content reviewer** — who validates Vedic copy authenticity? Tribesh, or a named consultant in `CONTENT_REVIEW.md`?
4. **Beta-user migration** — capture a snapshot of an existing beta-user state to test v1→v2 against?
5. **Marketing site stack** — Astro recommended for SEO, but adds a second runtime. Keep within main Vite repo as a sub-route, or fork to a separate Astro repo?

---

**Ready to start S1.** Awaiting confirmation to proceed.
