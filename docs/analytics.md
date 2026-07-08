# Soma — Analytics Architecture

**Purpose:** Canonical reference for how measurement works in Soma. Read this before adding an event, changing the funnel, touching PostHog config, or auditing the privacy posture. Companion to `docs/ARCHITECTURE.md` (§1 privacy invariant, §11 deps) and `docs/roadmap/2026-07-08-aarrr-first-experience.md` (the AARRR strategy this instruments).

**Last verified against code:** 2026-07-08
**Vendor:** PostHog (US Cloud, project 502965) · one project, both surfaces
**Stance:** privacy-first — no PII, no cross-site identifiers, never throws, no-op off-browser

---

## 1. Topology — two surfaces, one funnel

Soma ships as one deploy with two independently-instrumented surfaces that report into the **same PostHog project token**, so `landing → app` is a single continuous funnel.

| Surface | Path | PostHog integration | Capture mode |
|---|---|---|---|
| Marketing landing | `/` | Inline snippet in `index.html` `<head>` + thin `track()` wrapper in `moon.js` | **Autocapture on** (`defaults: "2026-05-30"`) — pageviews + DOM clicks captured automatically, plus 2 explicit events |
| React app (product) | `/app/` | `posthog-js` npm SDK, wrapped by `src/lib/analytics.ts` | **Manual only** — `capture_pageview: false`, `person_profiles: 'identified_only'`; every event is an explicit `track()` |

The two surfaces **share no code** (the landing is hand-rolled static HTML/JS; the app is React/Vite). They share only the project token. This asymmetry is deliberate — the landing wants cheap autocapture; the app wants a curated, auditable event vocabulary.

### Data flow

```
Landing (index.html + moon.js)                 App (/app/, React)
  posthog.init(token, us.i.posthog.com)          src/main.tsx
  autocapture ─┐                                   └─ initAnalytics() ── src/lib/analytics.ts
  open_app_click ─┤                                                        └─ initPostHog() ── src/lib/posthog.ts
  email_subscribed ┘                                 track()/identify() ───┘   posthog-js
        │                                                     │
        └──────────────► PostHog project 502965 ◄────────────┘
                         (us.i.posthog.com)
```

---

## 2. The wrapper layer (app) — provider-agnostic by design

The app **never imports a vendor SDK directly.** Everything goes through two files:

| File | LOC | Role |
|---|---|---|
| `src/lib/analytics.ts` | ~83 | Public API: `initAnalytics()`, `track(event, props?)`, `identify(props)`. Holds the `AnalyticsEvent` union — the single source of truth for the event vocabulary. |
| `src/lib/posthog.ts` | ~13 | The only file that imports `posthog-js`. Thin init + re-export. Swapping vendors is a one-file change here plus the wrapper. |

### Design constraints (enforced, load-bearing)

1. **Provider-agnostic** — the rest of `src/` imports only from `analytics.ts`. `grep -r "posthog-js" src` must return exactly one file (`posthog.ts`).
2. **Never throws** — both `track()` and `identify()` wrap the SDK call in `try/catch` and swallow. Instrumentation can be dropped into any hot path without a guard; an analytics failure can never break a user flow.
3. **No-op off the browser** — `initAnalytics()` early-returns when `typeof window === 'undefined'` and guards double-init with an `injected` flag.
4. **Typed vocabulary** — `track()` only accepts a member of the `AnalyticsEvent` union. A new event *must* be added to the union first (compile-time gate), which keeps the funnel auditable in one place.
5. **PostHog-safe props** — `AnalyticsProps = Record<string, string | number | boolean | null>`. No nested objects, no `undefined` (use `null`).

```ts
// The contract every call site sees:
export function track(event: AnalyticsEvent, props?: AnalyticsProps): void
export function identify(properties: AnalyticsProps): void
export function initAnalytics(): void   // idempotent, safe every boot
```

---

## 3. Initialization & identity lifecycle

| Step | Where | What happens |
|---|---|---|
| Boot | `src/main.tsx` | `initAnalytics()` → `track('app_opened', { returning })`, then registers `appinstalled` → `pwa_installed`. `returning` is derived from an on-device `localStorage['soma_seen']` marker (first-ever open = `false`). |
| SDK init | `src/lib/posthog.ts` | `posthog.init(KEY, { api_host, person_profiles: 'identified_only', capture_pageview: false })`. |
| Identify | `src/screens/Onboarding.tsx` (`finish()`) | On onboarding completion, `identify()` attaches non-PII person properties: `goal`, `intent`, `experience`, `default_intensity`, `timezone`. |
| Re-attach | `src/App.tsx` (effect) | A reload starts an anonymous PostHog session; an effect re-runs `identify()` whenever a stored profile is present, so segmentation survives reloads and stays fresh. |

`identify()` uses PostHog's auto-generated `distinct_id` (`posthog.identify(posthog.get_distinct_id(), props)`) — Soma generates **no** IDs of its own. Because the app is `person_profiles: 'identified_only'`, a person profile is created only after this identify call fires (i.e. after onboarding), keeping pre-activation traffic anonymous.

