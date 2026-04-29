Category: engineering

# Soma — Sprint 4 Implementation-Ready Breakdown

**Owner:** Tribesh
**Created:** 2026-04-28
**Parent spec:** `2026-04-28-soma-marketability-sprints.md`
**Predecessor:** `2026-04-28-soma-s3-implementation.md`
**Goal:** Shareability + visual polish + archetype personalization + accessibility — task-by-task, code-ready, in PR-sized chunks.

---

## 0. Summary

S4 ships four user-visible additions on top of the S1–S3 foundation:

1. **WisdomCard** — 1080×1080 PNG share artifact, theme-resolved palette, Web Share API with download fallback, deterministic filename, Cormorant Garamond webfont preload for devotional theme.
2. **Phase visuals** — `PhaseRhythmStrip` (pure SVG <2KB, 30-tithi cycle as horizontal gradient), and `PhaseGlyph` (24px positional indicator riding the FastTimer progress ring).
3. **Energy Archetype quiz** — 3 questions, weighted scoring (3-2-1), tie-break order Wind > Fire > Earth, optional onboarding micro-step, drives copy nudges in `whyThisDay`.
4. **Polish** — Onboarding visual carousel (3 slides, swipe + keyboard), `useReducedMotion()` hook, `ErrorBoundary` around Shell, two-step `ResetSomaDialog` with typed `RESET` gate + focus trap.

Cumulative S1–S3 invariants preserved: localStorage schema (preferences with `voice` / `theme` / `archetype` slots), single-key, immutable updates, ≥80% coverage.

## 1. Requirements Restatement

| Req | Source | Acceptance |
|---|---|---|
| Shareable lunar card | Master 4.1 | `<WisdomCard />` produces a 1080×1080 PNG; share via Web Share API on mobile, download fallback elsewhere; filename `soma-{date}-{tithi-slug}.png`; theme palette honored. |
| Phase strip | Master 4.2 | `PhaseRhythmStrip` renders 30-tithi position as horizontal gradient; SVG only; <2 KB gzipped; tap scrolls calendar. |
| Phase glyph on timer | Master 4.3 | 24px lunar glyph at progress-ring head; angle = `-90 + progress * 360`; phase silhouette matches today's illumination. |
| Archetype quiz | Master 4.4 | 3 questions, weights 3/2/1, ties broken Wind > Fire > Earth; persists to `state.preferences.archetype`; available in Settings. |
| Onboarding carousel | Master 4.5 | Replaces `WelcomeStep`; 3 slides; swipe + keyboard nav; auto-advance respects `prefers-reduced-motion`. |
| A11y + reduced motion | Master 4.6 | All animated containers honor `motion-reduce`; ErrorBoundary around Shell; two-step Reset Soma; Lighthouse a11y ≥95 on Today + Rhythm. |

---

## 2. Ordered Task List

27 tasks. Each leaves build green. Estimated effort ≈ 16 hours.

