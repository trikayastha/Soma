# Soma — Post-Consolidation Wireframes

**Date:** 2026-07-05
**Status:** Draft. Low-fi wireframes of the screens *after* the consolidation described in
the audit. Boxes are structure, not pixels — the phone-frame, ambient background, serif
headings, and calm voice all carry over unchanged.
**Related:** [UX Consolidation Audit](./2026-07-05-ux-consolidation-audit.md) ·
[Personas](./2026-07-05-personas.md) · [PSAK](./2026-07-05-psak.md)

Legend: `▸` collapsed/expandable · `▾` expanded · `( )` button · `[ ]` input · `●` selected

---

## a. Today — with integrated, collapsible Month (resolves F1, F7)

Merges the old Today and Calendar tabs. Today's `DaySwitcher` (horizontal week strip) and
the full Month grid become two views of **one** `selectedIso` selection — pick a day in
either, the shared day-detail card updates, and the selection no longer evaporates when
you navigate (the old "View on Today" dead-end button is gone).

```
┌─────────────────────────────────────────┐
│  GOOD MORNING, TRIBESH                    │  greeting + name
│  Waxing Gibbous                           │  serif phase title
│  78% illuminated · waxing                 │
│  Tithi 11 · Shukla Ekadashi               │
│  ⟢ Computed at sunrise · Kathmandu        │  ComputedAtBanner
│  ◔ Mandala 2 · 6 of 9 days                │  MandalaChip (rate, never a streak)
│  ● In sync with the moon now              │  SyncedNowPill (only when today = SomaDay)
├───────────────────────────────────────────┤
│  ‹  Mon Tue [Wed] Thu Fri Sat Sun  ›      │  DaySwitcher week strip (shared selection)
│                                           │
│                    ◑                      │  MoonPhase, 200px
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │ TODAY                               │  │  day-detail card (shared component)
│  │ Putrada Ekadashi                    │  │  serif headline (+ Ekadashi name if located)
│  │ 24-hour fast · 10-min meditation    │  │
│  │ Parana: break fast 06:12 – 09:44    │  │  only for Ekadashi + location
│  │ ─────────────────────────────────── │  │
│  │ Why this day?                    ▸  │  │  ONE WhyThisDay component (F2)
│  │   plain → ▸ Tradition  ▸ Science    │  │  disclosures; archetype nudge if quiz done
│  │ ─────────────────────────────────── │  │
│  │        (   Begin fast   )           │  │  disabled unless selected day = today
│  └─────────────────────────────────────┘  │
│                                           │
│  ▸ Month                                  │  COLLAPSIBLE month section (collapsed default)
├───────────────────────────────────────────┤
│   ◐ Today    ◇ Rhythm   ✦ Wisdom   ⚙      │  4-tab nav
└───────────────────────────────────────────┘
```

Month expanded (`▾`) — the old Calendar grid, inline:

```
│  ▾ Month                          July ▸  │  month stepper
│   S  M  T  W  T  F  S                     │
│         1  2  3  4  5                     │  fast days marked; observed days ringed
│   6  7  8 [9]10 11 12                     │  [9] = selectedIso, syncs the strip above
│  13 14 ⊙15 16 17 18 19                    │  ⊙ = scheduled SomaDay
│  ...                                      │
```

**Interaction notes.**
- One `selectedIso` drives the header moon-math, the week strip, the month grid, and the
  detail card. Selecting in the month scrolls focus back to the detail card.
- Month defaults collapsed so the Minimalist persona never scrolls past a calendar they
  didn't ask for; the Tradition-Keeper who plans ahead expands it once and it remembers.
