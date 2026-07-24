# Soma — User Journeys & Journey-Driven Instrumentation Plan

**Purpose:** Define *what a user actually comes to Soma to do*, map each journey to the UI that serves it and the events that measure it, and specify the instrumentation still missing to make every journey visible. This is the behavioural companion to `docs/analytics.md` (the wire contract) and `docs/roadmap/2026-07-08-aarrr-first-experience.md` (the AARRR strategy).

**Last verified against code:** 2026-07-09
**Scope:** the React app (`/app/`). Landing (`/`) journeys are covered by `open_app_click` / `email_subscribed` in `docs/analytics.md` §6.

**How to read:** §1 is who the user is and why they open the app. §2 is the journey map at a glance. §3 details each journey (intent → steps → components → current events → gaps). §4 is the cross-journey engagement model. §5 is the **updated instrumentation plan** — the proposed new events, prioritised, with a companion "deliberately not tracking" list. §6 is implementation guidance and the dashboards it unlocks.

---

## 1. Who opens Soma, and why

Soma is a **daily-rhythm app**, not a session-goal app. The user is not trying to "finish" anything; they are trying to stay in sync with a cycle. Every journey below is a variation on one root question the user brings each time they open the app:

> **"Where is the moon right now, and what does that ask of me today?"**

From that root, four motivations branch:

| Motivation | Plain-language intent | Primary surface | Frequency |
|---|---|---|---|
| **Orient** | "What's the moon doing today — is this a fasting day?" | Today (moon + tithi + calendar) | Every open (daily) |
| **Commit** | "Begin the fast and get through it." | Fast flow (intensity → log → timer → meditation → complete) | On fast days (~2×/lunar month + personal vrats) |
| **Reflect** | "How am I doing — is the rhythm holding?" | Rhythm (mandala, deltas, history) | Weekly-ish |
| **Learn / share** | "Why this day? — and this is worth sharing." | Wisdom (today card, reads, deltas) + share | Occasional, spikes at peak moments |

The **Orient** loop is the load-bearing habit — it happens on *every* visit, including rest days when there is nothing to do. It is also, today, our **biggest measurement blind spot** (see J2). The user's own framing — "learn about the moon state, then start the fast, interact with the calendar" — is exactly the Orient → Commit spine.

---

## 2. Journey map at a glance

| # | Journey | Trigger | Root motivation | AARRR | How well measured today |
|---|---|---|---|---|---|
| **J1** | **First Light** — new visitor to first fast | Landing CTA / cold open | Orient → Commit | Acquisition → Activation | Strong (spine instrumented; calendar + carousel gaps) |
| **J2** | **Daily Check-in** — returning orient loop | Habit / reminder / calendar event | Orient | Retention | **Weak — the core loop is nearly invisible** |
| **J3** | **The Fast** — active session | "Begin fast" tap / resume | Commit | Activation → Retention | Good (start/complete/abort tracked; depth gaps) |
| **J4** | **Reflection** — Rhythm tab | Curiosity / streak pull | Reflect | Retention | Partial (arrival tracked; on-tab engagement not) |
| **J5** | **Learn & Share** — Wisdom tab | Curiosity / peak moment | Learn → Referral | Retention → Referral | Partial (segments/filter tracked; preview→share funnel + product gap) |
| **J6** | **Personalize** — Settings | Tuning / friction / churn | (supports all) | Retention | Strong (resets & channel-denial gaps) |
| **J7** | **Commit to a Channel** — reminders/calendar | Cross-cuts J1/J3/J6 | Retention intent | Retention | Good (denied-permission loss invisible) |

---

## 3. The journeys in detail

### J1 — First Light (new visitor → first fast) · *Acquisition → Activation*

**Trigger:** landing "Open the app" tap, or a cold first open. **Intent:** see whether this is real and worth their time. **Emotional arc:** curious → reassured (moon works instantly) → invested (I started something).

**Step-by-step:**

