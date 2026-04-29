Category: engineering

# Soma — Sprint 1 Implementation-Ready Breakdown

**Owner:** Tribesh
**Created:** 2026-04-28
**Parent spec:** `2026-04-28-soma-marketability-sprints.md`
**Goal:** Voice + Theme + Intent Router infrastructure (Sprint 1) — task-by-task, code-ready, in PR-sized chunks.

---

## A. Ordered Task List

22 tasks, each leaves build green. Total effort ≈ 14 hours.

| # | Task | Files | Effort | Deps |
|---|---|---|---|---|
| T01 | Add Voice/Theme/Intent enums + Preferences shape | `src/lib/types.ts` | 30 min | — |
| T02 | Storage migration v1→v2 | `src/lib/storage.ts`, `src/lib/__tests__/migration.test.ts` (new) | 60 min | T01 |
| T03 | Wire `setPreferences` into AppStateContext | `src/state/AppStateContext.tsx` | 15 min | T02 |
| T04 | Voice catalog scaffolding | `src/i18n/voices.ts` (new), `src/i18n/copy.ts` (new) | 30 min | T01 |
| T05 | Author 25-key voice catalog | `src/i18n/copy.ts`, `src/i18n/__tests__/copy.test.ts` (new) | 90 min | T04 |
| T06 | `useVoice` hook | `src/i18n/useVoice.ts` (new) + test | 15 min | T03, T05 |
| T07 | Theme tokens module | `src/themes/themes.ts` (new), `src/themes/themes.css` (new) | 60 min | T01 |
| T08 | `useTheme` + `<html data-theme>` mount | `src/themes/useTheme.ts` (new), `src/App.tsx` | 30 min | T03, T07 |
| T09 | Tailwind theme-aware semantic tokens | `tailwind.config.js` | 30 min | T07 |
| T10 | Migrate Today.tsx strings to keys | `src/screens/Today.tsx` | 60 min | T06 |
| T11 | Migrate FastTimer.tsx strings | `src/screens/FastTimer.tsx` | 30 min | T06 |
| T12 | Migrate Onboarding.tsx strings | `src/screens/Onboarding.tsx` | 75 min | T06 |
| T13 | Migrate Settings.tsx strings | `src/screens/Settings.tsx` | 30 min | T06 |
| T14 | Migrate `whyThisDay.ts` to keyed copy | `src/lib/whyThisDay.ts`, `src/i18n/copy.ts` | 90 min | T06 |
| T15 | `tithiLabel.ts` formatter | `src/lib/tithiLabel.ts` (new) + test | 30 min | T01 |
| T16 | Wire dual labeling into Today header | `src/screens/Today.tsx` | 15 min | T15, T08 |
| T17 | `SyncedNowPill` + algorithm | `src/lib/syncedNow.ts` (new), `src/components/SyncedNowPill.tsx` (new) + tests | 75 min | T06 |
| T18 | Mount `SyncedNowPill` on Today + FastTimer | `src/screens/Today.tsx`, `src/screens/FastTimer.tsx` | 30 min | T17 |
| T19 | Intent Router component | `src/screens/onboarding/IntentRouter.tsx` (new), `src/screens/Onboarding.tsx` | 75 min | T03, T06, T08 |
| T20 | Settings: Voice + Theme + reset-intent controls | `src/screens/Settings.tsx` | 45 min | T13, T19 |
| T21 | `?reset_intent=1` deep link handler | `src/App.tsx` | 30 min | T19 |
| T22 | Regression test (3 voice/theme combos × intent paths) | `src/__tests__/regression.test.tsx` | 75 min | T01–T21 |

---

## B. Hard-Coded String Audit (~110 keys total)

