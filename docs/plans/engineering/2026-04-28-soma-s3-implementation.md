Category: engineering

# Soma — Sprint 3 Implementation-Ready Breakdown

**Owner:** Tribesh
**Created:** 2026-04-28
**Parent spec:** `2026-04-28-soma-marketability-sprints.md`
**Sibling spec:** `2026-04-28-soma-s1-implementation.md`
**Goal:** Counter-position against streak-based fasting apps. Replace streak semantics with a 40-day Mandala Engine, surface confidence-gated personal deltas on a new Rhythm screen, refactor notifications into a 3-tier philosophy, and reframe FastTimer away from countdown urgency. Storage migrates v2 → v3.

---

## Summary

Sprint 3 ships the *habit reframe* layer that S1 (voice/theme/intent) and S2 (panchanga authority) made possible. The deliverables are:

1. **Mandala Engine** — 40-day cycles that never break. Threshold = 60% of expected major-fasts in the window with `minExpected: 3`. Anchored to first observed fast OR a manual reset.
2. **Personal deltas** — log-derived "your focus rises +0.7 on Shukla Ekadashi" cards, hidden until `n ≥ minN AND |Δ| ≥ max(0.3, SE)`.
3. **Rhythm screen** — replaces Trends. Mandala ring, paksha-grouped sessions, 12-mandala season strip, deltas card.
4. **Today mandala chip** — single-line progress indicator in the Today header.
5. **Notification philosophy** — Quiet / Standard / Detailed radio, default Quiet. Replaces the live-toggle + lead-time pills.
6. **FastTimer reframe** — primary text becomes *"You're synced with N people"*; countdown demoted; phase glyph at progress-ring head; remove crimson urgency; late completion is non-punitive (`'late-completed'` status).
7. **Storage v2 → v3 migration** — derive `mandalaAnchor.firstObservedFastDate` from earliest completed session; preserve all v2 data.

S1 voice keys and S2 tithi metadata are dependencies. Streak counters are removed everywhere they currently exist.

---

## Requirements Restatement

| Requirement | Acceptance signal |
|---|---|
| Streak counters removed from every screen | grep for `streak`/`Streak` in `src/` returns zero matches |
| Mandala progress visible on Today + Rhythm | `<MandalaChip />` in Today header, `<MandalaRing />` on Rhythm |
| Mandalas never reset on missed fast | `mandala.test.ts` asserts `status !== 'broken'` after a missed window day |
| Anchor derives from first observed fast | Migration test: state with one `completed` session at `2025-01-15` produces `mandalaAnchor.firstObservedFastDate === '2025-01-15'` |
| Manual reset re-anchors mandala | Settings "Reset rhythm" button writes `mandalaAnchor.manualResetDate` and clears prior mandala history view |
| Threshold 60%, `minExpected: 3` | Window with 4 expected fasts requires ≥3 observed for `completed`; window with 2 expected gates to "in-progress" until next window |
| Partials don't carry credit | Aborted/late-completed sessions excluded from mandala `observed[]` |
| Personal deltas confidence-gated | No card renders unless `n ≥ minN(=3) AND |Δ| ≥ max(0.3, SE)` |
| Notification philosophy default = Quiet | Fresh state has `preferences.notificationPhilosophy === 'quiet'` |
| Quiet / Standard / Detailed produce 3 / 7-8 / 15-19 prompts per month | Tabular schedule in this spec; tests assert counts on a fixture month |
| FastTimer never red on late completion | `getByText(/Bodies aren't clocks/)` renders without `text-soma-crimson` |
| Phase glyph rides progress-ring head | `<RingHeadGlyph />` positioned at angle `progress * 2π` |
| Storage migration v2 → v3 idempotent | Re-running migrator on v3 state returns identical state |

---

## A. Ordered Task List

24 tasks. Each leaves the build green. Total effort ≈ 18 hours.