| # | Task | Files | Effort | Deps |
|---|---|---|---|---|
| T01 | Add `Archetype` + `ArchetypeQuestion` enums + extend `Preferences` | `src/lib/types.ts` | 20 min | — |
| T02 | Storage migration v3 → v3.1 (additive: `archetype`, `wisdomCardCount`) | `src/lib/storage.ts`, `src/lib/__tests__/migration.test.ts` | 30 min | T01 |
| T03 | Author archetype quiz catalog (3 Q × 3 options × weights) | `src/lib/archetype.ts` (new) | 45 min | T01 |
| T04 | `scoreArchetype()` + tie-break logic + unit tests | `src/lib/archetype.ts`, `src/lib/__tests__/archetype.test.ts` | 45 min | T03 |
| T05 | `EnergyArchetype` screen (3 question slides + result card) | `src/screens/EnergyArchetype.tsx` (new) | 75 min | T04 |
| T06 | Settings entry to retake quiz + display current archetype | `src/screens/Settings.tsx` | 30 min | T05 |
| T07 | Onboarding integration: optional archetype step (skip-able) | `src/screens/Onboarding.tsx` | 45 min | T05 |
| T08 | `whyThisDay` archetype copy nudges (12 variants, 1 per kind × archetype) | `src/lib/whyThisDay.ts`, `src/i18n/copy.ts` | 60 min | T03 |
| T09 | `ResolvedPalette` + `resolvePaletteFromCssVars()` runtime token reader | `src/themes/resolvePalette.ts` (new), test | 45 min | — |
| T10 | Cormorant Garamond webfont preload + `<link rel="preload">` injection | `index.html`, `src/themes/fonts.ts` (new) | 30 min | T09 |
| T11 | `WisdomCardConfig` + `renderWisdomCardCanvas()` pure renderer | `src/lib/wisdomCard.ts` (new) + test | 90 min | T09, T10 |
| T12 | `useShareImage` hook (Web Share API + download fallback chain) | `src/lib/useShareImage.ts` (new) + test | 60 min | T11 |
| T13 | `<WisdomCard />` component (preview + Share/Download buttons) | `src/components/WisdomCard.tsx` (new) | 60 min | T11, T12 |
| T14 | Mount `WisdomCard` in `Wisdom` screen | `src/screens/Wisdom.tsx` | 30 min | T13 |
| T15 | `OnboardingCarouselSlide` type + slide content | `src/screens/onboarding/carouselSlides.ts` (new) | 30 min | — |
| T16 | `<OnboardingCarousel />` component (swipe + keyboard nav) | `src/screens/onboarding/OnboardingCarousel.tsx` (new) + test | 75 min | T15 |
| T17 | Replace `WelcomeStep` with carousel | `src/screens/Onboarding.tsx` | 20 min | T16 |
| T18 | `useReducedMotion()` hook (matchMedia + listener cleanup) | `src/lib/useReducedMotion.ts` (new) + test | 30 min | — |
| T19 | `<PhaseRhythmStrip />` SVG (30-tithi gradient + position marker) | `src/components/PhaseRhythmStrip.tsx` (new) + test | 60 min | T18 |
| T20 | Mount strip on Calendar above month grid; tap scrolls month | `src/components/Calendar.tsx` | 30 min | T19 |
| T21 | `<PhaseGlyph />` SVG component (24px, takes illum/waxing/angle) | `src/components/PhaseGlyph.tsx` (new) + test | 45 min | — |
| T22 | Wire `PhaseGlyph` to FastTimer progress ring head | `src/screens/FastTimer.tsx` | 45 min | T21 |
| T23 | `<ErrorBoundary />` wraps Shell with quiet recovery + reset escape | `src/components/ErrorBoundary.tsx` (new), `src/App.tsx` | 45 min | — |
| T24 | `<ResetSomaDialog />` two-step typed-`RESET` gate + focus trap | `src/components/ResetSomaDialog.tsx` (new), `src/screens/Settings.tsx` | 75 min | T18 |
| T25 | A11y pass: `motion-reduce:` classes on all animated containers | All screens | 45 min | T18 |
| T26 | `vitest-axe` smoke tests on Today, Rhythm, Wisdom, Settings | `src/__tests__/a11y.test.tsx` (new) | 60 min | T14, T20 |
| T27 | Sprint 4 regression: archetype path × theme × share flow | `src/__tests__/regression.test.tsx` | 60 min | T01–T26 |

---

## 3. Type Definitions

### 3.1 Archetype + Quiz

```ts
// src/lib/archetype.ts
export type Archetype = 'wind' | 'fire' | 'earth';

export const ARCHETYPE_TIEBREAK: readonly Archetype[] = ['wind', 'fire', 'earth'] as const;

export interface ArchetypeOption {
  id: string;
  label: string;
  weights: Record<Archetype, number>;
}

export interface ArchetypeQuestion {
  id: 'stress' | 'body' | 'thrive';
  prompt: string;
  options: readonly ArchetypeOption[];
}

export interface ArchetypeResult {
  archetype: Archetype;
  scores: Record<Archetype, number>;
  tied: boolean;
  answers: Record<ArchetypeQuestion['id'], string>;
}

export function scoreArchetype(
  answers: Record<ArchetypeQuestion['id'], string>,
): ArchetypeResult;

export const ARCHETYPE_QUESTIONS: readonly ArchetypeQuestion[];
```

### 3.2 Preferences extension