| Step | UI surface | User does | Event today | AARRR |
|---|---|---|---|---|
| 1 | `main.tsx` boot | App opens (first ever) | `app_opened { returning:false }` | Acq |
| 2 | `Onboarding` → MoonFirstStep | Sees today's moon + tithi (the magic moment, zero input) | `value_seen { tithi_index }` | Act |
| 3 | `onboarding/IntentRouter` | Picks an intent (sets theme + voice) | `intent_selected { intent, theme, voice }` | Act |
| 4 | `OnboardingCarousel` | Advances heritage slides | *(only step-reach via `onboarding_step`)* | Act |
| 5 | `Onboarding` safety | Answers safety gate | `safety_gate { result, reason? }` | Act |
| 6 | `LocationStep` | Sets or skips location | **skip/source not tracked** | Act |
| 7 | `Onboarding.finish()` | Completes onboarding → `identify()` | `onboarding_complete { intent, goal }` | Act |
| 8 | `Today` | Lands on today's sky; may open tithi sheet / browse calendar | `tithi_sheet_viewed`; **calendar untracked** | Act |
| 9 | `DayCard` / primary CTA | Taps "Begin today's fast" | *(fires at step 11)* | Act |
| 10 | `FirstFastIntensity` | Chooses fast length (first fast only) | `first_fast_intensity_chosen { intensity }` | Act |
| 11 | `LogForm` (pre-log, **skippable on first**) | Logs mood or skips → fast starts | `fast_started { kind, intensity, first:true, logged }` | Act |
| 12 | `FastTimer` | Watches the timer; may open meditation | `meditation_started` | Act/Ret |
| 13 | `LogForm` (post-log) | Logs feeling → completes | `fast_completed { status, intensity }` | Ret |
| 14 | `FastComplete` | Sees mandala first mark payoff | `mandala_milestone { first_mark }` | Ret |
| 15 | `FastComplete` | Adds calendar / enables reminders | `calendar_exported`, `reminder_scheduled` | Ret |

**Gaps in J1:** (a) the **calendar** — a new user browsing "when is my next fast?" leaves no trace (steps 8); (b) **carousel** advance/skip depth (step 4); (c) **location skip vs set + source** (step 6); (d) **no share offered at the completion peak** (step 15 — see J5 product gap).

---

### J2 — Daily Check-in (returning orient loop) · *Retention* · **the core habit**

**Trigger:** habit, a fired reminder, or a calendar event. **Intent — the user's own words:** *learn the moon state, then decide whether to fast, and look at the calendar.* **Emotional arc:** brief, ritual, reassuring. Most opens end without a fast (the rhythm isn't daily) — and that is a *healthy* visit, not a bounce.

**Step-by-step:**

| Step | UI surface | User does | Event today |
|---|---|---|---|
| 1 | `main.tsx` | Opens app | `app_opened { returning:true }` |
| 2 | `Today` header + `MoonPhase` | Reads phase name, % illuminated, waxing/waning, tithi one-liner | **none** (implicit in landing on Today) |
| 3 | tithi line button | Taps for the deeper meaning | `tithi_sheet_viewed { tithi_index }` |
| 4 | `TithiSheet` | Expands Tradition / Science, taps a citation | **none** |
| 5 | `Calendar` + `PhaseRhythmStrip` | Scans the month, changes month, selects another day to see if a fast is near | **none — fully invisible** |
| 6 | `DayCard` | Reads the selected day; begins, or sees rest-day / next-fast card | `fast_started` *(if they act)*; `calendar_exported {rest_day_first_visit}` |
| 7 | — | Closes the app, oriented | **none** |

**Gaps in J2 — this is the priority.** The single most frequent journey is the least measured. We can see the user *arrived* (`app_opened`) but almost nothing about the **Orient behaviour itself**: did they engage the moon, browse the calendar, look ahead to the next fast, or bounce cold? Without calendar events we cannot answer *"do daily check-ins that browse the calendar retain better?"* or *"how far ahead do users plan?"* — both central to the retention thesis. **Fix: J2 drives proposed events N1–N2 (calendar) and N7 (content depth).**

---

### J3 — The Fast (active session) · *Activation → Retention*

**Trigger:** "Begin fast" tap, or "Fast in progress · Open timer" resume. **Intent:** get through the fast with support. **Emotional arc:** commitment → effort → relief/pride.

**Step-by-step:**

| Step | UI surface | User does | Event today |
|---|---|---|---|
| 1 | `Today` CTA / `ActiveCard` | Starts or resumes | `fast_started` / *(resume: none)* |
| 2 | `FastTimer` | Watches progress ring; toggles elapsed/remaining | **none (UI-only, intentionally)** |
| 3 | `FastTimer` → `Meditation` | Opens paired meditation | `meditation_started { intensity }` |
| 4 | `Meditation` | Begins breathing, runs to end | **`meditation_completed` — missing** |
| 5 | `FastTimer` | Ends early / late-completes | `fast_aborted { progress_pct }` / `fast_completed { via:'timer_late' }` |
| 6 | `LogForm` → `FastComplete` | Post-log → payoff | `fast_completed`, `mandala_milestone` |

