# Soma — Architecture & Technical Reference

**Purpose:** Canonical reference for auditing the project. Read this before any architecture review, dependency audit, security pass, or large refactor. Update it whenever a section stops being true.

**Last verified against code:** 2026-07-08 (commit `8579ebd`)
**App:** Lunar-fasting wellness PWA · React 18 + Vite 5 + Tailwind 3 · client-side (one serverless endpoint: email capture) + PostHog analytics
**Production:** https://somaa.vercel.app (Vercel project `somaa`) · repo `trikayastha/Soma`

---

## 1. System overview

Soma is a single deploy serving two surfaces:

| Path | Surface | Source |
|---|---|---|
| `/` | Static marketing landing page | `index.html`, `style.css`, `moon.js`, `assets/` at repo root |
| `/app/` | React SPA (the product) | `src/` via Vite (root `app/`, base `/app/`) |
| `/app/pitch.html` | Pitch deck | `pitch.html` at repo root, copied at assemble time |

There is **no backend for user data and no auth** — all user data lives in `localStorage` and never leaves the device. Two deliberate exceptions to "fully client-side": **PostHog analytics** (anonymous, non-PII — see `docs/analytics.md`) and a **single serverless endpoint** `api/subscribe.js` (beta-launch email capture, landing page only). The only external computation is the bundled `astronomy-engine` library (lunar math, offline). Runtime network requests are: static asset loads, PostHog event capture, and the opt-in subscribe `POST`.

### Architectural invariants (do not break silently)

1. **Privacy-first:** no user *data* leaves the device. Settings copy promises this ("Stays on this device"). The only outbound data is anonymous, non-PII analytics (PostHog) and the opt-in beta email — neither carries user content or free text. See `docs/analytics.md` §5.
2. **Additive storage migrations:** old localStorage blobs are never deleted; migration is idempotent.
3. **Deterministic domain logic:** lunar/tithi/schedule functions are pure given (date, location) — this is what makes the 53-file test suite possible.
4. **No streak-shaming:** the mandala engine has no "broken" status by design (see §7).

---

## 2. Build & deploy pipeline

```
npm run build   =  tsc -b  +  vite build          → dist/app/   (SPA)
node scripts/assemble.mjs                          → dist/       (copies landing: index.html, style.css, moon.js, assets/; pitch.html → dist/app/)
```

- `vite.config.ts`: `root: 'app'`, `base: '/app/'`, `outDir: '../dist/app'`. The Vite entry is `app/index.html` → `app/main.tsx` (shim) → `src/main.tsx` (10 lines, mounts `<App/>`).
- `vercel.json`: `buildCommand: "npm run build && node scripts/assemble.mjs"`, `outputDirectory: "dist"`, SPA rewrite `/app/(.*) → /app/index.html`, `cleanUrls: true`.
- **Deploy:** `vercel --prod --yes` from repo root (never without explicit go-ahead — see project memory).
- **Git push quirk:** machine SSH key has no write access; push over HTTPS via `gh` credentials (`gh auth setup-git`, remote `https://github.com/trikayastha/Soma.git`).
- **No CI:** there is no `.github/workflows/`. Tests and typecheck run locally only. Vercel builds on push but runs no tests.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server, port 5173 (serves the SPA only, not the landing) |
| `npm run build` | `tsc -b` + `vite build` |
| `npm test` / `test:watch` | Vitest, jsdom |
| `npm run test:e2e` | Playwright — **declared but unusable: no `playwright.config.ts` and no E2E specs exist** |
| `npm run typecheck` | `tsc -b --noEmit` |

---

## 3. Repository layout