### `src/screens/Today.tsx` (26 keys)
| Line | Current | Key |
|---|---|---|
| 68 | "Peace of the night" | `today.greeting.lateNight` |
| 69 | "Good morning" | `today.greeting.morning` |
| 70 | "Good afternoon" | `today.greeting.afternoon` |
| 71 | "Good evening" | `today.greeting.evening` |
| 72 | "Quiet night" | `today.greeting.night` |
| 89 | "% illuminated · waxing/waning" | `today.illum.template` |
| 138 | "Fast in progress" | `fast.active.eyebrow` |
| 140 | "You're fasting" | `fast.active.title` |
| 142 | full sentence about timer/meditation | `fast.active.subtitle` |
| 145 | "Open timer" | `fast.active.cta` |
| 175 | "{n}-hour fast · paired with…" | `today.fast.subtitle` |
| 184 | "Why this day?" | `today.whyThisDay.toggle` |
| 192 | "Tradition" | `today.whyThisDay.traditionLabel` |
| 199 | "Science" | `today.whyThisDay.scienceLabel` |
| 213 | "Begin fast" | `fast.start.cta` |
| 215 | "This day has passed" | `today.fast.past` |
| 216 | "Begins {when}" | `today.fast.future` |
| 220 | "Notifications will remind you." | `today.fast.notice` |
| 246 | "% illuminated · no scheduled fast…" | `today.regular.subtitle` |
| 249 | "Rest days matter…" | `today.regular.body` |
| 256 | "Today" | `common.today` |
| 262 | "Tomorrow" | `common.tomorrow` |
| 263 | "Yesterday" | `common.yesterday` |
| 264 | "In {n} days" | `common.inDays` |
| 265 | "{n} days ago" | `common.daysAgo` |

### `src/screens/FastTimer.tsx` (7 keys)
| Line | Current | Key |
|---|---|---|
| 28 | "End this fast early?…" | `fast.endEarly.confirm` |
| 39 | "Fasting · {n}h" | `fast.timer.label` |
| 48 | "Complete fast" | `fast.complete.cta` |
| 53 | "Begin 10-minute meditation" | `fast.meditation.cta` |
| 56 | "Back" | `common.back` |
| 61 | "End fast early" | `fast.endEarly.cta` |
| 121 | "% complete" | `fast.progress.label` |

### `src/screens/Onboarding.tsx` (~35 keys)
Welcome, you, exp, safety, intensity steps + all option labels and subs. Full table in master spec.

### `src/screens/Settings.tsx` (~12 keys)
Title, section labels (Profile/Intensity/Data), CTAs (Export/Reset), reset-confirm, footer disclaimer.

### `src/lib/whyThisDay.ts` (~16 strings × 3 voices = 48 variants)
- `why.{kind}.heading` / `.plain` / `.tradition` / `.science` for kinds: ekadashi, full-moon, new-moon, chaturthi.

---

## C. Initial 25-Key Voice Catalog