- The detail card is the shared `DayDetailCard` (audit rec #1) — Ekadashi name, parana,
  and the single `WhyThisDay` component (rec #5) render here and nowhere else.
- Empty/rest day: card shows "no scheduled fast on this day / the rhythm is the practice."

---

## b. Onboarding — ~5 steps (resolves F3)

From 8 steps to 5 by three moves: **intent + goal merge** (one "why + what matters" step),
**archetype quiz deferred** to Settings, **experience + intensity merge** (ask experience,
recommend intensity inline on the same screen). Location leaves the required path and is
prompted later by the `ComputedAtBanner`. **Safety stays required** — it is load-bearing.

```
  ▓▓░░░  Step 1 — Intent + Goal            (was: intent, then a separate goal on "you")
  ┌─────────────────────────────────────┐
  │ Why are you here?                   │
  │ ┌────────────┐ ┌────────────┐       │  2×2 intent radiogroup
  │ │ Optimize   │ │ Follow     │       │  → sets theme + voice
  │ │ my body    │ │ tradition  │       │
  │ └────────────┘ └────────────┘       │
  │ ┌────────────┐ ┌────────────┐       │
  │ │ Tired of   │ │ Curious    │       │
  │ │ fasting..  │ │ about moon │       │
  │ └────────────┘ └────────────┘       │
  │ What matters most?                  │  goal, folded onto the same step
  │ (Sharper focus)(More calm)          │
  │ (Ritual & discipline)(Metabolic)    │
  │                    ( Continue )     │
  └─────────────────────────────────────┘

  ▓▓▓▓░  Step 2 — Welcome carousel         (rhythm → practice → commitment; 3 slides)
  ┌─────────────────────────────────────┐
  │ "A rhythm, not a regimen"           │
  │  ● ○ ○                ( Continue )  │
  └─────────────────────────────────────┘

  ▓▓▓▓▓  Step 3 — You                       (name only; goal already captured in step 1)
  ┌─────────────────────────────────────┐
  │ Tell us who you are                 │
  │ Name [___________________]          │
  │              ( Back )( Continue )   │
  └─────────────────────────────────────┘

  ▓▓▓▓▓  Step 4 — Experience + Intensity    (merged; experience drives the suggestion)
  ┌─────────────────────────────────────┐
  │ Your experience & intensity         │
  │ ( New )( Some IF )( Experienced )   │  experience → recommends below
  │ Suggested for you: 16h              │
  │ (12h)(●16h Suggested)(24h)          │  intensity, same screen
  │              ( Back )( Continue )   │
  └─────────────────────────────────────┘

  ▓▓▓▓▓  Step 5 — Safety  (REQUIRED — do not defer)
  ┌─────────────────────────────────────┐
  │ A few safety checks                 │
  │ [ ] Under 18                        │  any toggle ON → blocking verdict card,
  │ [ ] Pregnant / breastfeeding        │     "Soma cannot support this right now",
  │ [ ] Disordered-eating history       │     Enter Soma disabled
  │ [ ] Diabetes (type 1 or 2)          │
  │              ( Back )( Enter Soma ) │  → finish(): profile + 60-day schedule
  └─────────────────────────────────────┘

  Deferred, not deleted:
   · Archetype quiz  → Settings › Personalization (optional, nudge on Today later)
   · Location        → prompted by ComputedAtBanner when accuracy matters
```

**Interaction notes.**
- Progress bar shows 5 segments, so the flow *feels* shorter, not just is shorter.
- Merging goal into step 1 is safe because goal and intent are asked back-to-back and both
  feed personalization; the Newcomer still gets the carousel's framing at step 2.
- Safety's blocking verdict is unchanged — honest refusal with a reason (see Personas §5).

---

## c. Settings — grouped Practice / Personalization / Data & resets (resolves F4)

Nine flat sections become three labelled groups; destructive actions cluster at the bottom.
Archetype (deferred from onboarding) and location live here. Intent's ghost section folds
into Profile.

```
┌─────────────────────────────────────────┐
│  Settings                                 │
│                                           │
│  PRACTICE                                 │  ── group header
│  ┌─────────────────────────────────────┐ │
│  │ Profile  Tribesh                    │ │  name · goal · experience · (Re-run intent)
│  │ Default intensity  (12h)(●16h)(24h) │ │  regenerates 60-day schedule
│  │ Location  Kathmandu        (Clear)  │ │  anchors tithi at local sunrise
│  │ Reminders  17:00 · lead 30m         │ │  ReminderSettings
│  └─────────────────────────────────────┘ │
│                                           │
│  PERSONALIZATION                          │  ── group header ("how Soma feels")
│  ┌─────────────────────────────────────┐ │
│  │ Voice   ○ Scientific ●Coach ○Trad.  │ │  merged appearance group (F4)
│  │ Theme   ○ Performance ○Devot. ●Min. │ │
│  │ Energy archetype   Not set  (Take)  │ │  deferred quiz lands here (F3)
│  └─────────────────────────────────────┘ │
│                                           │
│  DATA & RESETS                            │  ── group header (destructive cluster)
│  ┌─────────────────────────────────────┐ │
│  │ Reset rhythm   (re-anchor mandala)  │ │  moved down from mid-list (F4)
│  │ ( Export my data (JSON) )           │ │
│  │ ( Reset Soma )   ← crimson          │ │  confirm dialog
│  └─────────────────────────────────────┘ │
│                                           │
│  Soma is wellness, not medicine.          │  persistent disclaimer
│  Beta v0.1 · lived lineage to the source  │
├───────────────────────────────────────────┤
│   ◐ Today    ◇ Rhythm   ✦ Wisdom   ⚙      │
└───────────────────────────────────────────┘
```

**Interaction notes.**
- Group headers are the only new chrome; no setting is removed, just reordered (audit F4:
  9 → 6 sections).
- "Reset rhythm" and "Reset Soma" now sit together so a user scanning for the scary buttons
  finds them in one place, each behind a confirm dialog.
- Both reset paths keep their existing `ConfirmDialog` / `ResetSomaDialog` — destructive
  actions never fire without confirmation.

---

## d. Wisdom — card, then Learn (resolves F2, F7)

Already merged (Learn folded in). Post-consolidation it also consumes the single
`WhyThisDay` component instead of its own divergent `<details>`.

```
┌─────────────────────────────────────────┐
│  Wisdom                                   │
│  A small card for today's lunar day.      │
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │        Shukla Ekadashi              │ │  WisdomCard (shareable)
│  │            ◑  78%                    │ │  live moon math
│  │        FOCUS                         │ │  one-word benefit
│  │  "A short fast steadies the mind    │ │  wisdom line
│  │   for the work that matters."       │ │
│  │              ( Share )              │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  ▸ Why this day?                          │  same WhyThisDay component as Today (F2)
│                                           │
│  Learn            Short, honest, optional.│  ── section below the card (F7)
│  ┌─────────────────────────────────────┐ │
│  │ TRADITION                           │ │
│  │ Why the moon became the calendar    │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │ SCIENCE  Full moon & sleep — 2013   │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │ PRACTICE  The "weak moon" reframe   │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │ CAUTION  Soma is wellness, not      │ │  the disclaimer, as a Learn card
│  │ medicine                            │ │
│  └─────────────────────────────────────┘ │
├───────────────────────────────────────────┤
│   ◐ Today    ◇ Rhythm   ✦ Wisdom   ⚙      │
└───────────────────────────────────────────┘
```

**Interaction notes.**
- Two headings (Wisdom h1, Learn h2) in one scroll — accepted for now. A Card / Reads
  segmented control is the next step *only if* Learn content grows (audit F7); don't build
  it yet.
- "Why this day?" here reuses the canonical Today layout in a compact variant, ending the
  two-implementation drift.

---

## e. Bottom nav — 4 tabs (resolves the 5 → 4 goal)

Calendar is gone as a tab; its month grid now lives inside Today (§a). Rhythm stays
separate on purpose — planning (Today) and reflection (Rhythm) are different mental modes
(audit §4).

```
┌───────────────────────────────────────────┐
│   ◐ Today    ◇ Rhythm    ✦ Wisdom    ⚙     │
│   ▔▔▔▔▔                                     │  active-tab underline
└───────────────────────────────────────────┘
     plan/act    reflect     learn/keep   config
```

**Interaction notes.**
- Four labelled tabs, at/below the 5-tab convention. Fast flow (pre-log → timer →
  meditation → post-log) remains full-screen overlays with **no nav** — unchanged and
  correct (audit §4).
- Icons illustrative only; match the existing icon set.