```
soma/
├── index.html, style.css, moon.js, assets/   # static landing page (site root)
├── pitch.html                                # pitch deck → deployed at /app/pitch.html
├── app/index.html, app/main.tsx              # Vite root + entry shim
├── src/
│   ├── main.tsx (10 LOC)                     # mount point
│   ├── App.tsx (157 LOC)                     # shell: tab router + overlay stack
│   ├── screens/                              # full-screen views (see §5)
│   ├── components/                           # ~27 composable UI pieces + __tests__/
│   ├── lib/                                  # ALL domain logic (see §6–§8) + __tests__/
│   │   └── data/                             # reads.ts, drik-fixtures.json
│   ├── state/AppStateContext.tsx             # global state + hydration (see §4)
│   ├── i18n/                                 # voice system: voices.ts, copy.ts, useVoice.ts
│   ├── themes/                               # themes.ts/.css, resolvePalette, useTheme, fonts
│   ├── test/setup.ts                         # vitest setup + canvas mock
│   └── __tests__/                            # integration/regression tests
├── scripts/assemble.mjs                      # deploy-tree assembler
├── docs/ (this file, plans/, roadmap/)
├── vite.config.ts, vercel.json, tailwind.config.js, tsconfig*.json
└── .claude/, .claude-flow/, .agents/         # AI-tooling config; not part of the app
```

**File-size discipline** (house rule: <400 LOC typical, 800 max). Current largest: `Settings.tsx` 407, `Onboarding.tsx` 374, `citations.ts` 347, `storage.ts` 312, `Calendar.tsx` 308, `FastTimer.tsx` 300. `Settings.tsx` is the first candidate to split if it grows.

---

## 4. State management

One React context, one storage module. No Redux/Zustand/query libs.

### Shape (`src/lib/types.ts`, 265 LOC — the single source of truth for types)

```typescript
interface AppState {
  profile: UserProfile | null;     // name, timezone, experience, goal, defaultIntensity,
                                   // onboardedAt, safetyFlags, reminders, location?
  schedule: SomaDay[];             // generated fast-day calendar (~60 days)
  sessions: FastSession[];         // every fast attempt with pre/post logs
  onboardingComplete: boolean;
  preferences: Preferences;        // voice, theme, intent, notificationPhilosophy,
                                   // archetype, wisdomCardCount
  mandalaAnchor: MandalaAnchor;    // { firstObservedFastDate, manualResetDate }
  version: 3;                      // APP_STATE_VERSION
}
```

Key unions: `Voice = 'scientific'|'traditional'|'coach'`, `Theme = 'performance'|'devotional'|'minimal'`, `Intent = 'optimize'|'tradition'|'tired'|'curious'`, `Archetype = 'wind'|'fire'|'earth'`, session `status = 'active'|'completed'|'late-completed'|'aborted'`.

### Persistence & migration (`src/lib/storage.ts`, 312 LOC)

- Keys: `soma.state.v3` (current) ← `soma.state.v2` ← `soma.state.v1`. **Older keys are never deleted** (rollback safety).
- `loadState()` tries v3 → v2 → v1, then runs `migrateToCurrent()` (idempotent, additive). `migrateToV2()` backfills `preferences`; v2→v3 backfills `mandalaAnchor` from earliest credited session, `profile.location`, per-day `sunriseAt`, `tithi.accuracy: 'approximate'`.
- All mutations go through immutable `with*` helpers (`withProfile`, `withSchedule`, `withSession`, `withPreferences`, `withLocation`, `withMandalaAnchor`, `withOnboardingComplete`) — each returns a new `AppState`.
- Sanitizers at the storage boundary (`sanitizeProfile`, `sanitizeMandalaAnchor`, `mergePreferences`) are the only runtime validation in the app (no zod).

### Hydration (`src/state/AppStateContext.tsx`, 171 LOC)

1. Mount with `emptyState()` sentinel → 2. first effect loads `loadState()` and sets `hydrated.current = true` → 3. every subsequent change persists via `saveState()`, gated on `hydrated` so an empty first render can never clobber real data.
`AppStateProvider` also re-runs `scheduleLiveReminders()` (effect) whenever profile, schedule, or notification philosophy changes.

**Audit note:** any new state field must be added to `types.ts`, `emptyState()`, the migration path, and a migration test — all four, or old users get `undefined` at runtime.