| # | Task | Files | Effort | Deps |
|---|---|---|---|---|
| T01 | Add Mandala/Delta types + extend `FastSessionStatus` with `'late-completed'` | `src/lib/types.ts` | 30 min | — |
| T02 | `mandala.ts` — config + window math + scoring | `src/lib/mandala.ts` (new), `src/lib/__tests__/mandala.test.ts` (new) | 120 min | T01 |
| T03 | `delta.ts` — confidence-gated delta computation | `src/lib/delta.ts` (new), `src/lib/__tests__/delta.test.ts` (new) | 90 min | T01 |
| T04 | Storage migration v2 → v3 (anchor derivation) | `src/lib/storage.ts`, `src/lib/__tests__/migration.v3.test.ts` (new) | 75 min | T01 |
| T05 | AppStateContext: `setMandalaAnchor`, `setNotificationPhilosophy`, `manualResetMandala` | `src/state/AppStateContext.tsx` | 30 min | T04 |
| T06 | `late-completed` status wiring in scheduler | `src/lib/scheduler.ts` | 30 min | T01 |
| T07 | Voice keys for mandala / rhythm / notification / late-completion | `src/i18n/copy.ts` | 60 min | T01 |
| T08 | `<MandalaRing />` SVG component | `src/components/MandalaRing.tsx` (new) + test | 60 min | T02, T07 |
| T09 | `<MandalaChip />` Today-header component | `src/components/MandalaChip.tsx` (new) + test | 30 min | T02, T07 |
| T10 | Mount `<MandalaChip />` in Today header; remove streak text if any | `src/screens/Today.tsx` | 20 min | T09 |
| T11 | `<DeltaCard />` component (hidden until gated) | `src/components/DeltaCard.tsx` (new) + test | 45 min | T03, T07 |
| T12 | `<PaksaSessionList />` paksha-grouped sessions | `src/components/PaksaSessionList.tsx` (new) + test | 45 min | T07 |
| T13 | `<MandalaSeasonStrip />` last-12 mandala strip | `src/components/MandalaSeasonStrip.tsx` (new) + test | 60 min | T02, T08 |
| T14 | New `Rhythm` screen composing the four cards | `src/screens/Rhythm.tsx` (new) | 60 min | T08, T11, T12, T13 |
| T15 | BottomNav: rename `trends` → `rhythm`; update icon + label key | `src/components/BottomNav.tsx`, `src/App.tsx` | 30 min | T14 |
| T16 | Delete `Trends.tsx`; update routing | `src/screens/Trends.tsx` (DELETE), `src/App.tsx` | 15 min | T15 |
| T17 | `notificationPhilosophy.ts` — schedule synthesizer | `src/lib/notificationPhilosophy.ts` (new) + test | 75 min | T01 |
| T18 | `<ReminderSettings />` rewrite to philosophy radio | `src/components/ReminderSettings.tsx` | 60 min | T17 |
| T19 | `reminders.ts` integration: schedule from philosophy | `src/lib/reminders.ts` | 45 min | T17 |
| T20 | FastTimer: `<SyncedNowPill />` primary, demote countdown, phase glyph at ring head | `src/screens/FastTimer.tsx` | 75 min | S1 SyncedNowPill |
| T21 | FastTimer: late-completion non-red copy + status flow | `src/screens/FastTimer.tsx`, `src/lib/scheduler.ts` | 30 min | T06, T20 |
| T22 | Settings: "Reset rhythm" control + voice copy | `src/screens/Settings.tsx`, `src/i18n/copy.ts` | 30 min | T05, T07 |
| T23 | Strip remaining `streak` references; add unit guard test | `src/**`, `src/__tests__/no-streak.test.ts` (new) | 30 min | all |
| T24 | Regression: full Rhythm + FastTimer reframe + migration | `src/__tests__/regression.s3.test.tsx` (new) | 90 min | T01–T23 |

---

## B. Type Definitions (exact)