**Gaps in J3:** **meditation completion/depth** (step 4) — `meditation_started` fires, but whether the user actually *sat* through it (the "depth" surface the roadmap flags for future premium) is unmeasured. Resume-from-Today and the timer's back/exit are deliberately left alone (backgrounding a running fast is expected, not a drop). **Fix: proposed event N4.**

---

### J4 — Reflection (Rhythm tab) · *Retention*

**Trigger:** curiosity / the streak pull. **Intent:** "is the rhythm holding, and what is it doing to me?" **Emotional arc:** anticipation → validation (the ring fills, deltas turn positive).

**Steps:** `tab_switched {to:'rhythm'}` → `WeekGlance` (last 7) → `MandalaRing` + completion % → `DeltaCard` (energy/focus/mood/sleep deltas, ≥3 fasts) → `PaksaSessionList` (history) → `MandalaSeasonStrip` → gear → Settings.

**Current events:** arrival via `tab_switched`; the "deltas payoff" is proxied by `wisdom_segment_changed {segment:'you'}` in the Wisdom tab — **but the DeltaCard on the Rhythm tab is a separate surface and its view/expand is not tracked.** Reflection is otherwise read-only (WeekGlance, MandalaRing, SeasonStrip, PaksaSessionList have no taps — correctly nothing to track).

**Gap in J4:** DeltaCard **"Show all / Show less" expand** and the fact that a Rhythm-tab user *reached the deltas* at all. **Fix: proposed event N7 (`content_expanded { section:'delta_detail' }`).**

---

### J5 — Learn & Share (Wisdom tab) · *Retention → Referral*

**Trigger:** curiosity, or an emotional peak (a full moon, a completed fast). **Intent:** understand *why* this day matters, and — at the peak — share it. **Emotional arc:** learning → resonance → outward impulse to share.

**Steps:** `tab_switched {to:'wisdom'}` → `SegmentedControl` today/reads/you (`wisdom_segment_changed`) → in *reads*, `read_filter_changed` → in *today*, preview the card, then share/download (`wisdom_card_shared { result, tithi }`).

**Gaps in J5:**
1. **Preview → share funnel:** the "Preview & share today's card" disclosure is untracked, so we see completed shares but not the *intent* that didn't convert. **Fix: N7 `content_expanded { section:'wisdom_card_preview' }`.**
2. **PRODUCT gap (flag, not just instrumentation):** the roadmap (§4.2) called for offering the card **at the completion peak** on `FastComplete` — the highest-intent share moment. `FastComplete.tsx` still offers only calendar + reminders, **no share.** Instrumentation cannot measure a share the UI never offers. **This is the single highest-leverage referral fix and it is still unbuilt.** Recommend wiring the share into `FastComplete` (emits the existing `wisdom_card_shared { … , source:'fast_complete' }`).

---

### J6 — Personalize (Settings) · *Retention (and churn signal)*

**Trigger:** tuning, friction, or the beginning of abandonment. **Intent:** make Soma fit — or, at the dark end, undo it. **Emotional arc:** ranges from investment (set my city, pick my voice) to **exit** (reset everything).

**Well-instrumented:** `settings_intensity_changed`, `settings_location_set`, `settings_voice_changed`, `settings_theme_changed`, `archetype_completed`, `data_exported`, plus reminders (J7).

**Gaps in J6 — the destructive/exit edge is unmeasured:**
- **Reset rhythm** (`confirmResetRhythm` → `manualResetMandala()`) — no event.
- **Reset Soma** (`handleResetConfirmed` → wipes state + localStorage) — **no event. This is the strongest near-churn signal in the app and it is invisible.**
- **Re-run intent picker** (`resetIntent`) — no event.
- **Archetype quiz start/skip** — only completion is tracked, so no start→complete rate.
- **Location clear**, and **location set/skip source** (onboarding vs settings vs contextual).

**Fix:** proposed events N6 (`data_reset`), N9 (`archetype_started`), N10 (`location_skipped` + `source` prop).

---

### J7 — Commit to a Channel (reminders / calendar) · *Retention* · cross-cuts J1, J3, J6

**Trigger:** appears at three moments — after first fast (`FastComplete`), in `ReminderSettings`, and on the rest-day card (`Today`). **Intent:** "make sure I don't miss the next one." This is the retention channel commitment — the roadmap's core retention lever.

**Current events:** `reminder_scheduled { channel, source? }`, `calendar_exported { source }` (three sources: `rest_day_first_visit`, `fast_complete`, `settings`), `notification_philosophy_changed`.