---

## 5. Runtime architecture (App shell & navigation)

`App.tsx` implements a **tab + overlay** model — no router library, no URLs per screen:

- **Tabs** (`BottomNav`, 3): Today · Wisdom · Rhythm. Settings opens from a gear on Rhythm.
- **Overlays** (full viewport, hide nav): `pre-log` → `timer` → (`meditation`) → `post-log`, plus `settings`. Overlay state is a discriminated union; closing restores the tab.
- **Onboarding gate:** `!state.onboardingComplete` renders `<Onboarding/>` instead of the shell. Deep link `?reset_intent=1` clears only `preferences.intent` to replay the intent step.
- **PhoneFrame:** hard 390px CSS container — the app is designed mobile-only; desktop shows a phone-width column. Not responsive by design (for now).
- Data flow: screens read via `useAppState()`; prop drilling is minimal (components receive `day: SomaDay` etc. plus callbacks). All writes go through context actions.

### Screens

| Screen | LOC | Role |
|---|---|---|
| `Today.tsx` | 204 | Home: greeting, tithi line, moon phase, calendar, "Begin today's fast" CTA |
| `Wisdom.tsx` | 230 | 3 segments: shareable card / Reads library / personal deltas ("You") |
| `Rhythm.tsx` | 92 | Mandala ring, week glance, session history, settings gear |
| `Settings.tsx` | 407 | Profile, intensity, location, voice/theme, reminders, archetype quiz, export/reset |
| `Onboarding.tsx` | 374 | 6-step wizard: intent → carousel → name → location → safety → experience/intensity |
| `FastTimer.tsx` | 300 | Live countdown, meditation entry, end-early, late-complete |
| `LogForm.tsx` | 87 | Pre/post-fast survey: energy/focus/mood/sleep 1–5 + notes |
| `Meditation.tsx` | 175 | 10-min breathing pacer, Web Audio 136.1 Hz sine drone |
| `EnergyArchetype.tsx` | 268 | 3-question Wind/Fire/Earth quiz (UI-only; does not affect schedule) |

---

## 6. Domain layer — lunar & panchanga engine (`src/lib/`)

This is the heart of the app. Everything is pure TypeScript over `astronomy-engine` v2.1.19 (the only production dependency besides React).