```ts
// src/lib/types.ts — additions

export type FastSessionStatus =
  | 'active'
  | 'completed'
  | 'late-completed'   // NEW — observed after window close, still credited
  | 'aborted';

export interface FastSession {
  id: string;
  dayDate: string;
  startedAt: string;
  endedAt?: string;
  intensityHours: number;
  status: FastSessionStatus;
  preLog?: SubjectiveLog;
  postLog?: SubjectiveLog;
}

export interface MandalaAnchor {
  /** ISO date of the earliest completed session that seeds Mandala 1. */
  firstObservedFastDate: string | null;
  /** ISO timestamp of the most recent manual reset, if any. */
  manualResetDate: string | null;
}

export interface MandalaConfig {
  cycleDays: 40;
  threshold: 0.6;
  minExpected: 3;
}

export type MandalaStatus = 'in-progress' | 'completed' | 'partial';

export interface Mandala {
  index: number;
  startDate: string;
  endDate: string;
  observed: string[];
  expected: string[];
  completionRate: number;
  status: MandalaStatus;
}

export interface PersonalDelta {
  key: string;
  metric: 'focus' | 'energy' | 'mood' | 'sleep';
  context: 'shukla-ekadashi' | 'krishna-ekadashi' | 'purnima' | 'amavasya' | 'pradosh' | 'sankashti' | 'shivaratri';
  delta: number;
  n: number;
  se: number;
  phraseKey: string;
}

export interface Preferences {
  voice: Voice;
  theme: Theme;
  intent: Intent | null;
  notificationPhilosophy: NotificationPhilosophy;
}

export interface AppState {
  profile: UserProfile | null;
  schedule: SomaDay[];
  sessions: FastSession[];
  onboardingComplete: boolean;
  preferences: Preferences;
  mandalaAnchor: MandalaAnchor;     // NEW in v3
  version: 3;                       // NEW in v3
}

export const MANDALA_CONFIG: MandalaConfig = {
  cycleDays: 40,
  threshold: 0.6,
  minExpected: 3,
};
```

---

## C. Mandala Scoring Algorithm (pseudocode)

```ts
// src/lib/mandala.ts

function resolveAnchorDate(state: AppState): string | null {
  const a = state.mandalaAnchor;
  if (a.manualResetDate) return a.manualResetDate.slice(0, 10);
  if (a.firstObservedFastDate) return a.firstObservedFastDate;
  return null;
}

export function mandalaHistory(state: AppState, today: Date): Mandala[] {
  const anchor = resolveAnchorDate(state);
  if (!anchor) return [];

  const observedSet = new Set(
    state.sessions
      .filter(s => s.status === 'completed' || s.status === 'late-completed')
      .map(s => s.dayDate),
  );

  const majorFastDates = state.schedule
    .filter(d => isMajorFast(d.kind))
    .map(d => d.date);

  const out: Mandala[] = [];
  let i = 1;
  let windowStart = anchor;
  const todayIso = toISODate(today);
  let carryExpected: string[] = [];

  while (windowStart <= todayIso) {
    const windowEnd = addDays(windowStart, MANDALA_CONFIG.cycleDays);
    const expectedThis = majorFastDates.filter(
      d => d >= windowStart && d < windowEnd,
    );
    const expected = [...carryExpected, ...expectedThis];
    const observed = expected.filter(d => observedSet.has(d));
    const rate = expected.length === 0 ? 0 : observed.length / expected.length;

    let status: MandalaStatus;
    const isPast = windowEnd <= todayIso;
    if (!isPast) {
      status = 'in-progress';
      carryExpected = [];
    } else if (expected.length < MANDALA_CONFIG.minExpected) {
      status = 'in-progress';
      carryExpected = expected;
    } else {
      status = rate >= MANDALA_CONFIG.threshold ? 'completed' : 'partial';
      carryExpected = [];
    }

    out.push({
      index: i,
      startDate: windowStart,
      endDate: windowEnd,
      observed,
      expected,
      completionRate: rate,
      status,
    });

    windowStart = windowEnd;
    i += 1;
  }

  return out;
}

export function currentMandala(state: AppState, today: Date): Mandala | null {
  const all = mandalaHistory(state, today);
  if (all.length === 0) return null;
  return all[all.length - 1];
}
```

**Key invariants:**
- Missing a major-fast day reduces `completionRate` but never produces `status: 'broken'` (no such status exists).
- Aborted sessions are *not* in `observedSet` — they never count.
- `late-completed` (logged after window close but before the *next* window closes) does count.
- A window with `expected.length < 3` carries forward; this prevents thin-data months from forcing artificial "partial" stamps.

---

## D. Personal Deltas — Confidence Gate (pseudocode)

