import { MoonPhase } from './MoonPhase';

interface PhaseRhythmStripProps {
  /** Tithi index within the lunar month (1..30). */
  index: number;
  /** 0..1 illuminated fraction — drives the marker's moon render. */
  illumination: number;
  /** Whether the moon is waxing. */
  waxing: boolean;
  /** Optional tap handler — Calendar uses this to scroll to today. */
  onTap?: () => void;
  /** Override the strip width in pixels. Defaults to fluid 100%. */
  width?: number;
}

const VIEW_W = 320;
const VIEW_H = 24;
const STRIP_Y = 8;
const STRIP_H = 8;
const MARKER_SIZE = 18;

/**
 * 30-tithi horizontal phase strip (S4 §T19).
 *
 * An SVG band whose color sweeps from new moon (left) through full moon
 * (centre) and back to new moon (right). The current tithi is marked by a
 * miniature MoonPhase — the real lunar photograph with today's terminator —
 * overlaid at a percentage offset so it stays aligned however the band
 * stretches.
 *
 * A11y: exposes a `slider` role with `aria-valuenow` so screen readers can
 * speak the current position out of 30.
 */
export function PhaseRhythmStrip({
  index,
  illumination,
  waxing,
  onTap,
  width,
}: PhaseRhythmStripProps) {
  const clamped = Math.min(Math.max(Math.round(index), 1), 30);
  // Map 1..30 across the strip — 1 sits at the left edge, 30 at the right.
  const leftPct = ((clamped - 1) / 29) * 100;

  const Body = (
    <div className="relative" style={{ width: width ?? '100%' }}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="slider"
        aria-label="Lunar phase position"
        aria-valuemin={1}
        aria-valuemax={30}
        aria-valuenow={clamped}
        width="100%"
        height={VIEW_H}
        preserveAspectRatio="none"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id="phaseGrad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="var(--surface-elev, #11182e)" />
            <stop offset="25%" stopColor="var(--moon, #e8e4d2)" />
            <stop offset="50%" stopColor="var(--glow, #f4efd9)" />
            <stop offset="75%" stopColor="var(--moon, #e8e4d2)" />
            <stop offset="100%" stopColor="var(--surface-elev, #11182e)" />
          </linearGradient>
        </defs>
        <rect
          x="0"
          y={STRIP_Y}
          width={VIEW_W}
          height={STRIP_H}
          rx={STRIP_H / 2}
          fill="url(#phaseGrad)"
        />
        {/* Landmark glyphs: the axis self-explains as dark → bright → dark
            (new moon, full moon, new moon) without a legend. */}
        <circle
          cx={5}
          cy={STRIP_Y + STRIP_H / 2}
          r={2.5}
          fill="var(--surface-elev, #11182e)"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth={1}
        />
        <circle
          cx={VIEW_W / 2}
          cy={STRIP_Y + STRIP_H / 2}
          r={2.5}
          fill="var(--surface-elev, #11182e)"
          stroke="none"
          opacity={0.35}
        />
        <circle
          cx={VIEW_W - 5}
          cy={STRIP_Y + STRIP_H / 2}
          r={2.5}
          fill="var(--surface-elev, #11182e)"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth={1}
        />
      </svg>
      <div
        aria-hidden="true"
        data-testid="phase-strip-marker"
        className="absolute rounded-full pointer-events-none"
        style={{
          left: `${leftPct}%`,
          top: STRIP_Y + STRIP_H / 2,
          transform: 'translate(-50%, -50%)',
          // Accent ring (echoes the old dot) + soft shadow so a dark new
          // moon stays visible against the band's dark ends.
          boxShadow:
            '0 0 0 1.5px var(--accent, #7dd3fc), 0 1px 6px rgba(0, 0, 0, 0.5)',
        }}
      >
        <MoonPhase
          illumination={illumination}
          waxing={waxing}
          size={MARKER_SIZE}
          glow={false}
          tithiIndex={clamped}
        />
      </div>
    </div>
  );

  if (!onTap) return Body;

  return (
    <button
      type="button"
      onClick={onTap}
      className="block w-full bg-transparent border-0 p-0 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-soma-accent rounded-md"
      aria-label="Jump to today on the calendar"
    >
      {Body}
    </button>
  );
}
