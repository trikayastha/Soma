import { useState } from 'react';
import moonImageUrl from '../assets/moon/full-moon.jpg';
import { tithiMoonUrl } from '../lib/moonAssets';

interface MoonPhaseProps {
  illumination: number; // 0..1
  waxing: boolean;
  size?: number;
  glow?: boolean;
  /**
   * When set, layer the bundled NASA SVS render for this tithi (1..30)
   * over the computed approximation — true terminator instead of an
   * ellipse. Local asset; loads instantly from cache after first view.
   */
  tithiIndex?: number;
}

/** Frames that finished loading this session — skip the fade on remount. */
const seenFrames = new Set<string>();

/**
 * Render a real lunar photograph with an elliptical terminator shadow
 * matching the requested illumination. One asset, continuous phases.
 * With `tithiIndex`, the bundled per-tithi NASA frame fades in on top.
 */
export function MoonPhase({
  illumination,
  waxing,
  size = 200,
  glow = true,
  tithiIndex,
}: MoonPhaseProps) {
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const nasaUrl = tithiIndex !== undefined ? tithiMoonUrl(tithiIndex) : null;
  // Frames seen earlier this session render instantly — no re-fade on
  // remount; the cross-fade only plays the first time a frame arrives.
  const nasaVisible =
    nasaUrl !== null && (loadedUrl === nasaUrl || seenFrames.has(nasaUrl));

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

  const fallbackSvg = (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={!nasaUrl && glow ? 'drop-shadow-[0_0_24px_rgba(244,239,217,0.35)]' : ''}
      style={nasaUrl ? { opacity: nasaVisible ? 0 : 1, transition: 'opacity 700ms ease' } : undefined}
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

  if (!nasaUrl) return fallbackSvg;

  return (
    <div
      className={`relative ${glow ? 'drop-shadow-[0_0_24px_rgba(244,239,217,0.35)]' : ''}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {fallbackSvg}
      <img
        src={nasaUrl}
        alt=""
        draggable={false}
        decoding="async"
        onLoad={() => {
          seenFrames.add(nasaUrl);
          setLoadedUrl(nasaUrl);
        }}
        className="absolute inset-0 w-full h-full rounded-full object-cover pointer-events-none"
        style={{ opacity: nasaVisible ? 1 : 0, transition: 'opacity 700ms ease' }}
      />
    </div>
  );
}
