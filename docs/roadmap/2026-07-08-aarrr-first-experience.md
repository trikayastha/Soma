# Soma — AARRR Review & First-Experience Roadmap

**Date:** 2026-07-08
**Status:** Proposed
**Owner:** Tribesh
**Goal:** Simplify the path for a new user to try Soma and get an amazing experience on their first visit.

---

## TL;DR

Soma's funnel has one dominant leak: **a new user must answer 6 screens of questions before seeing a single moon, tithi, or piece of value.** The retention mechanics (mandalas, deltas, reminders) and the shareable wisdom card are well built — but they sit behind an activation wall. The single highest-leverage change is inverting onboarding: show today's sky first, ask questions later. Second: there is zero analytics, so the funnel is invisible today.

---

## Current state (audited 2026-07-08, from code)

| AARRR Stage | Status | What exists today |
|---|---|---|
| Acquisition | Live, unmeasured | Landing page (`index.html`) with OG tags, "Open the app" CTA, mailto feedback link. No analytics, no PWA manifest, no email capture. |
| Activation | Live, heavy | 6-step onboarding (intent → carousel → name → location → safety → experience/intensity), no skip path. ~5 more taps to first fast, including a 5-input pre-fast mood log. |
| Retention | Strongest area | 40-day mandala cycles, session history, personal deltas (≥3 fasts), 3-tier reminders, .ics export. Reminders buried in Settings. |
| Referral | 90% built, unwired | 1080×1080 wisdom card with Web Share API + download fallback + share counter. Buried in Wisdom → Today; card has no URL back to Soma. |
| Revenue | None (intentional) | Free beta. No paywall, no payments, no email list. |
| Analytics | None | Privacy-first, all data on device. No events, no funnel visibility. |

---

## 1. Acquisition — decent landing, no measurement, weak hooks

1. **Add privacy-friendly analytics** (Vercel Analytics or Plausible — fits the "everything stays on your device" ethos better than GA). Without this, every other AARRR effort is guesswork. Minimum funnel events: landing view → "Open the app" click → onboarding step reached → first fast started.
2. **Add a real PWA manifest + icons** so "Add to Home Screen" works properly — install currently relies on a single apple meta tag. For a daily-rhythm app, home-screen presence is acquisition-to-retention glue.
3. **Show live value on the landing page**: render today's actual tithi + moon phase in the hero ("Today is Shukla Ekadashi — a fasting day"). Proves the app works before a single click; gives the page a reason to be revisited and shared.
4. **OG image = daily wisdom card**, not a static moon photo — every shared link becomes a live artifact.

## 2. Activation — the big one: value is 6 steps deep

**Principle: moon first, questions later.**

1. **First screen = today's moon + tithi + one-line meaning**, personalized to nothing. This is Soma's magic moment and it requires zero input. The user should see the app working within 2 seconds.
2. **Collapse onboarding to 2 required steps:**
   - **Keep:** Intent (load-bearing — sets theme/voice) and Safety (a genuine gate).
   - **Defer:** Name → Settings, default "Seeker" (already the fallback). Location → ask contextually the first time tithi precision matters, or on first fast start. Experience/intensity → ask at the moment of first "Begin fast" tap. Carousel → one skippable slide, or fold heritage content into Wisdom where it already lives.
3. **Define and instrument activation:** "user starts (or schedules) their first fast in session one." Make the pre-fast mood log skippable on the very first fast so nothing stands between the tap and the timer.
4. **Handle the rest-day first visit:** if a new user arrives on a non-fast day, today's CTA is dead. Offer "Your next fast is Ekadashi, in 3 days — want a reminder?" — converts a dead first visit into a retention hook.

## 3. Retention — strongest area; needs first-session wiring

1. **Ask for the reminder at the moment of intent**, not in Settings: right after onboarding or after the first fast completes — "Next Ekadashi is Thursday. Remind you?" One tap, one permission prompt with context.
2. **Lead with .ics calendar export** as the reliable channel (browser notifications on a non-installed PWA are fragile). "Add your next 60 days of fasts to your calendar" is a one-time action with lasting pull.
3. **Close the first-fast loop with a payoff screen:** after fast #1, show the mandala ring with its first mark filled + "2 more logged fasts and Soma starts showing your personal patterns." Names the reason to return.
4. **Surface mandala progress on Today** (small ring near the greeting) so the streak mechanic is felt daily, not only on the Rhythm tab.

## 4. Referral — the wisdom card is 90% built, 10% wired