```ts
// src/lib/types.ts (additive over S3)
export interface Preferences {
  voice: Voice;
  theme: Theme;
  intent: Intent | null;
  notificationPhilosophy: NotificationPhilosophy;
  archetype: Archetype | null;       // NEW (S4)
  wisdomCardCount: number;            // NEW (S4) — local share counter
}

export function defaultPreferences(): Preferences {
  return {
    voice: 'coach',
    theme: 'performance',
    intent: null,
    notificationPhilosophy: 'quiet',
    archetype: null,
    wisdomCardCount: 0,
  };
}
```

### 3.3 Wisdom card

```ts
// src/lib/wisdomCard.ts
export interface ResolvedPalette {
  surface: string;
  surfaceElev: string;
  ink: string;
  moon: string;
  glow: string;
  mist: string;
  accent: string;
  moonTint: string;
  displayFont: string;
  bodyFont: string;
}

export interface WisdomCardConfig {
  date: Date;
  tithiLabel: string;        // "Shukla Ekadashi" or "Putrada Ekadashi"
  oneWordBenefit: string;
  wisdomLine: string;        // ≤120 chars
  illumination: number;      // 0..1
  waxing: boolean;
  palette: ResolvedPalette;
  voice: Voice;
  theme: Theme;
}

export interface WisdomCardOutput {
  blob: Blob;
  dataUrl: string;
  filename: string;
}

export async function renderWisdomCardCanvas(
  config: WisdomCardConfig,
): Promise<WisdomCardOutput>;
```

### 3.4 Onboarding carousel

```ts
// src/screens/onboarding/carouselSlides.ts
export interface OnboardingCarouselSlide {
  id: 'rhythm' | 'fasts' | 'slow';
  titleKey: CopyKey;
  bodyKey: CopyKey;
  illustration: () => JSX.Element;
}

export const ONBOARDING_SLIDES: readonly OnboardingCarouselSlide[];
```

---

## 4. Archetype Quiz — Full Catalog

```ts
export const ARCHETYPE_QUESTIONS: readonly ArchetypeQuestion[] = [
  {
    id: 'stress',
    prompt: "When you're stressed, you usually...",
    options: [
      { id: 'scattered', label: 'Feel scattered, restless, can\'t settle', weights: { wind: 3, fire: 1, earth: 0 } },
      { id: 'irritable', label: 'Get irritable, sharp, intense',         weights: { wind: 1, fire: 3, earth: 0 } },
      { id: 'heavy',     label: 'Withdraw, feel heavy, shut down',       weights: { wind: 0, fire: 1, earth: 3 } },
    ],
  },
  {
    id: 'body',
    prompt: 'Your default body state is...',
    options: [
      { id: 'cool-dry',         label: 'Cool, dry, light',                    weights: { wind: 3, fire: 0, earth: 1 } },
      { id: 'warm-energized',   label: 'Warm, energized, sometimes overheated', weights: { wind: 1, fire: 3, earth: 0 } },
      { id: 'grounded-slow',    label: 'Grounded, slow, steady',             weights: { wind: 0, fire: 1, earth: 3 } },
    ],
  },
  {
    id: 'thrive',
    prompt: 'You feel your best when...',
    options: [
      { id: 'in-motion',  label: 'In motion — variety, novelty, travel',           weights: { wind: 3, fire: 2, earth: 0 } },
      { id: 'in-flow',    label: 'In flow — focused, challenged, productive',      weights: { wind: 1, fire: 3, earth: 1 } },
      { id: 'in-routine', label: 'In routine — slow mornings, deep rest',          weights: { wind: 0, fire: 1, earth: 3 } },
    ],
  },
];
```

**Scoring (T04):** Sum each archetype's weight across the 3 chosen options. Apply tie-break: iterate `ARCHETYPE_TIEBREAK` and return the first archetype whose score equals `max(scores)`.

**Result examples:**
- All "wind-leaning": `{ wind: 9, fire: 3, earth: 1 }` → `wind`.
- Mixed: `{ wind: 4, fire: 4, earth: 4 }` → `wind` (tie-break).
- Earth dominant: `{ wind: 0, fire: 3, earth: 9 }` → `earth`.

---

## 5. Theme Palette Resolution (T09)

Canvas API cannot read CSS variables natively. `ResolvedPalette` is computed at runtime by reading CSS custom properties from the live `<html>` element.

