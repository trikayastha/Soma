import moonImageUrl from '../assets/moon/full-moon.jpg';

interface MoonPhaseProps {
  illumination: number; // 0..1
  waxing: boolean;
  size?: number;
  glow?: boolean;
}

/**
 * Render a real lunar photograph with an elliptical terminator shadow
 * matching the requested illumination. One asset, continuous phases.
 */
export function MoonPhase({
  illumination,
  waxing,
  size = 200,
  glow = true,
}: MoonPhaseProps) {
  const r = size / 2 - 2;
  const cx = size / 2;
  const cy = size / 2;

  const lit = Math.max(0, Math.min(1, illumination));
  const ellipseRx = r * Math.abs(1 - 2 * lit);
  const shadowOnLeft = waxing ? !(lit > 0.5) : lit > 0.5;
  const clipId = `moonClip-${size}`;
  // The source photo has ~10% black padding inside its square. Overscan
  // the drawn image so the actual lunar disk matches the clip circle.
  const overscan = 1.12;
  const drawnSize = r * 2 * overscan;
  const drawnOffset = (drawnSize - r * 2) / 2;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={glow ? 'drop-shadow-[0_0_24px_rgba(244,239,217,0.35)]' : ''}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
        <radialGradient id="moonHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(244,239,217,0.35)" />
          <stop offset="100%" stopColor="rgba(244,239,217,0)" />
        </radialGradient>
        <radialGradient id="moonShade" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor="rgba(11,13,18,0)" />
          <stop offset="100%" stopColor="rgba(11,13,18,0.35)" />
        </radialGradient>
      </defs>
      {glow && <circle cx={cx} cy={cy} r={r + 6} fill="url(#moonHalo)" />}
      <g clipPath={`url(#${clipId})`}>
        <image
          href={moonImageUrl}
          x={cx - r - drawnOffset}
          y={cy - r - drawnOffset}
          width={drawnSize}
          height={drawnSize}
          preserveAspectRatio="xMidYMid slice"
        />
        {/* Subtle limb darkening */}
        <circle cx={cx} cy={cy} r={r} fill="url(#moonShade)" />
        {/* Terminator shadow */}
        {lit < 0.995 && (
          <ellipse
            cx={shadowOnLeft ? cx - r + ellipseRx : cx + r - ellipseRx}
            cy={cy}
            rx={ellipseRx}
            ry={r}
            fill="#0B0D12"
          />
        )}
        {lit < 0.005 && <circle cx={cx} cy={cy} r={r} fill="#0B0D12" />}
      </g>
    </svg>
  );
}