```ts
export const COPY: CopyCatalog = {
  // Today greetings (5)
  'today.greeting.morning':    { coach: 'Good morning',          scientific: 'Morning window',           traditional: 'Suprabhatam' },
  'today.greeting.afternoon':  { coach: 'Good afternoon',        scientific: 'Afternoon window',         traditional: 'Madhyahna namaskar' },
  'today.greeting.evening':    { coach: 'Good evening',          scientific: 'Evening window',           traditional: 'Sandhya namaskar' },
  'today.greeting.night':      { coach: 'Quiet night',           scientific: 'Night phase',              traditional: 'Shubh ratri' },
  'today.greeting.lateNight':  { coach: 'Peace of the night',    scientific: 'Late night phase',         traditional: 'Nishakaal shanti' },

  // Today selected day (3)
  'today.whyThisDay.toggle':   { coach: 'Why this day?',         scientific: 'Mechanism & evidence',     traditional: 'Significance of this tithi' },
  'today.fast.subtitle':       { coach: '{hours}-hour fast · paired with a 10-minute meditation', scientific: '{hours}h time-restricted eating · 10-min focused-attention practice', traditional: '{hours}-ghanta upavasa · with dhyana for ten minutes' },
  'today.regular.body':        { coach: 'Rest days matter. The rhythm is the practice — not every day has to be a fast day.', scientific: 'Recovery is part of the protocol. Periodicity outperforms intensity.', traditional: 'Days between vrats are also sacred — the rhythm itself is the sadhana.' },

  // FastTimer (8)
  'fast.timer.label':          { coach: 'Fasting · {hours}h',    scientific: 'TRE active · {hours}h window', traditional: 'Upavasa · {hours} ghanta' },
  'fast.start.cta':            { coach: 'Begin fast',            scientific: 'Begin protocol',           traditional: 'Begin vrat' },
  'fast.complete.cta':         { coach: 'Complete fast',         scientific: 'Mark protocol complete',   traditional: 'Complete vrat' },
  'fast.meditation.cta':       { coach: 'Begin 10-minute meditation', scientific: 'Start 10-min focused-attention session', traditional: 'Begin dhyana — ten minutes' },
  'fast.endEarly.cta':         { coach: 'End fast early',        scientific: 'Abort protocol',           traditional: 'End vrat early' },
  'fast.endEarly.confirm':     { coach: 'End this fast early? It will be marked as aborted.', scientific: 'Abort the protocol? The session will be flagged incomplete.', traditional: 'End this vrat before its time? It will be recorded as broken.' },
  'fast.progress.label':       { coach: '{percent}% complete',   scientific: '{percent}% of window elapsed', traditional: '{percent}% of vrat observed' },
  'fast.active.title':         { coach: "You're fasting",        scientific: 'Protocol active',          traditional: 'Vrat in progress' },

  // Onboarding step titles (5)
  'onboarding.welcome.title':  { coach: 'Moon for Mental Performance', scientific: 'A circalunar protocol for cognition', traditional: 'Chandra-anushasana — practice with the moon' },
  'onboarding.you.title':      { coach: 'Tell us who you are',   scientific: 'Profile setup',            traditional: 'Introduce yourself, sadhaka' },
  'onboarding.exp.title':      { coach: 'Your experience',       scientific: 'Baseline assessment',      traditional: 'Your sadhana so far' },
  'onboarding.safety.title':   { coach: 'A few safety checks',   scientific: 'Contraindication screen',  traditional: 'Care for the body first' },
  'onboarding.intensity.title':{ coach: 'Pick your intensity',   scientific: 'Choose fasting window',    traditional: 'Choose the depth of your vrat' },

  // Settings sections (4)
  'settings.title':            { coach: 'Settings',              scientific: 'Configuration',            traditional: 'Preferences' },
  'settings.profile.label':    { coach: 'Profile',               scientific: 'Profile',                  traditional: 'About you' },
  'settings.intensity.label':  { coach: 'Default intensity',     scientific: 'Default window length',    traditional: 'Default vrat depth' },
  'settings.data.label':       { coach: 'Data',                  scientific: 'Data',                     traditional: 'Your records' },
};
```

Remaining ~85 keys land alongside their owning task (T11–T14, T19, T20).

---

## D. Type Definitions

```ts
// src/lib/types.ts additions
export type Voice = 'scientific' | 'traditional' | 'coach';
export type Theme = 'performance' | 'devotional' | 'minimal';
export type Intent = 'optimize' | 'tradition' | 'tired' | 'curious';
export type NotificationPhilosophy = 'quiet' | 'standard' | 'detailed';

export interface Preferences {
  voice: Voice;
  theme: Theme;
  intent: Intent | null;
  notificationPhilosophy: NotificationPhilosophy;
}

export function defaultPreferences(): Preferences {
  return { voice: 'coach', theme: 'performance', intent: null, notificationPhilosophy: 'quiet' };
}

export interface AppState {
  profile: UserProfile | null;
  schedule: SomaDay[];
  sessions: FastSession[];
  onboardingComplete: boolean;
  preferences: Preferences;   // NEW
  version: 2;                 // NEW
}
```

```ts
// src/i18n/copy.ts
export interface CopyEntry { scientific: string; traditional: string; coach: string; }
export type CopyKey = /* full union — see master S1 spec */;
export type CopyCatalog = Record<CopyKey, CopyEntry>;
export const COPY: CopyCatalog;
export const COPY_KEYS: readonly CopyKey[];
export function t(key: CopyKey, voice: Voice): string;
```