```ts
// src/themes/resolvePalette.ts
export function resolvePaletteFromCssVars(
  root: HTMLElement = document.documentElement,
): ResolvedPalette {
  const cs = getComputedStyle(root);
  const v = (name: string, fallback: string) =>
    (cs.getPropertyValue(name).trim() || fallback);

  return {
    surface: v('--surface', '#0b1020'),
    surfaceElev: v('--surface-elev', '#11182e'),
    ink: v('--ink', '#0a0d18'),
    moon: v('--moon', '#e8e4d2'),
    glow: v('--glow', '#f4efd9'),
    mist: v('--mist', '#8ea3c4'),
    accent: v('--accent', '#7dd3fc'),
    moonTint: v('--moon-tint', '#bae6fd'),
    displayFont: v('--type-display', '"Inter", system-ui, sans-serif'),
    bodyFont: v('--type-body', '"Inter", system-ui, sans-serif'),
  };
}
```

---

## 6. WisdomCard Canvas Pseudocode (T11)

```ts
const SIZE = 1080;
const PADDING = 96;

export async function renderWisdomCardCanvas(
  cfg: WisdomCardConfig,
): Promise<WisdomCardOutput> {
  // 1. Ensure display font is loaded
  if (typeof document !== 'undefined' && document.fonts) {
    await Promise.race([
      document.fonts.load(`56px ${cfg.palette.displayFont}`),
      new Promise((r) => setTimeout(r, 300)),
    ]);
  }

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // 2. Background — radial glow toward center
  const grad = ctx.createRadialGradient(
    SIZE / 2, SIZE / 2 - 80, 80,
    SIZE / 2, SIZE / 2, SIZE * 0.7,
  );
  grad.addColorStop(0, cfg.palette.surfaceElev);
  grad.addColorStop(1, cfg.palette.surface);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // 3. Moon glyph
  drawMoon(ctx, {
    cx: SIZE / 2, cy: SIZE / 2 - 80, radius: 220,
    illumination: cfg.illumination, waxing: cfg.waxing,
    moon: cfg.palette.moon, tint: cfg.palette.moonTint, shadow: cfg.palette.surface,
  });

  // 4. Tithi label
  ctx.fillStyle = cfg.palette.glow;
  ctx.font = `600 64px ${cfg.palette.displayFont}`;
  ctx.textAlign = 'center';
  ctx.fillText(cfg.tithiLabel, SIZE / 2, SIZE - 360);

  // 5. One-word benefit (uppercase, accent)
  ctx.fillStyle = cfg.palette.accent;
  ctx.font = `500 28px ${cfg.palette.bodyFont}`;
  ctx.fillText(cfg.oneWordBenefit.toUpperCase(), SIZE / 2, SIZE - 300);

  // 6. Wisdom line wrapped
  ctx.fillStyle = cfg.palette.mist;
  ctx.font = `400 36px ${cfg.palette.bodyFont}`;
  drawWrappedText(ctx, cfg.wisdomLine, SIZE / 2, SIZE - 220, SIZE - PADDING * 2, 48);

  // 7. Soma wordmark + date
  ctx.fillStyle = cfg.palette.mist;
  ctx.font = `500 20px ${cfg.palette.bodyFont}`;
  ctx.textAlign = 'left';
  ctx.fillText('SOMA', PADDING, SIZE - PADDING);
  ctx.textAlign = 'right';
  ctx.fillText(formatDate(cfg.date), SIZE - PADDING, SIZE - PADDING);

  // 8. Encode
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  );
  const dataUrl = canvas.toDataURL('image/png');
  const filename = `soma-${toISODate(cfg.date)}-${slugify(cfg.tithiLabel)}.png`;

  return { blob, dataUrl, filename };
}
```

**Typography ladder:** display 64 / accent 28 (uppercase, 0.2em tracking) / body 36 / chrome 20.

---

## 7. Web Share Fallback Chain (T12)

```ts
export interface UseShareImageResult {
  share: (output: WisdomCardOutput) => Promise<'shared' | 'downloaded' | 'cancelled'>;
  status: 'idle' | 'sharing' | 'error';
  error: string | null;
}
```