| Module | Exports (key) | Notes |
|---|---|---|
| `lunar.ts` (175) | `moonElongation(date)` 0–360°, `moonIllumination(date)` 0–1, `elongationToPhaseName()` (8 phases), `generateSchedule(from, days, intensity, location?)` | Schedule generator walks `SearchMoonPhase()` per target kind (ekadashi, full/new moon, pradosh, chaturthi, shivaratri…), dedupes by `date|kind`, sorts ascending. Callers pass ~60 days. Deterministic. |
| `tithi.ts` (216) | `computeTithi(date)`, `computeTithiAtSunrise(date, location?)`, `tithiBoundaries()`, `tithiLabel()` | Tithi = 12° of sun–moon elongation, index 1–30 (15=Purnima, 30=Amavasya). Accuracy provenance: `'sunrise'` (location given) / `'approximate'` (UTC-noon fallback) / `'polar-fallback'`. |
| `tithiMeta.ts` (84) | `TITHI_META: Record<1..30, TithiMeta>`, `getTithiMeta()` | Seed data: deity, IAST, fastingClass, oneWordBenefit, energy, recommendedPractice, citationIds per tithi. Dense one-line records. |
| `describeTithi.ts` (120) | `describeTithi(index) → { landmark, practice }` | Layer-0 plain English: "Shukla Dashami" → "5 nights until the full moon". |
| `lunarMonth.ts` (146) | `resolveLunarMonth(date, location?) → { index, name, adhik }` | **Amanta** convention. Uses tropical solar longitude — see §12 known deviation vs Drik Panchang. |
| `ekadashiNames.ts` (~80) | `getEkadashiName(month, paksha)` | Named Ekadashis ("Putrada", "Vaikuntha"…). |
| `parana.ts` (~80) | `paranaWindow(fastDate, location?) → { earliest, latest, paranaDay }` | Drik convention: opens at next-day sunrise, closes at min(Dwadashi end, sunrise + ¼ Dwadashi). Null without location. |
| `sunrise.ts` (~60) | `computeSunrise()` | Iterative altitude-0 search via astronomy-engine. |
| `mandala.ts` (150) | `isMajorFast(kind)`, `computeMandala(state, now?)`, `resolveAnchorDate(state)` | 40-day cycles. Completion = ≥60% of expected major fasts, min 3 expected; thin windows carry forward. Status: `in-progress`/`completed`/`partial` — **never "broken"**. |
| `scheduler.ts` (107) | `startSession`, `completeSession`, `abortSession`, `makePersonalVrat`, `findActiveSession`, `lateCompleteWindow` | Session lifecycle; late completion still credits mandala/deltas. |
| `delta.ts` (116) | `computeDeltas(state) → PersonalDelta[]` | Pre/post-log aggregation per context bucket; gates: `MIN_N = 3` samples, `FLOOR = 0.3` effect size, |Δ| ≥ SE. |
| `safety.ts` (~60) | `evaluateSafety(flags)` | Hard gate for pregnant / eating-disorder history / diabetes / under-18. |
| `archetype.ts` (172) | `ARCHETYPE_QUESTIONS`, `scoreAnswers()` | Weighted 3-question quiz; tie-break wind > fire > earth. |
| `drikParity.ts` (~30) + `data/drik-fixtures.json` | — | Regression harness: 9 fixtures (3 cities × 3 dates) checked against drikpanchang.com values. |

---

## 7. Notifications, calendar export, sharing

| Module | Role |
|---|---|
| `reminders.ts` (182) | Facade: `getPermissionState()`, `requestPermission()`, `downloadIcs()`, `scheduleLiveReminders()` → returns `{ clear() }`. **setTimeout-based, main thread — fires only while the tab/PWA is open.** No service worker (see §10). |
| `notificationPhilosophy.ts` (226) | Three tiers: **quiet** (~2–3/mo, major-fast day-of only) · **standard** (~7–8/mo, + lead-time) · **detailed** (~15–19/mo, + parana, tithi-sunrise, evening fasts, reflection ping). `buildPhilosophySchedule()` dedupes by (kind, dayDate). |
| `ics.ts` (176) | RFC 5545 generator: VEVENT per SomaDay, VALARMs for lead + day-of, CRLF + 73-char folding, TZID without VTIMEZONE blocks (assumes IANA db on the consuming client). This is the *reliable* reminder channel. |
| `wisdomCard.ts` (234) | 1080×1080 canvas PNG, pure vector (no image taints): radial gradient, moon glyph with terminator ellipse, typography, wordmark. → `{ blob, dataUrl, filename }`. |
| `useShareImage.ts` (145) | Share fallback chain: `navigator.canShare({files})` → `share({files})` → `share({title,text})` → `<a download>`. Handles iOS 5MB PNG cap and AbortError (= 'cancelled', not counted). Increments `preferences.wisdomCardCount` on share/download only. |
| `wisdomContent.ts` (91) | `resolveWisdom(tithiIndex, kind?)` → benefit + ≤120-char line + citationIds; curated per-kind entries with tithiMeta fallback. |

---

## 8. Content, personalization & theming

Four orthogonal personalization axes, all in `preferences`:

- **Voice** (`src/i18n/`): `coach` / `scientific` / `traditional`. `copy.ts` holds a 70+-key catalog where every `CopyKey` has all three voices (enforced by `copy.test.ts`); `useVoice()` exposes `t(key)` / `tFormat(key, tokens)`. All user-facing prose should go through this — hardcoded strings in screens are a code smell here.
- **Theme** (`src/themes/`): `performance` / `devotional` / `minimal` presets → CSS vars in `themes.css`; `resolvePalette.ts` reads computed vars (used by the canvas card so shares match the active theme).
- **Intent** (onboarding step 1): drives default goal + theme + voice in one pick.
- **Archetype** (wind/fire/earth quiz): currently display-only; does not influence scheduling.