---

## 4. Configuration & secrets

### App (Vite, build-time inlined)

| Var | Value | Notes |
|---|---|---|
| `VITE_PUBLIC_POSTHOG_KEY` | `phc_…` project token | Public by design (client SDK). |
| `VITE_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` | US Cloud. |

**Vite quirk (critical):** the Vite `root` is `app/`, but `.env` lives at the **repo root**. `vite.config.ts` sets `envDir: '..'` so `VITE_PUBLIC_*` vars are found and inlined at build time. Without it the vars are `undefined` and PostHog **silently no-ops** (init throws → swallowed). Env is set in the Vercel dashboard (Production, encrypted) and mirrored in the gitignored repo-root `.env` for local builds.

### Landing (hardcoded)

The `index.html` snippet hardcodes the same `phc_…` token and `us.i.posthog.com` inline (a static page has no build-time env step). Same token → same project → unified funnel.

### PostHog MCP (local tooling, not runtime)

`.mcp.json` wires a `posthog` MCP server via `mcp-remote` → `https://mcp.posthog.com/mcp`. It authenticates with a **personal** API key (`phx_…`, exported as `POSTHOG_PERSONAL_API_KEY` → `Authorization: Bearer`), which is distinct from the client `phc_…` token. Used for querying/building dashboards from the agent, never shipped to the client.

---

## 5. Privacy model

- **No PII ever leaves the device.** Events carry only coarse, non-identifying props (kind of fast, onboarding step, intent, theme, tithi index…). No name, email, notes, or free text is sent. The subjective log values (energy/focus/mood/sleep, notes) stay in `localStorage` and are **never** tracked.
- **`identified_only`** person profiles → anonymous until onboarding completes.
- **Landing autocapture** captures DOM interactions and pageviews, but the landing collects no form content beyond the explicit `email_subscribed` event (which carries a `source` tag, not the address — the address goes only to the subscribe endpoint, §7).
- **Audit rule:** any new `track()` prop must be reviewed for PII. Booleans, enums, indices, and coarse counts only. If you're tempted to send a string the user typed, stop.

---

## 6. Event taxonomy (canonical reference)

The strategic *why* (AARRR mapping, funnel priorities) lives in `docs/roadmap/2026-07-08-aarrr-first-experience.md`. This table is the technical *what* — the wire contract. **27 app events** (the `AnalyticsEvent` union) + **2 landing-only** events.

### App events — `AnalyticsEvent` union (`src/lib/analytics.ts`)

| Event | Props | Fired from | AARRR |
|---|---|---|---|
| `app_opened` | `returning: boolean` | `main.tsx` | Acquisition |
| `pwa_installed` | — | `main.tsx` (`appinstalled`) | Acquisition |
| `value_seen` | `tithi_index` | `Onboarding.tsx` (MoonFirstStep mount) | Activation |
| `onboarding_step` | `step`, `index` | `Onboarding.tsx` | Activation |
| `intent_selected` | `intent`, `theme`, `voice` | `onboarding/IntentRouter.tsx` | Activation |
| `safety_gate` | `result: 'passed'\|'blocked'`, `reason?` | `Onboarding.tsx` | Activation |
| `onboarding_complete` | `intent`, `goal` | `Onboarding.tsx` | Activation |
| `first_fast_intensity_chosen` | `intensity` | `App.tsx` | Activation |
| `fast_started` | `kind`, `intensity`, `first`, `logged` | `App.tsx` | Activation |
| `tithi_sheet_viewed` | `tithi_index` | `Today.tsx` | Activation |
| `meditation_started` | `intensity` | `App.tsx` | Activation |
| `fast_completed` | `status`, `intensity`, `via?` | `App.tsx` (post-log), `FastTimer.tsx` (`via: 'timer_late'`) | Retention |
| `fast_aborted` | `intensity`, `progress_pct` | `FastTimer.tsx` | Retention |
| `mandala_milestone` | `milestone: 'first_mark'` | `FastComplete.tsx` | Retention |
| `tab_switched` | `from`, `to` | `App.tsx` | Retention |
| `wisdom_segment_changed` | `segment` (`today\|reads\|you`) | `Wisdom.tsx` | Retention |
| `read_filter_changed` | `filter` | `Wisdom.tsx` | Retention |
| `reminder_scheduled` | `channel`, `source?` | `FastComplete.tsx`, `ReminderSettings.tsx` | Retention |
| `notification_philosophy_changed` | `philosophy` | `ReminderSettings.tsx` | Retention |
| `calendar_exported` | `source`, `event_count?` | `Today.tsx`, `FastComplete.tsx`, `ReminderSettings.tsx` | Retention |
| `settings_intensity_changed` | `intensity` | `Settings.tsx` | Retention |
| `settings_location_set` | `country_code`, `tz` | `Settings.tsx` | Retention |
| `settings_voice_changed` | `voice` | `Settings.tsx` | Retention |
| `settings_theme_changed` | `theme` | `Settings.tsx` | Retention |
| `archetype_completed` | `archetype` | `Settings.tsx` | Retention |
| `wisdom_card_shared` | `result` (`shared\|downloaded`), `tithi` | `components/WisdomCard.tsx` | Referral |
| `data_exported` | `session_count` | `Settings.tsx` | Revenue (power-user proxy) |