**Decision tree:**
```
share(output)
├─ navigator.canShare?.({ files: [pngFile] }) === true
│    └─ navigator.share({ files: [pngFile], title, text })
│         ├─ resolves → 'shared'
│         ├─ AbortError → 'cancelled'
│         └─ other reject → fallback to download
├─ canShare not supported but navigator.share exists
│    └─ try navigator.share({ title, text, url: dataUrl })
└─ neither
     └─ create <a download={filename} href={dataUrl}>, programmatic click → 'downloaded'
```

**iOS Safari quirk:** `navigator.canShare` exists but `canShare({ files })` returns `false` for PNGs <16.4. Always wrap in try/catch.

---

## 8. PhaseRhythmStrip Layout (T19)

Pure SVG, 320×24 base viewBox, scales to container width. <2 KB inline.

```
defs:
 linearGradient id="phaseGrad" x1=0 x2=1
   0%   --moon  (Pratipada — thin crescent)
  25%   --glow  (Ashtami — first quarter)
  50%   --moon-tint glow (Purnima — full)
  75%   --glow  (Krishna Ashtami — last quarter)
 100%   --surface (Amavasya — dark)
body:
 <rect width=320 height=8 y=8 rx=4 fill="url(#phaseGrad)" />
 <circle cx={(idx-1)/30 * 320} cy=12 r=6 stroke="--accent" fill="--surface-elev" />
```

**Position math:** `cx = ((paksha === 'shukla' ? 0 : 15) + indexInPaksha - 1) / 30 * 320`. Reused by `PhaseGlyph` for ring placement.

**A11y:** `role="slider"`, `aria-valuemin=1`, `aria-valuemax=30`, `aria-valuenow={index}`, `aria-label="Lunar phase position"`.

---

## 9. PhaseGlyph on FastTimer (T21–T22)

`PhaseGlyph` is purely vector (24px, no image, no halo) to keep DOM cheap on the timer ring.

```tsx
interface PhaseGlyphProps {
  illumination: number;   // 0..1
  waxing: boolean;
  size?: number;          // default 24
}
```

Renders one `<circle>` (lit moon body, fill `--moon-tint`) plus one `<ellipse>` (terminator shadow, fill `--surface`).

**Ring placement (T22):**
```ts
const angle = -90 + progress * 360;
const rad   = (angle * Math.PI) / 180;
const ringR = 140;
const cx    = centerX + ringR * Math.cos(rad);
const cy    = centerY + ringR * Math.sin(rad);

<g transform={`translate(${cx - 12} ${cy - 12})`}>
  <PhaseGlyph illumination={illum} waxing={waxing} size={24} />
</g>
```

**Edge cases:**
- `progress === 0` → angle `-90`, glyph at top center.
- `progress === 1` → angle `270`, also top center.
- Late-completion overshoot (progress > 1) clamps to 1.

---

## 10. Onboarding Carousel (T15–T17)

Replaces `WelcomeStep` only.

| id | titleKey | bodyKey | illustration |
|---|---|---|---|
| `rhythm` | `onboarding.carousel.rhythm.title` ("Your other rhythm") | `onboarding.carousel.rhythm.body` | Moon arc + body silhouette, 2 paths |
| `fasts` | `onboarding.carousel.fasts.title` ("4 fasts a month, ancient calendar") | `onboarding.carousel.fasts.body` | 4×8 calendar grid with 4 highlighted cells |
| `slow` | `onboarding.carousel.slow.title` ("Slow app. Loud results.") | `onboarding.carousel.slow.body` | Single thin crescent on dark field |

**Interaction:**
- Pointer drag (>30px horizontal velocity) advances/retreats.
- Keyboard `ArrowLeft` / `ArrowRight` change slide; `Enter` advances.
- Auto-advance: 4-second interval, paused on focus, paused when `prefers-reduced-motion` true.
- Page indicator: 3 dots, active dot uses `--accent`.
- Use `pointerdown/move/up` (not deprecated `touchstart`); `setPointerCapture`.

---

## 11. ResetSomaDialog Flow (T24)

Two-step destructive confirmation. Replaces `window.confirm()` from S1.

**Step 1: Soft confirm**
- Modal: "Reset Soma? This will clear your fasts, sessions, and settings."
- Buttons: `Cancel` (default focus), `Continue` (destructive style).