```ts
// src/lib/storage.ts
const LEGACY_KEY = 'soma.state.v1';
const STORAGE_KEY = 'soma.state.v2';

interface UnknownState { version?: number; [k: string]: unknown }
export function migrateToV2(raw: UnknownState): AppState;
export function withPreferences(state: AppState, prefs: Partial<Preferences>): AppState;
```

---

## E. Theme Tokens (CSS + Tailwind)

### `src/themes/themes.css`

```css
:root, [data-theme="performance"] {
  --surface: #0b1020;  --surface-elev: #11182e;  --ink: #0a0d18;
  --moon: #e8e4d2;     --glow: #f4efd9;          --mist: #8ea3c4;
  --accent: #7dd3fc;   --moon-tint: #bae6fd;     --crimson: #f87171;
  --type-display: '"Inter"', system-ui, sans-serif;
  --type-body: '"Inter"', system-ui, sans-serif;
  --data-emphasis: 1;
}
[data-theme="devotional"] {
  --surface: #120907;  --surface-elev: #1a0e0a;  --ink: #0d0604;
  --moon: #f0e6d2;     --glow: #fff3d6;          --mist: #b39a78;
  --accent: #f5b042;   --moon-tint: #f0c060;     --crimson: #c0392b;
  --type-display: '"Cormorant Garamond"', '"Lora"', Georgia, serif;
  --type-body: '"Lora"', Georgia, serif;
  --data-emphasis: 0.6;
}
[data-theme="minimal"] {
  --surface: #0a0a0a;  --surface-elev: #141414;  --ink: #000000;
  --moon: #ffffff;     --glow: #ffffff;          --mist: #a0a0a0;
  --accent: #ffffff;   --moon-tint: #ffffff;     --crimson: #d97757;
  --type-display: '"Inter"', system-ui, sans-serif;
  --type-body: '"Inter"', system-ui, sans-serif;
  --data-emphasis: 0.3;
}
```

### `tailwind.config.js` diff

```diff
       colors: {
         soma: { /* existing palette retained for backwards compat */ },
+        surface:        'var(--surface)',
+        'surface-elev': 'var(--surface-elev)',
+        ink:            'var(--ink)',
+        moon:           'var(--moon)',
+        glow:           'var(--glow)',
+        mist:           'var(--mist)',
+        accent:         'var(--accent)',
+        'moon-tint':    'var(--moon-tint)',
+        crimson:        'var(--crimson)',
       },
       fontFamily: {
         display: ['"Lora"', 'Georgia', 'serif'],
         sans: ['"Raleway"', 'system-ui', 'sans-serif'],
+        'theme-display': ['var(--type-display)'],
+        'theme-body': ['var(--type-body)'],
       },
```

---

## F. Intent Router (Full Component)

`src/screens/onboarding/IntentRouter.tsx` — 4-card 2×2 radiogroup with full keyboard navigation (Arrow keys, Enter, Space), a11y `role="radiogroup"` tied to heading via `aria-labelledby`, focus management via `useRef` + `useEffect`. On selection, calls `setPreferences({ intent, theme, voice })` per the mapping:

| Card | Intent | Theme | Voice |
|---|---|---|---|
| Optimize my body | `optimize` | `performance` | `scientific` |
| Follow tradition | `tradition` | `devotional` | `traditional` |
| Tired of fasting apps | `tired` | `minimal` | `coach` |
| Curious about the moon | `curious` | `performance` | `coach` |

Full skeleton in `2026-04-28-soma-marketability-sprints.md` Section F (in agent output).

---

## G. Synced-Now Algorithm (Key Excerpts)

