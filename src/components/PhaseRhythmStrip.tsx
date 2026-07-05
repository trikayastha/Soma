interface PhaseRhythmStripProps {
  /** Tithi index within the lunar month (1..30). */
  index: number;
  /** Optional tap handler — Calendar uses this to scroll to today. */
  onTap?: () => void;
  /** Override the SVG width in pixels. Defaults to fluid 100%. */
  width?: number;
}

const VIEW_W = 320;
const VIEW_H = 24;
const STRIP_Y = 8;
const STRIP_H = 8;
const MARKER_R = 6;

/**
 * 30-tithi horizontal phase strip (S4 §T19).
 *
 * A pure-SVG band whose color sweeps from new moon (left) through full moon
 * (centre) and back to new moon (right). A small ringed circle marks the
 * current tithi index. The SVG is intentionally minimal so it inlines under
 * 2KB gzipped (no external assets, ~10 nodes).
 *
 * A11y: exposes a `slider` role with `aria-valuenow` so screen readers can
 * speak the current position out of 30.
 */
export function PhaseRhythmStrip({
  index,
  onTap,
  width,
}: PhaseRhythmStripProps) {
  const clamped = Math.min(Math.max(Math.round(index), 1), 30);
  // Map 1..30 across the strip — 1 sits just inside the left edge,
  // 30 just inside the right edge.
  const cx = ((clamped - 1) / 29) * VIEW_W;

  const Body = (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="slider"
      aria-label="Lunar phase position"
      aria-valuemin={1}
      aria-valuemax={30}
      aria-valuenow={clamped}
      width={width ?? '100%'}
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
      <circle
        cx={cx}
        cy={STRIP_Y + STRIP_H / 2}
        r={MARKER_R}
        fill="var(--surface-elev, #11182e)"
        stroke="var(--accent, #7dd3fc)"
        strokeWidth={1.5}
      />
    </svg>
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