**Step 2: Typed gate**
- Same modal stays mounted.
- Text input: `Type RESET to confirm.`
- `Reset` button disabled until input value === `'RESET'` (case-sensitive, trimmed).
- `Escape` closes; `Tab` cycles `[Input, Cancel, Reset]` (focus trap).
- On submit: clear `localStorage`, call `state.reset()`, close, route to Onboarding.

**Focus management:**
- On open: save `previouslyFocusedElement`.
- On close: restore focus.
- Trap implemented with `keydown` listener on dialog root.

**A11y:** `role="alertdialog"`, `aria-labelledby`, `aria-describedby`, `aria-invalid` on input until match.

---

## 12. ErrorBoundary (T23)

Class component (RTL hooks cannot replace `componentDidCatch`).

```tsx
interface ErrorBoundaryProps { children: ReactNode; onReset?: () => void; }
interface ErrorBoundaryState { error: Error | null; }

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) { /* console.error allowed in dev only */ }
  }

  render() { /* fallback UI with "Reset Soma state" escape route */ }
}
```

**Mounted at:** wrapper around `<Shell />` in `src/App.tsx`. Provider-level errors fall through.

**Fallback UI:** apologetic copy in active voice, single button "Reset Soma" → triggers `<ResetSomaDialog />`.

---

## 13. useReducedMotion Hook (T18)

```ts
export function useReducedMotion(): boolean {
  const [prefers, setPrefers] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefers(e.matches);
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else mq.addListener(handler);  // legacy iOS Safari
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler);
      else mq.removeListener(handler);
    };
  }, []);

  return prefers;
}
```

**iOS Safari 13.x quirk:** `addListener` deprecated and may mis-fire on theme change. Tests cover both event paths.

---

## 14. File Changes Per Task

| Task | New | Modified |
|---|---|---|
| T01 | — | `src/lib/types.ts` |
| T02 | `src/lib/__tests__/migration.test.ts` (extend) | `src/lib/storage.ts` |
| T03 | `src/lib/archetype.ts` | — |
| T04 | `src/lib/__tests__/archetype.test.ts` | `src/lib/archetype.ts` |
| T05 | `src/screens/EnergyArchetype.tsx` | — |
| T06 | — | `src/screens/Settings.tsx` |
| T07 | — | `src/screens/Onboarding.tsx` |
| T08 | — | `src/lib/whyThisDay.ts`, `src/i18n/copy.ts` |
| T09 | `src/themes/resolvePalette.ts`, test | — |
| T10 | `src/themes/fonts.ts` | `index.html` |
| T11 | `src/lib/wisdomCard.ts`, test | — |
| T12 | `src/lib/useShareImage.ts`, test | — |
| T13 | `src/components/WisdomCard.tsx` | — |
| T14 | — | `src/screens/Wisdom.tsx` |
| T15 | `src/screens/onboarding/carouselSlides.ts` | `src/i18n/copy.ts` |
| T16 | `src/screens/onboarding/OnboardingCarousel.tsx`, test | — |
| T17 | — | `src/screens/Onboarding.tsx` |
| T18 | `src/lib/useReducedMotion.ts`, test | — |
| T19 | `src/components/PhaseRhythmStrip.tsx`, test | — |
| T20 | — | `src/components/Calendar.tsx` |
| T21 | `src/components/PhaseGlyph.tsx`, test | — |
| T22 | — | `src/screens/FastTimer.tsx` |
| T23 | `src/components/ErrorBoundary.tsx` | `src/App.tsx` |
| T24 | `src/components/ResetSomaDialog.tsx` | `src/screens/Settings.tsx` |
| T25 | — | `src/screens/Today.tsx`, `src/screens/FastTimer.tsx`, `src/screens/Onboarding.tsx`, `src/components/MoonPhase.tsx`, `src/components/AmbientBackground.tsx` |
| T26 | `src/__tests__/a11y.test.tsx` | `package.json` (add `vitest-axe`) |
| T27 | — | `src/__tests__/regression.test.tsx` |

---

## 15. Codebase-Specific Risks (15)