```ts
// src/lib/delta.ts

const MIN_N = 3;
const FLOOR = 0.3;

export function computeDeltas(state: AppState): PersonalDelta[] {
  const buckets = new Map<string, number[]>();

  for (const s of state.sessions) {
    if (s.status !== 'completed' && s.status !== 'late-completed') continue;
    if (!s.preLog || !s.postLog) continue;
    const ctx = contextFor(s.dayDate, state.schedule);
    if (!ctx) continue;

    for (const m of ['focus','energy','mood','sleep'] as const) {
      const d = s.postLog[m] - s.preLog[m];
      const key = `${m}.${ctx}`;
      const arr = buckets.get(key) ?? [];
      arr.push(d);
      buckets.set(key, arr);
    }
  }

  const out: PersonalDelta[] = [];
  for (const [key, samples] of buckets) {
    if (samples.length < MIN_N) continue;
    const mean = samples.reduce((a,b)=>a+b,0) / samples.length;
    const variance = samples.reduce((a,b)=>a + (b-mean)**2, 0) / Math.max(1, samples.length - 1);
    const se = Math.sqrt(variance / samples.length);
    if (Math.abs(mean) < Math.max(FLOOR, se)) continue;

    const [metric, context] = key.split('.') as [PersonalDelta['metric'], PersonalDelta['context']];
    out.push({
      key,
      metric,
      context,
      delta: Number(mean.toFixed(2)),
      n: samples.length,
      se: Number(se.toFixed(3)),
      phraseKey: `delta.${metric}.${context}`,
    });
  }

  out.sort((a,b) => Math.abs(b.delta) - Math.abs(a.delta));
  return out;
}
```

**Why both gates:** the floor (0.3) prevents trivially-small effects from rendering as insights when SE is also small. The `|Δ| ≥ SE` gate prevents noisy 1-or-2 effective samples from rendering when the variance is high. Together they approximate a one-sample t-statistic ≥ 1 with a hard floor — appropriate for a wellness app, not a clinical study.

**Empty-state copy:** "Log a few more pre/post fasts to see your patterns."

---

## E. Notification Schedule — Three Philosophies

### Quiet — target: ≤3/month

| Trigger | When | Voice key |
|---|---|---|
| Ekadashi morning | 07:00 local on day-of major Ekadashi | `notif.ekadashi.morning` |

That is it. Two Ekadashis per lunar month → ~2-3/month.

### Standard — target: 7-8/month

| Trigger | When | Voice key |
|---|---|---|
| Ekadashi morning | 07:00 local | `notif.ekadashi.morning` |
| Pre-fast | T-leadMinutes from `dayOfTime` on every major fast | `notif.prefast` |
| Parana reminder | Sunrise +30 min the day after every major fast | `notif.parana` |
| Pradosh evening | 17:30 local on Pradosh days | `notif.pradosh.evening` |

### Detailed — target: 15-19/month

| Trigger | When | Voice key |
|---|---|---|
| Ekadashi morning | 07:00 local | `notif.ekadashi.morning` |
| Pre-fast | T-leadMinutes from `dayOfTime` on every major fast | `notif.prefast` |
| Parana reminder | Sunrise +30 min day after major fast | `notif.parana` |
| Pradosh evening | 17:30 local | `notif.pradosh.evening` |
| Sankashti Chaturthi | 18:00 local on Krishna Chaturthi | `notif.sankashti` |
| Shivaratri | 18:00 local on Krishna Chaturdashi monthly + Maha Shivaratri | `notif.shivaratri` |
| Sunrise tithi handoff | Local sunrise on every Soma day | `notif.tithi.sunrise` |
| Reflection prompt | 21:00 local on every Soma day | `notif.reflection` |

Dedupe rule: same `(date, hour, family)` collapses; sunrise + ekadashi-morning on same day pick the earlier, drop the later.

**Implementation:** `synthesizeSchedule(state, philosophy, horizonDays)` returns `{at: Date, family: NotifFamily, copyKey: CopyKey, dayDate: string}[]`. `reminders.ts` consumes this and replaces the prior dual-event (lead + dayOf) loop.

---

## F. Storage Migration v2 → v3

