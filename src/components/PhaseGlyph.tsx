interface PhaseGlyphProps {
  /** Illuminated fraction, 0..1. */
  illumination: number;
  /** True if waxing (lit side on the right). */
  waxing: boolean;
  /** Render size in CSS pixels. Default 24. */
  size?: number;
}

/**
 * Tiny lunar phase glyph (S4 §T21).
 *
 * Two SVG primitives — a lit disc (`circle`) plus a shrinking `ellipse`
 * representing the terminator shadow. No bitmaps, no halos: the glyph is
 * 24px by default and fits at the head of the FastTimer progress ring.
 */
export function PhaseGlyph({
  illumination,
  waxing,
  size = 24,
}: PhaseGlyphProps) {
  const r = 10; // disc radius in viewBox units
  const cx = 12;
  const cy = 12;
  const illum = Math.min(Math.max(illumination, 0), 1);
  // Ellipse half-width: 0 at full moon, full r at new moon.
  const ellipseRx = Math.abs(1 - 2 * illum) * r;
  // Shadow offset direction:
  // - Waxing < 0.5: lit side on right; shadow ellipse offset right (covers right half).
  //   Wait — for crescent we shade everything except the right sliver. We use a
  //   2-element approach: half-disc shadow + ellipse to carve out the lit part.
  // For simplicity in this 24px glyph we approximate with one ellipse that
  // shrinks toward zero at full moon (and to `r` at new moon), positioned to
  // cover the un-lit side.
  const shadowOnRight = !waxing; // when waning, lit is on the left
  const offsetSign = shadowOnRight ? 1 : -1;
  const offset = illum < 0.5 ? 0 : offsetSign * (r - ellipseRx);

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role="img"
      aria-label={`Moon ${Math.round(illum * 100)}% illuminated, ${
        waxing ? 'waxing' : 'waning'
      }`}
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="var(--moon-tint, #bae6fd)"
      />
      {illum < 0.999 && (
        <ellipse
          cx={cx + offset}
          cy={cy}
          rx={illum < 0.5 ? r : ellipseRx}
          ry={r}
          fill="var(--surface, #0b1020)"
        />
      )}
      {/* Crescent: when illum < 0.5, also draw a half-disc on the unlit side
          to cover the bulk of the moon, leaving a sliver lit. */}
      {illum < 0.5 && (
        <path
          d={
            shadowOnRight
              ? `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} Z`
              : `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} Z`
          }
          fill="var(--surface, #0b1020)"
        />
      )}
    </svg>
  );
}