| # | Risk | Where | Mitigation |
|---|---|---|---|
| R1 | Cormorant Garamond not loaded when canvas renders → fallback serif used in PNG | `wisdomCard.ts` | `document.fonts.load()` race with 300ms timeout; preload via `<link rel="preload" as="font" crossorigin>`; test asserts `document.fonts.check()` true pre-render |
| R2 | `navigator.share` not supported on desktop Firefox / older Chromium | `useShareImage.ts` | Capability detection chain (Section 7); always provide download fallback; never throw on AbortError |
| R3 | iOS Safari <16.4 returns `canShare({files}) === false` even when share-sheet would accept | `useShareImage.ts` | Try `navigator.share({files})` inside try/catch regardless of `canShare`; on `NotAllowedError`/`TypeError` fall through |
| R4 | iOS Safari 13.x `matchMedia.addListener` deprecated — silent failures | `useReducedMotion.ts` | Feature-detect `addEventListener` first, fallback to `addListener`; cover both in unit test |
| R5 | Tailwind purges dynamic theme classes when constructed via template strings | `WisdomCard.tsx`, archetype color hints | Never build Tailwind class names from variables; use `data-theme` + CSS vars; enumerate any required classes in `safelist` |
| R6 | `getComputedStyle` returns empty string on CSS vars during initial paint (Webkit) | `resolvePalette.ts` | Always provide hard-coded fallbacks; defer canvas render until `requestAnimationFrame` after mount |
| R7 | `canvas.toBlob` returns null on Safari when canvas tainted (cross-origin image) | `wisdomCard.ts` | Pure vector moon — no `<image>` element; if S5 introduces moon photo, must `crossorigin="anonymous"` and CORS the asset |
| R8 | Onboarding step indices break if `WelcomeStep` is replaced not removed | `Onboarding.tsx` | Keep `STEPS` tuple; rename `'welcome'` → `'intro'`; carousel renders only when step === 'intro'; preserve total count for `<Progress>` |
| R9 | `<input type="text">` autocomplete on RESET dialog suggests stored values | `ResetSomaDialog.tsx` | `autoComplete="off"`, `spellCheck={false}`, `autoCapitalize="characters"` |
| R10 | Existing `confirm()` in `Settings.tsx:32` is replaced — but `FastTimer.tsx:28` still uses one | grep | T24 also migrates FastTimer's "End fast early" dialog to non-destructive `<ConfirmDialog />` |
| R11 | ErrorBoundary swallows React Suspense throws (not errors) | `ErrorBoundary.tsx` | `getDerivedStateFromError` checks `error instanceof Error`; bubbles `Promise` (Suspense) by re-throwing |
| R12 | Phase strip clipped on iOS Safari 100vw with rounded corners — overflow:hidden + border-radius race | `PhaseRhythmStrip.tsx` | Wrap in container with `overflow-hidden` AND `transform: translateZ(0)` to force compositing |
| R13 | Web Share API rejects with `DataError` if file blob >100MB (iOS limit) | `useShareImage.ts` | 1080×1080 PNG ~200KB; assert `blob.size < 5_000_000` with friendly fallback |
| R14 | Archetype state set during onboarding then user skips remaining steps → orphan archetype with no profile | `Onboarding.tsx`, T07 | Only persist archetype on `finish()` along with profile; staging in component state until completion |
| R15 | `vitest-axe` requires JSDOM + canvas polyfill; canvas also used by WisdomCard tests | `package.json` | Use `vitest-canvas-mock`; for axe smoke, render WisdomCard with mocked canvas; assert structure not visual output |

---

## 16. PR Slicing — 4 PRs (each <30 min review)

| PR | Scope | Tasks | LOC | Review |
|---|---|---|---|---|
| **PR 1** Archetype | types + storage + quiz catalog + scoring + screen + Settings/Onboarding integration + copy nudges | T01–T08 | ~700 | 25 min |
| **PR 2** Wisdom card | palette resolver + font preload + canvas renderer + share hook + WisdomCard component + Wisdom screen mount | T09–T14 | ~750 | 30 min |
| **PR 3** Phase visuals + carousel | useReducedMotion + PhaseRhythmStrip + Calendar mount + PhaseGlyph + FastTimer mount + Onboarding carousel | T15–T22 | ~650 | 30 min |
| **PR 4** Polish + tests | ErrorBoundary + ResetSomaDialog + a11y pass + axe smoke + regression | T23–T27 | ~550 | 25 min |