```ts
const KEY_V1 = 'soma.state.v1';
const KEY_V2 = 'soma.state.v2';
const KEY_V3 = 'soma.state.v3';
const STORAGE_KEY = KEY_V3;

export function defaultMandalaAnchor(): MandalaAnchor {
  return { firstObservedFastDate: null, manualResetDate: null };
}

export function migrateV2ToV3(v2: AppStateV2): AppState {
  const earliestCompleted = v2.sessions
    .filter(s => s.status === 'completed')
    .map(s => s.dayDate)
    .sort()[0] ?? null;

  return {
    ...v2,
    mandalaAnchor: {
      firstObservedFastDate: earliestCompleted,
      manualResetDate: null,
    },
    version: 3,
  };
}

export function loadState(): AppState {
  const v3 = readKey(KEY_V3);
  if (v3) return v3 as AppState;

  const v2 = readKey(KEY_V2);
  if (v2) {
    const migrated = migrateV2ToV3(v2 as AppStateV2);
    saveState(migrated);
    return migrated;
  }

  const v1 = readKey(KEY_V1);
  if (v1) {
    const v2migrated = migrateV1ToV2(v1 as UnknownState);
    const v3migrated = migrateV2ToV3(v2migrated);
    saveState(v3migrated);
    return v3migrated;
  }

  return emptyState();
}
```

**Rollback plan:**
1. Keep `KEY_V1` and `KEY_V2` entries untouched on migration (additive write to `KEY_V3`). One-release window.
2. If a critical bug surfaces in v3, ship a hotfix that swaps `STORAGE_KEY = KEY_V2` and ignores v3.
3. Snapshot test: capture a real beta-user v2 blob in `src/lib/__tests__/fixtures/beta-v2.json`; assert migration emits valid v3 + correct anchor.

---

## G. Component Surface (specific)

### `<MandalaChip />` — Today header
```
[ ◐ ] Mandala 3 · 18 of 40 days · 4 of 5 fasts
```
- 28px circular SVG ring fills proportional to days-elapsed.
- Single line, `text-xs`, theme-aware accent color.
- Tap target ≥44px (whole row clickable → routes to Rhythm).
- Empty-state (no anchor): renders nothing, no placeholder.

### `<MandalaRing />` — Rhythm hero
- 220px ring, two-track: outer = days-elapsed, inner = completion-rate.
- Centerpiece: index ("3"), subline ("of ~12 this year").
- Colors: theme `--accent` for completed, `--mist` for in-progress, no red anywhere.

### `<DeltaCard />`
- Voice-aware label header.
- Body: phrase like "Your focus rises +0.7 on Shukla Ekadashi" (sign-aware).
- Subline: "n = 5 sessions · SE = 0.18".
- Max 4 visible, "Show all" expander.

### `<PaksaSessionList />`
- Two columns: Shukla / Krishna.
- Sessions sorted by date desc. No streak counter.

### `<MandalaSeasonStrip />`
- Horizontal strip of last 12 mandalas.
- Each cell: thin bar with fill = `completionRate`.
- Current mandala highlighted with accent border.

### `<RingHeadGlyph />` (FastTimer)
- 18px moon glyph (reuses `MoonPhase`).
- SVG translate: angle = `progress · 2π − π/2`.

---

## H. FastTimer Reframe — Spec

Before:
```
FASTING · 16H
   17:23:04
   42% complete
End fast early    (crimson underline)
```

After:
```
[ ◐ ] You're synced with 412,000 people.
   17:23:04          (smaller, secondary)
   42% complete
End fast            (mist underline, no red)
```

Late completion:
```
Logged · late completion
"Bodies aren't clocks. The rhythm holds."
[ Continue ]
```

Status emitted: `'late-completed'`. Counts toward mandala. Never red, never `aborted`.

**Color audit in `FastTimer.tsx`:**
- `text-soma-crimson/80` → `text-soma-mist hover:text-soma-moon`
- Confirm dialog uses voice key `fast.endEarly.confirm.gentle`.

---

## I. Codebase-Specific Risks (10)

