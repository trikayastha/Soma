import { MANDALA_CONFIG, type Mandala } from '../lib/types';
import { daysElapsedInMandala } from '../lib/mandala';

interface MandalaRingProps {
  mandala: Mandala;
  today: Date;
  size?: number;
}

/**
 * Two-track SVG ring for the Rhythm hero.
 * Outer track: days-elapsed in the 40-day window.
 * Inner track: completion-rate of expected major fasts.
 *
 * Colors come from theme tokens via Tailwind utilities (`text-soma-glow` /
 * `text-soma-mist`). No red anywhere — missed days reduce fill but never
 * tip the palette toward urgency.
 */
export function MandalaRing({ mandala, today, size = 220 }: MandalaRingProps) {
  const stroke = 8;
  const outerR = size / 2 - stroke;
  const innerR = outerR - stroke * 1.5;
  const cOuter = 2 * Math.PI * outerR;
  const cInner = 2 * Math.PI * innerR;

  const days = daysElapsedInMandala(mandala, today);
  const dayFrac = Math.min(1, days / MANDALA_CONFIG.cycleDays);
  const rateFrac = Math.min(1, Math.max(0, mandala.completionRate));

  const outerOffset = cOuter * (1 - dayFrac);
  const innerOffset = cInner * (1 - rateFrac);

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Mandala ${mandala.index}, day ${days} of 40, ${mandala.observed.length} of ${mandala.expected.length} fasts observed`}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
        {/* Outer track — days */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={outerR}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={outerR}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={cOuter}
          strokeDashoffset={outerOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="text-soma-glow"
        />
        {/* Inner track — completion */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={innerR}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={innerR}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={cInner}
          strokeDashoffset={innerOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="text-soma-accent"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="display-serif text-5xl text-soma-glow tabular-nums">
          {mandala.index}
        </div>
        <div className="text-soma-mist text-[10px] uppercase tracking-wider mt-1">
          mandala
        </div>
        <div className="text-soma-mist text-xs mt-2 tabular-nums">
          {mandala.observed.length} / {mandala.expected.length} fasts
        </div>
      </div>
    </div>
  );
}