**Citations** (`citations.ts`, 347): 25 entries — 15 modern studies (DOIs: autophagy, TRE, lunar-sleep) + 10 tradition sources (Puranic/Vedic/Ayurvedic). Every factual claim in tithiMeta/reads links a citationId; `citations.test.ts` fails on dangling references. **Rule: no new health/tradition claim ships without a citation entry.**

**Reads** (`lib/data/reads.ts`): 4 hand-crafted explainers (Tradition/Science/Practice/Caution), each optionally citation-backed.

---

## 9. Testing

- **Framework:** Vitest 2 + jsdom + Testing Library. Setup (`src/test/setup.ts`): jest-dom matchers, per-test `cleanup()` + `localStorage.clear()`, and a full 2D-canvas mock (jsdom has no canvas) including `toBlob`/`toDataURL`.
- **Inventory: 53 test files** — 31 in `lib/__tests__/` (lunar, tithi, sunrise-anchored tithi, mandala, lunarMonth, parana, delta, archetype, storage, migration + migration.v3, ics, reminders, notificationPhilosophy, citations, wisdomCard, useShareImage, drikParity…), 12 in `components/__tests__/`, 5 integration/regression in `src/__tests__/` (incl. `no-streak.test.ts` empty-state edge), plus i18n and themes suites.
- **Strong coverage:** all domain math, storage migrations, copy completeness, citation integrity, Drik parity fixtures.
- **Known gaps:** FastTimer countdown edge cases, the full Onboarding flow end-to-end, Settings form interactions, and **all E2E** (Playwright installed, never configured).
- **No CI** — run `npm test && npm run typecheck` manually before any push.

---

## 10. Browser APIs & PWA status

| API | Where | Status |
|---|---|---|
| localStorage | `storage.ts` only | Sole persistence layer |
| Notification | `reminders.ts` | Permission-gated; setTimeout delivery, tab must be open |
| Web Share (files) | `useShareImage.ts` | Full fallback chain |
| Canvas 2D | `wisdomCard.ts` | Pure vector, taint-free, mocked in tests |
| Web Audio | `Meditation.tsx` | 136.1 Hz sine, gain-ramped, `webkitAudioContext` fallback |
| Service Worker | — | **Not implemented.** No offline caching, no push, no background notification delivery |
| Manifest | — | **No `manifest.webmanifest`.** Only apple-mobile-web-app meta tags in `app/index.html` — install/A2HS is effectively iOS-meta-tag-only |
| Geolocation API | — | Deliberately unused; location comes from the curated `cities.ts` picker (20+ cities) |

**Implication for audits:** anything labeled "reminder" is best-effort while the app is open; the durable channel is the .ics export. A service worker + manifest is the known path to real PWA behavior (tracked in the AARRR roadmap, `docs/roadmap/`).

---

## 11. Dependencies & type safety

**Production deps (4):** `react@18.3`, `react-dom@18.3`, `astronomy-engine@2.1.19`, `posthog-js@1.398` (analytics — isolated behind `src/lib/posthog.ts`, see `docs/analytics.md` §2). No router, no state lib, no UI kit, no date lib, no CSS-in-JS, no lodash/axios. Keep it that way unless a dependency earns its weight.

**Dev deps (12):** vite, @vitejs/plugin-react, typescript 5.6, vitest, jsdom, Testing Library (react/jest-dom/user-event), @playwright/test (unused — see §9), tailwindcss, postcss, autoprefixer.