1. **Put "soma — fast with the moon · somaa.vercel.app" on the card itself.** A shared card is currently a dead end; one line makes every share an acquisition channel.
2. **Offer the card at the emotional peak:** on the fast-completion screen ("You completed the fast — share today's card"), not only in a tab nobody is told about.
3. **Share affordance on the landing page's daily tithi** — people share "today is a full moon" moments even without the app.
4. **Skip referral codes/invites** for now — no accounts, no backend; not worth building at beta stage.

## 5. Revenue — correctly zero; don't lose the signal

Don't build a paywall. Two cheap moves:

1. Replace the mailto with **lightweight email capture** ("get notified when Soma leaves beta") — that list is the future launch and monetization audience.
2. Once analytics land, **watch which surfaces get depth** (meditation, reads, deltas) — that's the future premium map. Decide pricing after retention is proven, not before.

---

## Execution phases

| Phase | Work | Why this order | Effort |
|---|---|---|---|
| 1 | Analytics + funnel events; wisdom card URL watermark | Measurement + free viral loop | ~1 day |
| 2 | Onboarding inversion: moon-first opening, 2 required steps, progressive asks, skippable first pre-fast log, rest-day path | The activation wall; biggest metric mover | ~3–5 days |
| 3 | First-fast completion loop: payoff screen (mandala first mark) + share prompt + contextual reminder ask + .ics surfacing | Wires retention & referral into the first session | ~2–3 days |
| 4 | PWA manifest + live tithi on landing + email capture + OG-as-wisdom-card | Acquisition polish once the funnel behind it converts | ~2 days |

**Open design decision (Phase 2):** how much of onboarding to defer. Recommendation: intent + safety are the only gates; every other question earns its place at the moment it's used.

## Success metrics (once Phase 1 lands)

- **Activation rate:** % of new visitors who start or schedule a fast in session one (primary).
- **Onboarding completion:** % reaching the app from onboarding start (expect large lift after Phase 2).
- **D7 return:** % of activated users back within 7 days (reminder + calendar work).
- **Share rate:** wisdom-card shares per weekly active user (`wisdomCardCount` already tracked locally).
- **Landing CTR:** landing view → "Open the app".

---

## Addendum (2026-07-08, later) — analytics is now LIVE

The "Analytics: None" row above is **superseded**. PostHog is wired on both
surfaces (shared project token → landing→app is one funnel):

- **Landing** (`index.html` inline snippet + `moon.js`): `open_app_click`
  (with `location` placement), `email_subscribed` (`source: 'landing'`).
- **App** (`src/lib/analytics.ts` provider-agnostic wrapper → `posthog.ts`):
  privacy-first, no PII, never throws, no-op off-browser.

### Complete AARRR event map (post gap-fill)

| Stage | Events |
|---|---|
| **Acquisition** | `app_opened` *(+ `returning` new/repeat)*, `pwa_installed`, `open_app_click`ᴸ, `email_subscribed`ᴸ |
| **Activation** | `value_seen` ⁿ *(moon-first magic moment)*, `onboarding_step`, `intent_selected` ⁿ, `safety_gate` ⁿ *(passed/**blocked**)*, `onboarding_complete`, `first_fast_intensity_chosen`, `fast_started` *(`first`, `logged` = skip-vs-log)*, `tithi_sheet_viewed`, `meditation_started` |
| **Retention** | `fast_completed` *(now also on late-complete path)*, `fast_aborted`, `mandala_milestone` ⁿ *(first_mark payoff)*, `tab_switched` ⁿ, `wisdom_segment_changed` ⁿ *(`you` = deltas payoff)*, `read_filter_changed` ⁿ, `reminder_scheduled`, `notification_philosophy_changed`, `calendar_exported` *(`source`)*, `archetype_completed`, `settings_*` |
| **Referral** | `wisdom_card_shared` *(`result`, `tithi`)* |
| **Revenue** | `email_subscribed`ᴸ *(future launch list)*, `data_exported` *(power-user proxy)* |

ᴸ = landing-page event · ⁿ = added in the 2026-07-08 gap-fill.

**Deliberately not added (already answered by an existing prop):** pre-log
skip-vs-submit → `fast_started.logged`; rest-day scheduling intent →
`calendar_exported.source: 'rest_day_first_visit'`; onboarding start →
`onboarding_step` index 0.

### Highest-value dashboards to build in PostHog

1. **Activation funnel:** `app_opened` → `value_seen` → `onboarding_complete` →
   `fast_started` (breakdown by `intent`). Isolates the magic-moment→commit drop.
2. **Safety loss:** `safety_gate` result=`blocked` rate — users the product turns
   away, invisible before this pass.
3. **First-fast loop:** `fast_completed` → `mandala_milestone` → D1/D7 return.
4. **Referral loop:** `wisdom_card_shared` → new `app_opened` (`returning:false`).