| # | Risk | Where | Mitigation |
|---|---|---|---|
| R1 | `src/lib/storage.ts:3` still references `soma.state.v1` and S1's v2 migration may not yet be merged at S3 start | `storage.ts` | Sequence S3 PRs after S1 PR-1 merges; `loadState` chain handles v1→v2→v3 |
| R2 | `Trends.tsx` is referenced by `App.tsx` routing and `BottomNav` `TabId='trends'` enum string | `App.tsx`, `BottomNav.tsx:3` | Rename `TabId` `'trends'` → `'rhythm'`; grep + compile-error guides callers |
| R3 | Existing tests reference `Trends` (`src/__tests__/regression.test.tsx`) | regression test | Update fixture in same PR (T16) |
| R4 | `findActiveSession` matches on `status === 'active'` only — adding `'late-completed'` must not be confused with active fast | `scheduler.ts`, `Today.tsx:56` | New status only ever transitions from `'active'` *out*; assertion test in T06 |
| R5 | `confirm()` in `FastTimer.tsx:28` is a native dialog — cannot be themed | `FastTimer.tsx` | T21 routes late completion through non-confirm flow; confirm only used for early abort |
| R6 | `ReminderSettings.tsx` already uses `prefs.dayOfTime` and `prefs.leadMinutes` — philosophy radio replaces these UI-wise but `reminders.ts::computeReminderTimes` still consumes them | `reminders.ts:70-80` | Keep `dayOfTime`/`leadMinutes` in profile (used by Standard pre-fast trigger) |
| R7 | Major-fast detection assumes S2's extended `SomaDayKind` (pradosh/sankashti/shivaratri) — current `types.ts` only has 4 kinds | `types.ts:13` | If S2 not merged, `isMajorFast` falls back to `{ekadashi, full-moon, new-moon, chaturthi}`; guard with `EXT_KINDS` flag |
| R8 | Migration runs on `loadState`; AppStateContext hydrates in `useEffect`. StrictMode double-effect must not cause double-write | `AppStateContext.tsx:37-39` | `migrateV2ToV3` is pure; `saveState` is idempotent on identical input |
| R9 | `src/__tests__/calendar.test.tsx` and `src/components/Calendar.tsx` are uncommitted (working tree) | working tree | Read both before T08; rebase on top of HEAD |
| R10 | Bundle size: 4 new components + 3 lib files ≈ 8-10 KB gzipped; near `<250 KB` budget if S2 also lands | bundle | Reuses MoonPhase + voice hooks; no new deps; verify with `npm run build` |

---

## J. PR Slicing — 4 PRs (each <30 min review)

| PR | Scope | Tasks | LOC | Review |
|---|---|---|---|---|
| **PR 1 — Engine + storage** | Types, mandala lib, delta lib, v3 migration, AppStateContext wiring, late-completed status, copy keys | T01–T07 | ~550 | 25 min |
| **PR 2 — Rhythm screen** | MandalaRing, MandalaChip, DeltaCard, PaksaSessionList, MandalaSeasonStrip, Rhythm.tsx, BottomNav rename, delete Trends | T08–T16 | ~700 | 30 min |
| **PR 3 — Notifications** | notificationPhilosophy.ts, ReminderSettings rewrite, reminders.ts integration, Settings reset-rhythm | T17–T19, T22 | ~450 | 25 min |
| **PR 4 — FastTimer reframe + cleanup** | FastTimer SyncedNow primary, phase glyph, late-completion flow, streak strip-out, regression | T20, T21, T23, T24 | ~400 | 30 min |

**Sequencing:** PR 1 first; PR 2 needs PR 1's types + `mandala.ts`; PR 3 needs PR 1's types + S1 voice infra (parallelizable with PR 2); PR 4 needs PR 1 + PR 2.

---

## K. Test Additions

### Unit
- `mandala.test.ts` — empty, single completed, threshold met/missed, carry-forward, aborted not counted, late-completed counted, manual reset, idempotency.
- `delta.test.ts` — n<3 no emit, |Δ|<floor no emit, |Δ|<SE no emit, valid sample emits, sort by |Δ| desc.
- `migration.v3.test.ts` — anchor null when no sessions, earliest dayDate when present, idempotent, v1→v2→v3 chain, beta snapshot.
- `notificationPhilosophy.test.ts` — Quiet=2-3, Standard=7-8, Detailed=15-19; Pradosh+Ekadashi dedupe; polar lat skips sunrise family.

### Component
- `MandalaRing.test.tsx`, `MandalaChip.test.tsx`, `DeltaCard.test.tsx`, `PaksaSessionList.test.tsx`, `ReminderSettings.test.tsx`.

### Regression
- `regression.s3.test.tsx` — v2 boot → Rhythm renders mandala, manual reset, late-complete flow, philosophy switching counts.
- `no-streak.test.ts` — grep `streak` in `src/` (excluding tests/comments) returns empty.

---

## L. Acceptance Criteria

