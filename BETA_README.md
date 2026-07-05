# Soma Beta — Mobile-Responsive Web Demo

A demo build of the Soma P0 MVP. The app is a pure web app but is presented
as a mobile experience: on desktop it renders inside an iPhone-style frame;
on mobile and tablet it goes full-screen. No native app required.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

## Tests

```bash
npm run test       # 40 unit + regression tests (vitest)
npm run typecheck  # tsc --noEmit
npm run build      # production build (Vite)
```

All tests currently pass. The regression suite exercises the full P0 flow
end-to-end (onboarding → safety gate → today → fast start → why-this-day →
bottom nav across Trends/Learn/Settings).

## What's included (P0)

| PRD feature | Implementation |
|---|---|
| F1 Lunar calendar engine | `src/lib/lunar.ts` (via `astronomy-engine`) |
| F2 Today screen | `src/screens/Today.tsx` |
| F3 Fast scheduler | `src/lib/lunar.ts::generateSchedule` |
| F4 Fast timer | `src/screens/FastTimer.tsx` |
| F5 Pre/post logging | `src/screens/LogForm.tsx` |
| F6 Why-this-day | `src/lib/whyThisDay.ts` + Today card |
| F7 Meditation (Web Audio) | `src/screens/Meditation.tsx` |
| F8 Onboarding (5 steps) | `src/screens/Onboarding.tsx` |
| F9 Notifications (opt-in) | `src/screens/Settings.tsx` |
| F10 Safety gates | `src/lib/safety.ts` + onboarding |
| F15 Auth + export + reset | Local profile + JSON export in Settings |
| Reminders (calendar + alarm + live) | `src/lib/ics.ts`, `src/lib/reminders.ts`, `src/components/ReminderSettings.tsx` — download a 60-day `.ics` with VALARM triggers for every Soma day, plus opt-in in-session browser notifications |

## Architecture

- **Stack:** Vite + React 18 + TypeScript + Tailwind CSS
- **State:** React Context (`AppStateContext`) backed by localStorage
- **Lunar math:** `astronomy-engine` for Ekadashi, full moon, new moon
- **Audio:** Web Audio API synthesis (no asset files)
- **Persistence:** single `soma.state.v1` localStorage key
- **No backend, no auth service, no analytics** — intentional for the beta

## Design notes

- On desktop viewports (≥ 1024px) the app is wrapped in a phone frame so a
  demo feels native.
- Mobile / tablet viewports bypass the frame and go edge-to-edge.
- All screens share an `AmbientBackground` with a soft starfield (pure SVG).
- Typography: Cormorant Garamond for display, Inter for UI.
- Palette (`tailwind.config.js`): `soma.ink`, `soma.slate`, `soma.glow`,
  `soma.accent`, `soma.crimson`, `soma.sage`.

## What's deliberately out of scope

- Native iOS / Android code.
- HealthKit / Whoop / Oura live integrations (CSV import is Phase 2+).
- Subscription / payments.
- Real notification delivery (the opt-in flow calls the browser API but
  production push requires a backend).
- Chandrayana graduated mode (gated by safety — PRD §7 Phase 2).

## Extending the beta

Adding a new screen:
1. Create `src/screens/NewScreen.tsx`.
2. Add a tab in `src/components/BottomNav.tsx` if top-level.
3. Wire it into `src/App.tsx`'s `Shell`.
4. Add a regression test in `src/__tests__/regression.test.tsx`.

Adding a new lunar day kind:
1. Extend `SomaDayKind` in `src/lib/types.ts`.
2. Add a target in `TARGETS` in `src/lib/lunar.ts`.
3. Add copy in `src/lib/whyThisDay.ts`.
4. Update `src/lib/__tests__/lunar.test.ts`.
