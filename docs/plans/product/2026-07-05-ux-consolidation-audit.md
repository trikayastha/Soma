# Soma App — UX Consolidation & Streamlining Audit

**Date:** 2026-07-05
**Scope:** React app (`src/`) — screens, navigation, flows
**Status:** Findings + recommendations. No code changes made as part of this doc.

---

## 1. Current experience map

The app is already fairly lean after the Wisdom + Learn merge (2026-07-05):

- **5 bottom-nav tabs:** Today · Calendar · Rhythm · Wisdom · Settings
- **4 full-screen overlays** (no nav, by design): pre-log → fast timer → meditation → post-log
- **8-step onboarding:** intent → archetype quiz → welcome carousel → you → location → experience → safety → intensity

Screen sizes (lines): Onboarding 420, Settings 371, Today 369, EnergyArchetype 268, FastTimer 243, Wisdom 179, Meditation 175, Calendar screen 107 (+ Calendar grid component 308), LogForm 87, Rhythm 58.

---

## 2. Findings

### F1 — Today vs Calendar overlap (highest-value consolidation)

Both screens independently:

- keep their own `selectedIso` state (`Today.tsx:36`, `Calendar.tsx:18`)
- build the same `scheduleByDate` map from `state.schedule` (`Today.tsx:61-65`, `Calendar.tsx:24-28`)
- compute tithi at sunrise for the selected day
- render a near-identical "selected day" card (accent label · serif title · fast metadata · `Begin fast` button disabled unless today)

Calendar's disabled button literally says **"View on Today"** (`Calendar.tsx:99`) — the UI itself admits the two screens are one job split in half. Selection also doesn't carry across tabs: pick a day in Calendar, switch to Today, and the selection is gone.

**Recommendation:** extract a shared `DayDetailCard` component consumed by both screens (low effort), and consider lifting `selectedIso` into shared state so Today's `DaySwitcher` and Calendar's grid are two views of one selection (medium effort). A full Today/Calendar merge into a single tab is possible but not required to remove the duplication.

### F2 — "Why this day?" duplicated in two implementations

- `Today.tsx` `SelectedDayCard`: custom expandable button + Tradition/Science `<details>` (`Today.tsx:240-272`)
- `Wisdom.tsx`: separate `<details>` rendering `getWhyCopy(...).plain` (`Wisdom.tsx` "Why this day?" block)

Same content source (`lib/whyThisDay.ts`), two divergent UIs.

**Recommendation:** one `WhyThisDay` component with a `compact` variant; keep the richer Today version as the canonical layout.

### F3 — Onboarding is 8 steps before first value

Two steps are optional-by-nature and already re-runnable from Settings:

- **Archetype quiz** (3 questions, skippable, retake in Settings) — defer to a post-onboarding nudge on Today or keep in Settings only.
- **Location** (has its own step, also fully editable in Settings) — could fold into the intensity/final step as an inline optional field, or defer with a "computed at noon UTC" accuracy banner prompting for it later (the `ComputedAtBanner` already communicates accuracy).

That would take onboarding from 8 → 6 steps with no loss of capability. Intent + welcome carousel could additionally merge (intent picker as the carousel's final slide) → 5 steps.

### F4 — Settings sprawl: 9 sections + 2 dialogs + 1 sub-screen

Current order: Profile, Default intensity, Voice, Theme, Energy archetype, Intent, Location, Reminders, Rhythm reset, Data.

- **Intent section** exists only to re-run the intent picker — one ghost button with explainer text. Merge into the Profile card.
- **Voice + Theme** are both "how Soma feels" pickers with identical card-list UI. Group under one "Appearance & voice" section.
- **Rhythm reset** is a destructive-ish action living mid-list. Move next to Data (Export / Reset) so all destructive/maintenance actions cluster at the bottom.

Result: 9 sections → 6 with no functionality removed.

### F5 — Duplicated inline UI primitives

Recur across Onboarding, Settings, LogForm without shared components:

- **Option-card select list** (label + sub, glow border when selected): `YouStep` goals, `ExperienceStep`, `IntensityStep`, Settings Voice, Settings Theme — 5 hand-rolled copies of the same pattern.
- **Intensity picker** appears twice with different UIs (onboarding card list vs Settings pill row).
- **ChevronIcon** is defined locally in `Today.tsx`; similar disclosure affordances exist elsewhere.

**Recommendation:** extract `OptionCardList` (single component, ~40 lines) and reuse in all 5 places; pick one intensity-picker presentation.

### F6 — Screen-header boilerplate

Every tab screen repeats the same shell: `AmbientBackground` + `animate-fade-in` wrapper + `<header className="px-6 pt-6">` + serif h1 + mist subtitle + scrollable body. Six near-identical copies.

**Recommendation:** a `ScreenShell` / `TabScreen` layout component (title, subtitle, optional header extras, scrollable children). Cuts ~15 lines per screen and guarantees consistency.

### F7 — Wisdom screen post-merge (minor)

After folding Learn into Wisdom, the screen now has two sequential headings ("Wisdom" h1, "Learn" h2). Fine for now; if it grows, a lightweight segmented control (Card / Reads) is the next step — but don't add it until the Learn content actually grows.

---

## 3. Prioritized recommendations

| # | Change | Impact | Effort | Removes |
|---|--------|--------|--------|---------|
| 1 | Shared `DayDetailCard` for Today + Calendar (F1) | High | S | ~80 duplicated lines, drift risk |
| 2 | Extract `OptionCardList` primitive (F5) | Med | S | 5 hand-rolled copies |
| 3 | Settings regroup 9 → 6 sections (F4) | Med | S | Scroll length, scattered destructive actions |
| 4 | Onboarding 8 → 6 steps: defer archetype + location (F3) | High | M | 2 pre-value steps |
| 5 | Shared `WhyThisDay` component (F2) | Low | S | Divergent duplicate |
| 6 | `ScreenShell` layout component (F6) | Med | S | ~90 lines of shell boilerplate |
| 7 | Lift `selectedIso` to shared state across Today/Calendar (F1) | Med | M | Lost-selection papercut |

Suggested order: 1 → 2 → 3 (pure consolidation, no behavior change) then 4 (behavior change, needs onboarding test updates).

## 4. Keep as-is (deliberately)

- **Overlay fast flow** (pre-log → timer → meditation → post-log): full-screen focus is the right call; no consolidation needed.
- **Rhythm tab**: already thin (58 lines) and distinct from Calendar (reflection vs planning). Merging it into Calendar would conflate two mental modes.
- **5-tab nav**: at or below the 5-tab convention; further trimming (e.g. Settings behind a header icon) is optional polish, not a fix.