```ts
const TOTAL_OBSERVERS = 294_000_000; // 1.05B Hindus × 0.4 obs rate × 0.7 awake decay

function seedFromIso(iso: string): number {
  let h = 2166136261 >>> 0; // FNV-1a
  for (let i = 0; i < iso.length; i++) {
    h ^= iso.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number { /* deterministic PRNG */ }

function awakeWeight(utcHour: number): number {
  // bell curve peaks at UTC 01 + 13 (IST 06:30 + 18:30)
  return 0.55 + 0.4 * Math.cos(((utcHour - 1) / 24) * 2 * Math.PI);
}

export function syncedNowCount(args: {
  date: Date;
  kind: 'ekadashi' | 'full-moon' | 'new-moon' | null;
}): number | null {
  if (args.kind == null) return null;
  const iso = args.date.toISOString().slice(0, 10);
  const seed = seedFromIso(iso) ^ (args.date.getUTCHours() * 31 + args.date.getUTCMinutes());
  const rand = mulberry32(seed);
  const mult = args.kind === 'ekadashi' ? 0.30 : args.kind === 'full-moon' ? 0.18 : 0.12;
  const base = TOTAL_OBSERVERS * awakeWeight(args.date.getUTCHours()) * mult;
  const drift = Math.floor((rand() - 0.5) * 400);
  return Math.max(0, Math.round((base + drift) / 100) * 100);
}
```

**Determinism:** same minute on different devices → same number (no `Date.now()` internally). **Drift:** ±200 within minute via mulberry32. **Non-observance:** returns null. Rounded to nearest 100 for natural feel.

---

## H. Codebase-Specific Risks (12)

| # | Risk | Where | Mitigation |
|---|---|---|---|
| H1 | Existing `tithiLabel(tithi)` returns "Shukla Pratipada", not named Ekadashi | `Today.tsx:92`, `tithi.ts` | Use `tithi.name` as placeholder in S1; replace with `tithiMeta` in S2 |
| H2 | `whyThisDay.ts::getWhyCopy()` signature changes break callers | `Today.tsx:166` | Only Today calls it (verified). Safe. |
| H3 | Adding semantic Tailwind tokens does NOT auto-migrate existing `text-soma-*` classes | All screens | Accept; full per-screen recolor is S2 |
| H4 | Inserting `'intent'` as Onboarding step 0 changes step indexing | `Onboarding.tsx:9` | grep tests for literal `'welcome'`; update carefully |
| H5 | Reset Soma wipes preferences (theme/voice) | `Settings.tsx:32` | Spec says full reset; add UX warning to confirm copy |
| H6 | Beta users have data under `soma.state.v1` | `storage.ts:3` | Two-key strategy: write v2, leave v1 alone for one release |
| H7 | State JSON blob grows by ~300 bytes (preferences) | `AppStateContext.tsx:42` | Negligible; flagged for awareness |
| H8 | New `formatTithiLabel` could collide with existing `tithiLabel` import | `Today.tsx:14` | Verb-prefixed name disambiguates |
| H9 | Existing uncommitted changes in `regression.test.tsx` and `storage.test.ts` | Working tree | Read those files before T01; rebase on top |
| H10 | `<html data-theme>` won't survive SSR (currently CSR-only) | `useTheme.ts` | Document; revisit if SSR added |
| H11 | Resumable onboarding: closing tab mid-flow leaves prefs set | `App.tsx:29` | Acceptable feature, not a bug |
| H12 | `confirm()` dialog can't be theme-styled | `Settings.tsx:32`, `FastTimer.tsx:28` | Pass voice-aware string in S1; replace dialog in S4 |

---

## I. PR Slicing — 5 PRs

| PR | Scope | Tasks | LOC | Review |
|---|---|---|---|---|
| **PR 1** Foundation | types + storage migration + AppStateContext | T01–T03 | ~150 | 30 min |
| **PR 2** Voice infra | catalog + 25 keys + `useVoice` | T04–T06 | ~400 | 25 min |
| **PR 3** Theme infra | tokens + tailwind extension + `<html data-theme>` | T07–T09 | ~250 | 20 min |
| **PR 4** Voice migration | 5 screens + `whyThisDay` + dual labeling | T10–T16 | ~600 | 30 min |
| **PR 5** Final user surface | Intent Router + SyncedNowPill + Settings + regression | T17–T22 | ~500 | 30 min |

**Sequencing:** PR 2 needs PR 1; PR 3 needs PR 1; PR 4 needs PR 2; PR 5 needs PR 2+3+4. Each PR keeps build green and tests passing in isolation.

---

**WAITING FOR CONFIRMATION** to begin PR 1 (Tasks T01–T03).