**Gap in J7:** **denied notification permission is silently swallowed.** `FastComplete.handleEnableReminders` sets local `reminderStatus='blocked'` on a denied prompt but fires **no event** — so a lost retention channel (the exact analogue of `safety_gate {result:'blocked'}`) is invisible. **Fix: proposed event N5 (`reminder_permission_denied`).** The reminder time/lead-time config pills are deliberately left untracked (micro-config noise; philosophy already captured).

---

## 4. Cross-journey engagement model

```
                      app_opened
                          │
              ┌───────────┴───────────┐
        returning:false          returning:true
              │                        │
         [J1 First Light]        [J2 Daily Check-in]  ← the habit, every open
              │                        │
              └──────────┬─────────────┘
                         ▼
                 Orient on Today
        (moon · tithi · CALENDAR  ← least measured)
                         │
             is today / chosen day a fast?
                  ┌──────┴───────┐
                 yes             no
                  ▼               ▼
            [J3 The Fast]   rest-day / next-fast card
             start→timer→        │ (calendar_exported)
             meditation→          │
             complete→payoff      │
                  │               │
                  ├──► [J7 Commit to a channel] ◄── Settings (J6)
                  │
                  ▼
        [J5 Learn & Share] ──► share ──► new app_opened(returning:false)  (referral loop)
                  │
                  ▼
        [J4 Reflection] weekly ── mandala fills ── reason to return
                                       │
                              (dark edge) ──► [J6 reset/exit]  ← churn signal (invisible today)
```

**Engagement cadence:** J2 daily · J3 on fast days · J4 weekly · J5 at peaks · J6/J7 rarely but high-signal. **The measurement priority follows frequency × blindness:** J2 (highest frequency, near-zero visibility) is #1, the churn/denial edges of J6/J7 are #2 (rare but decision-changing), depth signals in J3/J4/J5 are #3.

---

## 5. Updated instrumentation plan

Following the existing discipline in `docs/analytics.md` §5/§8: **coarse enums/booleans/indices/counts only, no PII, prefer a prop over a new event, dedupe redundant fires, never throw.** Every event below is a member to add to the `AnalyticsEvent` union first.

### 5.1 Proposed new events (prioritised)

| # | Event | Props | Fire from | Journey | AARRR | Priority | Why it changes a decision |
|---|---|---|---|---|---|---|---|
| **N1** | `calendar_day_selected` | `offset_days:int`, `is_fast_day:bool` | `Calendar.tsx` (via `Today`), on select of a **non-today** day; dedupe repeats | J2, J1 | Retention | **P1** | Makes the core Orient loop visible; "do calendar-browsers retain better?"; how far ahead people plan. Coarse `offset_days` (days from today), never a raw date. |
| **N2** | `calendar_month_changed` | `direction:'prev'\|'next'` | `Calendar.tsx` month stepper | J2 | Retention | **P1** | Forward-planning intent vs back-reference. |
| **N4** | `meditation_completed` | `duration_sec:int`, `intensity` | `Meditation.tsx` when `elapsed` reaches `durationSeconds` (wire an `onComplete`) | J3 | Retention | **P1** | Turns `meditation_started` into a completion rate — the "depth" surface flagged as the future premium map. |
| **N5** | `reminder_permission_denied` | `source:'fast_complete'\|'settings'` | `FastComplete.handleEnableReminders` else-branch; `ReminderSettings` | J7 | Retention | **P1** | A lost retention channel, currently swallowed. Direct analogue of `safety_gate {blocked}`. |
| **N6** | `data_reset` | `scope:'rhythm'\|'all'\|'intent'` | `Settings` `confirmResetRhythm` / `handleResetConfirmed` / `resetIntent` | J6 | Retention | **P1** | Strongest near-churn signal in the app; `scope:'all'` = user wiped everything. |
| **N7** | `content_expanded` | `section:'why_this_day'\|'tithi_tradition'\|'tithi_science'\|'delta_detail'\|'wisdom_card_preview'` | `WhyThisDay`, `TithiSheet`, `DeltaCard`, `Wisdom` — fire on **open only** | J2, J4, J5 | Retention | **P2** | One event, five surfaces: measures which explanations users seek → "which surfaces get depth." Feeds J5 preview→share and J4 delta reach. |
| **N8** | `citation_opened` | `location:'tithi_sheet'\|'why_this_day'`, `followed_link:bool` | `ReceiptChip.tsx` | J2, J5 | Retention | **P2** | Trust/credibility engagement; `followed_link:true` = clicked through to a source. |
| **N9** | `archetype_started` | `source:'onboarding'\|'settings'` | `EnergyArchetype` begin | J6 | Retention | **P3** | Gives the quiz a start→complete funnel (only completion tracked today). |
| **N10** | `location_skipped` | `source:'onboarding'\|'settings'` | `LocationStep` / `Settings` clear+skip | J1, J6 | Activation | **P3** | Measures the roadmap's "defer location" bet. *Also add a `source` prop to the existing `settings_location_set` → unify as `location_set { country_code, tz, source }`.* |