**TypeScript:** `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, ES2022, bundler resolution. No `any` in application code. No runtime schema validation (no zod) — the trust boundary is `storage.ts` sanitizers + the fact that all input comes from the app's own UI. If a backend or URL-parameter input ever appears, add schema validation at that boundary first.

---

## 12. Known limitations & oddities (audit watchlist)

1. **Tropical vs sidereal:** `lunarMonth.ts` uses tropical solar longitude; Drik Panchang uses sidereal (Lahiri ayanamsa ≈ 24°). Boundary-day naming can drift ±2 days on edge cases. Accepted for Ekadashi naming; full panchanga is future work. Drik-parity fixtures pin the current behavior.
2. **Reminders die with the tab** (no SW). Users who don't export .ics get no durable reminders.
3. **No manifest / no service worker** — "PWA" is aspirational; it's currently a mobile-styled website.
4. **Playwright is a ghost dep** — script exists, config and specs don't.
5. **No CI** — nothing enforces tests/typecheck before deploy.
6. **PhoneFrame hard 390px** — desktop is intentionally unoptimized.
7. **Archetype quiz is decorative** — collected but unused in scheduling; either wire it or say so in copy.
8. **Legacy storage keys accumulate** (`v1`, `v2` kept forever by design) — fine, but remember them in any "reset/delete my data" audit: `clearState()` must clear all three.
9. **`.claude/`, `.claude-flow/`, `.agents/`** at repo root are AI-tooling config, not app code; exclude from bundle-size or security review scope (but keep secrets out of them).
10. **Landing and app share no code** — landing is hand-rolled static HTML/CSS/JS; tithi shown there (if added) would need its own computation or a build-time bake.
11. **In-flight (uncommitted as of 2026-07-08):** real moon imagery per tithi (`src/lib/moonAssets.ts`, `src/assets/moon/tithi/`, `scripts/fetch-tithi-moons.mjs`) — NASA SVS-sourced; check asset weight before shipping (bundle currently tiny).
12. **Analytics silent-no-op:** if a deploy loses `VITE_PUBLIC_POSTHOG_*`, PostHog init throws → is swallowed → the app tracks nothing and never errors. Verify events flow after any env change. No test asserts events fire on interaction, so instrumentation drift passes CI silently. Full detail in `docs/analytics.md` §10.

---

## 13. Audit checklist

Run through this list on every audit; each item maps to a section above.

- [ ] `npm run typecheck` and `npm test` pass (53 files) — §9
- [ ] No new production dependency without justification — §11
- [ ] Any `AppState` change touched types.ts + emptyState + migration + migration test — §4
- [ ] All new user-facing strings go through the voice catalog (`i18n/copy.ts`) with all 3 voices — §8
- [ ] All new health/tradition claims have a `citations.ts` entry — §8
- [ ] No *unexpected* network calls (privacy invariant) — grep `fetch(`/`XMLHttpRequest`/`navigator.sendBeacon`; sanctioned egress is only PostHog capture + `api/subscribe.js` — §1, `docs/analytics.md` §5
- [ ] New `track()` props carry no PII — enums/booleans/indices/counts only, no user text — `docs/analytics.md` §5
- [ ] No file crossed 800 LOC; anything over 400 flagged (`Settings.tsx` watch) — §3
- [ ] Drik parity fixtures still pass (`drikParity.test.ts`) — §6
- [ ] `clearState()` still clears every storage key (v1/v2/v3 + any new) — §12.8
- [ ] Deploy tree sanity: `dist/index.html` (landing) + `dist/app/` (SPA) + `dist/app/pitch.html` — §2
- [ ] Wisdom card renders taint-free and share fallback chain intact — §7

---

## 14. Document maintenance

- Update **"Last verified"** date + commit hash whenever a section is re-checked.
- Line counts are approximate snapshots; don't churn the doc for ±20 LOC drift — update when a claim becomes misleading.
- Companion docs: **analytics architecture in `docs/analytics.md`**, product roadmap in `docs/roadmap/`, session plans in `docs/plans/`, product framing in `PRD.md` / `business_analysis.md` at repo root.