- [ ] Mandala chip renders on Today for users with ≥1 completed fast; nothing otherwise.
- [ ] Rhythm screen replaces Trends; `TabId` updated; `Trends.tsx` deleted.
- [ ] Mandala history passes carry-forward unit tests.
- [ ] Personal deltas card hides under both gate failures; shows sign-aware copy when both pass.
- [ ] Migration v2→v3 derives anchor; idempotent; preserves all v2 fields.
- [ ] v1→v2→v3 chain works on captured beta snapshot.
- [ ] Manual reset rhythm in Settings updates `mandalaAnchor.manualResetDate`.
- [ ] Notification philosophy radio is the single control; default Quiet on fresh state.
- [ ] Quiet/Standard/Detailed produce 3/7-8/15-19 prompts on fixture month.
- [ ] FastTimer primary text reads "You're synced with N people"; countdown secondary.
- [ ] Phase glyph rides progress-ring head, re-renders each tick.
- [ ] Late completion emits `'late-completed'`, never red.
- [ ] Zero `streak` references in `src/` (excluding tests).
- [ ] `npm run typecheck && npm run test && npm run build` all green.
- [ ] No mandala "broken" status anywhere.
- [ ] Bundle delta < 12 KB gzipped vs S2 baseline.

---

## M. Voice Keys to Author (S3 batch — ~22 new keys)

```ts
'mandala.chip.template':       { coach: 'Mandala {n} · {days} of 40 days · {observed} of {expected} fasts',
                                 scientific: 'Cycle {n} · day {days}/40 · {observed}/{expected} sessions',
                                 traditional: 'Mandala {n} · {days} dinas of 40 · {observed} vrats of {expected}' },
'mandala.empty.title':         { coach: 'Your first mandala starts with your first fast.', /* ... */ },
'mandala.reset.cta':           { coach: 'Reset rhythm', scientific: 'Reset cycle anchor', traditional: 'Begin a new mandala' },
'rhythm.title':                { coach: 'Your rhythm', scientific: 'Cycle data', traditional: 'Your sadhana' },
'delta.focus.shukla-ekadashi': { coach: 'Your focus rises {sign}{delta} on Shukla Ekadashi' },
'delta.sleep.purnima':         { coach: 'Your sleep shifts {sign}{delta} hr near Purnima' },
'fast.synced.primary':         { coach: "You're synced with {n} people.",
                                 scientific: 'Approximately {n} observers in this window.',
                                 traditional: '{n} sadhakas observe with you.' },
'fast.lateComplete.title':     { coach: 'Logged · late completion', /* ... */ },
'fast.lateComplete.body':      { coach: "Bodies aren't clocks. The rhythm holds.",
                                 scientific: 'Late completion is non-punitive. Counts toward cycle.',
                                 traditional: 'The body keeps its own time. The vrat is honoured.' },
'notif.philosophy.title':      { coach: 'How often should we ping you?' },
'notif.philosophy.quiet':      { coach: 'Quiet · ~3 a month' },
'notif.philosophy.standard':   { coach: 'Standard · ~7-8 a month' },
'notif.philosophy.detailed':   { coach: 'Detailed · ~15-19 a month' },
'notif.philosophy.framing':    { coach: 'Soma is the slow app. Choose how often we should ping you.' },
'notif.ekadashi.morning':      { coach: 'Ekadashi today. {phrase}.' },
'notif.prefast':               { coach: 'Fast begins in {minutes} minutes.' },
'notif.parana':                { coach: 'Break fast between {start} and {end}.' },
'notif.pradosh.evening':       { coach: 'Pradosh begins this evening.' },
'notif.sankashti':             { coach: 'Sankashti Chaturthi tonight.' },
'notif.shivaratri':            { coach: 'Shivaratri tonight.' },
'notif.tithi.sunrise':         { coach: 'Sunrise · {tithi} begins.' },
'notif.reflection':            { coach: 'Take a minute to log how this day landed.' },
```

Full traditional + scientific variants land alongside their owning task.

---

## N. Out of Scope for S3

- Mandala animations beyond static SVG (S4)
- Programmatic SEO pages from delta data (S5)
- Health-data correlation in deltas (S5)
- Push notifications (no service worker yet)
- `confirm()` dialog redesign (S4)
- Streak import for users coming from competitors (deferred)

---

Status: ready for implementation