> **Numbering note:** N3 intentionally omitted — an earlier draft's `moon_state_viewed` was cut as redundant with `app_opened` + Today being the default tab (it would fire on every open). Kept out to preserve signal.

### 5.2 Companion product fix (not an event — a UI gap that blocks measurement)

- **Wire the wisdom-card share into `FastComplete`** (roadmap §4.2). It emits the *existing* `wisdom_card_shared` with a new `source:'fast_complete'` value. Highest-leverage referral change; the event already exists, the UI does not.

### 5.3 Deliberately **not** tracking (discipline — noise or already answered)

| Interaction | Why not |
|---|---|
| Progress-ring elapsed/remaining toggle (`FastTimer`) | Pure display preference, no funnel meaning. |
| Meditation Pause / Resume (`Meditation`) | Mid-session fidget; `meditation_completed` (N4) is the real signal. |
| Reminder time / lead-time pills (`ReminderSettings`) | Micro-config; philosophy already captured by `notification_philosophy_changed`. |
| `FastComplete` "Done", `TithiSheet` close, dialog Cancels, Back buttons | Expected terminal taps; their absence is inferable from the preceding event. |
| `PhaseRhythmStrip` "reset to today" tap | Trivial navigation. |
| Raw calendar date-cell values | Collapsed into `calendar_day_selected { offset_days }` — coarse offset only, never a raw date (privacy + signal). |
| `WeekGlance` / `MandalaRing` / `MandalaSeasonStrip` / `PaksaSessionList` | Read-only, no interactions. |
| Individual *reads* item taps (`Wisdom`) | Covered by `read_filter_changed` + segment; add only if reads depth becomes a live question. |
| Onboarding carousel slide advance/swipe | **Deferred** — the roadmap is collapsing the carousel to one skippable slide (Phase 2); instrumenting churning UI is waste. Revisit after Phase 2 with a single `carousel_skipped`. |

---

## 6. Implementation notes & dashboards

### Adding these events (per `docs/analytics.md` §8)

1. Add each name to the `AnalyticsEvent` union in `src/lib/analytics.ts` (compile gate).
2. Fire from the call site: `import { track } from '../lib/analytics'` — never `posthog-js`.
3. **Dedupe** the high-frequency ones: `calendar_day_selected` guards same-day re-selection and only fires for non-today dates; `content_expanded` fires on open, not toggle-close (mirror the `tab_switched` / `wisdom_segment_changed` `if (next === current) return;` pattern).
4. **Coarse props only:** `offset_days` (int), never a raw ISO date; enums for every `source` / `scope` / `section`.
5. Update `docs/analytics.md` §6 (move the row from "Planned" to the live table) and, if it changes the funnel story, this doc and the roadmap event map.
6. **Watch the volume:** `calendar_day_selected` is the highest-cardinality addition — confirm it doesn't dominate ingest before adding finer props.

### Dashboards these unlock (extend `docs/analytics.md` §10 / roadmap §"dashboards")

1. **Orient-loop engagement (new):** among `app_opened {returning:true}`, the rate that fire `calendar_day_selected` / `calendar_month_changed` / `content_expanded` — the first real view into the daily habit (J2). Segment retention by "browses calendar" vs "cold open."
2. **Planning horizon:** distribution of `calendar_day_selected.offset_days` — how far ahead users look.
3. **Meditation depth:** `meditation_started → meditation_completed` rate + `duration_sec` distribution (J3; future-premium signal).
4. **Retention-channel loss:** `reminder_scheduled` vs `reminder_permission_denied` (J7) — mirrors the safety-loss dashboard.
5. **Churn early-warning:** `data_reset {scope:'all'}` rate and its lead-time before last-seen (J6).
6. **Referral peak conversion:** once §5.2 ships, `fast_completed → wisdom_card_shared {source:'fast_complete'}` (J5).

---

**Maintenance:** update this doc whenever a journey changes shape (a screen is added/removed/reordered) or an event on the plan ships. Keep §5.1 in sync with `docs/analytics.md` §6 — as each event goes live, mark it here and move its row there.
