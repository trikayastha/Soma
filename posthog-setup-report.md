# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Soma fasting app. PostHog (`posthog-js`) was installed alongside the existing Vercel analytics wrapper — both providers now receive every tracked event in parallel. A new `src/lib/posthog.ts` initializes the browser SDK, `src/lib/analytics.ts` was extended with 10 new event types and an `identify()` helper, and `src/components/ErrorBoundary.tsx` was wired to `posthog.captureException()` so render crashes are captured automatically. User profile properties (goal, intent, experience, intensity, timezone) are sent to PostHog via `identify()` on onboarding completion.

| Event name | Description | File |
|---|---|---|
| `fast_aborted` | User confirmed ending a fast early before the scheduled completion time. | `src/screens/FastTimer.tsx` |
| `first_fast_intensity_chosen` | User selected their preferred fasting duration (12h/16h/24h) on their very first fast. | `src/App.tsx` |
| `settings_intensity_changed` | User changed their default fasting intensity from the Settings screen. | `src/screens/Settings.tsx` |
| `settings_location_set` | User set a city location to anchor tithi at local sunrise. | `src/screens/Settings.tsx` |
| `settings_voice_changed` | User switched the app's voice/tone preference in Settings. | `src/screens/Settings.tsx` |
| `settings_theme_changed` | User changed the visual theme in Settings. | `src/screens/Settings.tsx` |
| `archetype_completed` | User completed or updated the energy archetype quiz. | `src/screens/Settings.tsx` |
| `tithi_sheet_viewed` | User opened the tithi detail sheet from the Today screen. | `src/screens/Today.tsx` |
| `meditation_started` | User opened the guided meditation screen during an active fast. | `src/App.tsx` |
| `data_exported` | User exported their fasting data as a JSON file from Settings. | `src/screens/Settings.tsx` |

The following pre-existing events (already tracked via Vercel) are now also sent to PostHog: `app_opened`, `onboarding_step`, `onboarding_complete`, `fast_started`, `fast_completed`, `wisdom_card_shared`, `reminder_scheduled`, `calendar_exported`.

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/502965/dashboard/1816075)
- [Onboarding funnel (wizard)](https://us.posthog.com/project/502965/insights/jsrAgGua) — app open → onboarding step → onboarding complete
- [Activation funnel — first fast (wizard)](https://us.posthog.com/project/502965/insights/fpWHH4CJ) — onboarding complete → fast started
- [Fast completion vs abort (wizard)](https://us.posthog.com/project/502965/insights/NKghWhiH) — completion vs early-exit trend
- [Daily active users (wizard)](https://us.posthog.com/project/502965/insights/y5LRjgXG) — unique users per day
- [Retention engagement events (wizard)](https://us.posthog.com/project/502965/insights/Cfp45COJ) — card shares, calendar exports, reminders

## Verify before merging

- [x] Run a full production build (`npm run build`) and fix any lint or type errors introduced by the generated code. — Passes clean; only a pre-existing >500 kB chunk-size warning remains.
- [x] Run the test suite (`npm test`) — call sites that were rewritten or instrumented may need updated mocks or fixtures. — 380/380 tests pass across 56 files; no fixture changes needed.
- [x] Add `VITE_PUBLIC_POSTHOG_KEY` and `VITE_PUBLIC_POSTHOG_HOST` to `.env.example` (or your bootstrap scripts) so collaborators know what to set. — Added `.env.example` with both vars.
- [ ] **Deferred — no CI yet.** Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production Vite stack traces de-minify in PostHog error tracking. This repo has no `.github/workflows/` pipeline to hook into. When a CI pipeline is introduced, add a `posthog-cli sourcemap inject`/`upload` step to the production build (gated on a `POSTHOG_CLI_TOKEN` secret) and enable Vite sourcemaps.
- [x] Confirm the returning-visitor path also calls `identify()` — currently `identify()` is only called once on `onboarding_complete`. Returning users who reload the app start an anonymous session; if person-level properties matter for segmentation, call `identify()` again on app mount when the profile is already in state. — Added a mount-time `identify()` effect in `src/App.tsx` (`Shell`) that re-attaches profile properties whenever a stored profile is present.

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-javascript_node/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