### Landing-only events (not in the union — separate PostHog instance)

| Event | Props | Fired from | AARRR |
|---|---|---|---|
| `open_app_click` | `location` (`nav\|hero\|follow\|other`) | `moon.js` (delegated to `a[href^="/app"]`) | Acquisition |
| `email_subscribed` | `source: 'landing'` | `moon.js` (on subscribe 200) | Revenue / Acquisition |

### Encoded-in-props, not separate events (by design)

To avoid redundant event names, these questions are answered by a prop on an existing event:

- **Pre-log skipped vs submitted** → `fast_started.logged` (`false` = skipped).
- **Rest-day scheduling intent** → `calendar_exported.source: 'rest_day_first_visit'`.
- **Onboarding start** → `onboarding_step` at `index: 0`.
- **Deltas viewed** → `wisdom_segment_changed.segment: 'you'`.
- **Late completion** → `fast_completed.via: 'timer_late'` + `status: 'late-completed'`.

---

## 7. The subscribe endpoint (`api/subscribe.js`)

The **one** server-side surface in an otherwise backendless app: a Vercel serverless function that captures the "notify me when Soma leaves beta" email.

- **Trigger:** the landing newsletter form (`#subscribe` in `index.html`) `POST`s `{ email, source }` to `/api/subscribe`; `moon.js` fires `email_subscribed` **only on a 200**.
- **Provider-agnostic:** tries Resend (`RESEND_API_KEY`, auto-resolves the first audience unless `RESEND_AUDIENCE_ID` is set) → generic webhook (`SUBSCRIBE_WEBHOOK_URL`) → `501` if neither is configured.
- **Privacy-minimal:** stores only email + coarse `source` tag. Honeypot (`company` field) + email regex at the boundary. No tracking cookie, no third-party identifier.
- **The app does not call this** — email capture is landing-only. This list is the future launch/monetization audience (Revenue).

---

## 8. Adding or changing an event

1. **Add the name** to the `AnalyticsEvent` union in `src/lib/analytics.ts` (compile gate — nothing can `track()` an unlisted event).
2. **Fire it** from the call site: `track('my_event', { coarse_prop })`. Import `track` from `../lib/analytics` — never `posthog-js`.
3. **Props discipline:** enums / booleans / indices / counts only (§5). No user text. Values must be `string | number | boolean | null`.
4. **Prefer a prop over a new event** when you're distinguishing a variant of something already tracked (see §6 "encoded-in-props").
5. **De-dupe UI noise:** guard "changed to the same value" cases (`if (next === current) return;`) so events stay meaningful — see `tab_switched`, `wisdom_segment_changed`.
6. **Document it:** add a row to §6 here and, if it changes the funnel story, to the roadmap doc.
7. **Landing events** are separate — edit the `moon.js` `track()` wrapper; they do not go in the union.

---

## 9. Testing

- `src/lib/__tests__/analytics.test.ts` covers the wrapper contract: no-op guards, error-swallowing, init idempotency.
- The wrapper's swallow-everything design means call sites need no analytics mocks; PostHog is simply absent (and no-op) under jsdom.
- There is **no** assertion that every UI action fires its event (no E2E) — event coverage is verified by reading call sites, not tests. This is the main measurement blind spot.

---

## 10. Known gaps & watchlist

1. **No event-fires-on-interaction tests** — instrumentation drift (a refactor drops a `track()`) would pass CI silently. E2E would catch it; none exists.
2. **Landing autocapture vs app manual** asymmetry means landing produces high-volume, low-intent events (every click) while the app is curated — filter by surface when building funnels.
3. **`identified_only`** means anonymous pre-onboarding users have no person profile; cross-session stitching before activation relies on the PostHog device/cookie only.
4. **Silent no-op on missing env** (§4) — if a deploy loses `VITE_PUBLIC_POSTHOG_*`, the app tracks nothing and never errors. Verify events flow after any env change.
5. **Two dashboards to stand up** (per roadmap): activation funnel (`app_opened → value_seen → onboarding_complete → fast_started`) and safety-loss (`safety_gate.result = blocked`).

---

## 11. Maintenance

Update this doc whenever the event vocabulary, PostHog config, or privacy posture changes. Keep §6 in exact sync with the `AnalyticsEvent` union — it is the human-readable mirror of that type. When you touch it, also check `docs/ARCHITECTURE.md` §1/§11/§13 (which reference analytics) and the roadmap doc's event map.
