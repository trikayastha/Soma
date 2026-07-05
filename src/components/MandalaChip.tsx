import { MANDALA_CONFIG, type Mandala } from '../lib/types';
import { daysElapsedInMandala } from '../lib/mandala';
import { useVoice } from '../i18n/useVoice';

interface MandalaChipProps {
  mandala: Mandala | null;
  today: Date;
  onClick?: () => void;
}

/**
 * Single-line Today-header chip showing current mandala progress. Renders
 * nothing when no anchor exists — never a placeholder. Whole row is the
 * tap target (≥44px) and routes the user to the Rhythm screen.
 */
export function MandalaChip({ mandala, today, onClick }: MandalaChipProps) {
  const { tFormat } = useVoice();
  if (!mandala) return null;

  const days = daysElapsedInMandala(mandala, today);
  const ringSize = 28;
  const stroke = 3;
  const r = ringSize / 2 - stroke;
  const c = 2 * Math.PI * r;
  const frac = Math.min(1, days / MANDALA_CONFIG.cycleDays);
  const offset = c * (1 - frac);

  const text = tFormat('mandala.chip.template', {
    n: mandala.index,
    days,
    observed: mandala.observed.length,
    expected: mandala.expected.length,
  });

  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`flex items-center gap-2 min-h-[44px] text-soma-mist text-xs ${
        onClick ? 'hover:text-soma-glow transition-colors' : ''
      }`}
      aria-label={text}
    >
      <svg
        width={ringSize}
        height={ringSize}
        viewBox={`0 0 ${ringSize} ${ringSize}`}
        aria-hidden="true"
      >
        <circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={r}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={r}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
          className="text-soma-glow"
        />
      </svg>
      <span>{text}</span>
    </Wrapper>
  );
}