**Sequencing:** PR 1 independent. PR 2 depends on S1 theme tokens. PR 3 independent of PR 2. PR 4 depends on PR 1/2/3.

---

## 17. Test Additions

### Unit
- `archetype.test.ts` — scoring math (9 cases): all-wind, all-fire, all-earth, 3-way tie, 2-way tie wind/fire, 2-way tie wind/earth, 2-way tie fire/earth, mixed dominant wind, mixed dominant earth.
- `wisdomCard.test.ts` — output shape (blob + dataUrl + filename pattern); filename slug `Putrada Ekadashi` → `putrada-ekadashi`; canvas dimensions == 1080×1080.
- `useShareImage.test.ts` — capability detection across 4 navigator mocks; AbortError → `'cancelled'`.
- `useReducedMotion.test.ts` — initial value + change event; both `addEventListener` and legacy `addListener` paths.
- `resolvePalette.test.ts` — fallback when CSS vars empty; reads valid hex.

### Component (RTL)
- `EnergyArchetype.test.tsx` — answers persist; tie-break visible to user; back/skip work.
- `WisdomCard.test.tsx` — renders for 3 voices × 3 themes (9 snapshots, structural).
- `PhaseRhythmStrip.test.tsx` — marker `cx` matches formula for index 1, 15, 16, 30.
- `PhaseGlyph.test.tsx` — terminator side correct for waxing vs waning.
- `OnboardingCarousel.test.tsx` — keyboard nav left/right; pointer-drag advance; auto-advance disabled when reduced motion.
- `ResetSomaDialog.test.tsx` — typed gate; focus trap (Tab cycles); Escape closes; reset only fires after `RESET`.
- `ErrorBoundary.test.tsx` — fallback UI on thrown error; reset clears state.

### A11y
- `a11y.test.tsx` — `vitest-axe` zero violations on Today, Rhythm, Wisdom, Settings.

### Regression
- `regression.test.tsx` — full archetype path: complete onboarding with `wind`, switch theme to devotional, open Wisdom, render share card, verify filename + theme palette in canvas calls.

---

## 18. Acceptance Criteria

- [ ] All 27 tasks land; build green at every PR boundary.
- [ ] Archetype quiz produces deterministic results for the 9 unit-test cases.
- [ ] WisdomCard PNG opens at 1080×1080 with correct theme palette in Chrome, Safari, Firefox.
- [ ] Web Share works on iOS Safari 16+ and Chrome Android; download fallback works on Firefox desktop.
- [ ] Filename pattern `soma-{yyyy-mm-dd}-{tithi-slug}.png` for 5 spot-check tithis.
- [ ] PhaseRhythmStrip <2 KB after gzip.
- [ ] PhaseGlyph appears at correct ring angle for `progress = 0, 0.25, 0.5, 0.75, 1`.
- [ ] Onboarding carousel: keyboard navigation, swipe, auto-advance honoring reduced-motion.
- [ ] All animated containers carry `motion-reduce:` Tailwind class; verified by grep + manual audit.
- [ ] ErrorBoundary catches a thrown render error and offers reset path.
- [ ] ResetSomaDialog requires literal `RESET`; focus trapped; previously focused element restored on close.
- [ ] `vitest-axe` reports zero violations on Today / Rhythm / Wisdom / Settings.
- [ ] Lighthouse accessibility ≥95 on Today + Rhythm.
- [ ] `npm run typecheck && npm run test && npm run build` green.

---

## 19. Open Questions

1. **Archetype-conditional copy depth** — single tone-nudge per tithi/archetype (12 strings × 3 voices = 36) or layered? Recommend 1 per kind for S4, expand in S5.
2. **Card share text** — default `navigator.share` text? Proposal: `"{tithiLabel} · {oneWordBenefit} — somaapp.com"`; needs marketing approval.
3. **Cormorant Garamond licensing** — Google Fonts CDN or self-host? Self-host preferred for offline PWA.
4. **Reset wipe scope** — does Reset Soma clear `wisdomCardCount`? Recommend yes; archetype optionally preserved if user toggles "keep my preferences".

---

Status: ready for implementation
