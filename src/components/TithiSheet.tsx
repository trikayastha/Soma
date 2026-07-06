import { useEffect, useId, useRef } from 'react';
import { getTithiMeta } from '../lib/tithiMeta';
import type { Energy, RecommendedPractice } from '../lib/tithiMeta';
import { tithiNameGloss } from '../lib/describeTithi';
import { ReceiptChip } from './ReceiptChip';

interface TithiSheetProps {
  /** Absolute tithi index, 1..30. */
  index: number;
  open: boolean;
  onClose: () => void;
}

const ENERGY_LABEL: Record<Energy, string> = {
  rising: 'Rising — the bright half is building',
  peak: 'Peak — around the full moon',
  falling: 'Falling — the light is receding',
  still: 'Still — the dark of the month',
};

const PRACTICE_LABEL: Record<RecommendedPractice, string> = {
  fast: 'Fasting',
  meditate: 'Meditation',
  reflect: 'Reflection',
  celebrate: 'Celebration',
  rest: 'Rest',
};

/**
 * "About this lunar day" bottom sheet — the expanded layer of the tithi
 * ladder. The header line on Today speaks plain English; this sheet holds
 * the Sanskrit name, its gloss, what a tithi actually is, and the
 * traditional metadata with citations. Follows the ConfirmDialog a11y
 * pattern: Esc closes, backdrop closes, focus is trapped and restored.
 */
export function TithiSheet({ index, open, onClose }: TithiSheetProps) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (open) {
      previouslyFocused.current =
        (document.activeElement as HTMLElement) ?? null;
      const id = window.setTimeout(() => closeRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    } else if (previouslyFocused.current) {
      previouslyFocused.current.focus?.();
      previouslyFocused.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const root = sheetRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const meta = getTithiMeta(index);
  const gloss = tithiNameGloss(meta.name);
  const indexInPaksha = index <= 15 ? index : index - 15;
  const half = meta.paksha === 'shukla' ? 'brightening' : 'fading';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={sheetRef}
        className="soma-card w-full max-w-md rounded-b-none p-6 pb-8 max-h-[80%] overflow-y-auto no-scrollbar animate-rise"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-soma-accent">
              About this lunar day
            </div>
            <h2
              id={titleId}
              className="display-serif text-2xl text-soma-glow mt-1"
            >
              {meta.name}{' '}
              <span className="text-soma-mist text-sm">{meta.iast}</span>
            </h2>
            {gloss && (
              <p className="text-soma-moon text-xs mt-1">
                “{gloss}” — night {indexInPaksha} of the {half} half
              </p>
            )}
          </div>
          <button
            type="button"
            ref={closeRef}
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-soma-mist hover:text-soma-moon transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              className="w-5 h-5"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <p className="text-soma-mist text-xs leading-relaxed mt-4">
          A tithi is one step in the moon's 30-step month — the time the moon
          takes to move 12° farther from the sun. It's the day-unit of the
          lunar calendar, the way Monday is a day-unit of the solar one. Soma
          reads the tithi at your local sunrise, the traditional anchor.
        </p>

        <dl className="mt-4 space-y-2 text-xs">
          {meta.fastingName && (
            <div className="flex justify-between gap-4">
              <dt className="text-soma-mist shrink-0">Observance</dt>
              <dd className="text-soma-moon text-right">{meta.fastingName}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-soma-mist shrink-0">Presiding deity</dt>
            <dd className="text-soma-moon text-right">{meta.deity}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-soma-mist shrink-0">Month's energy</dt>
            <dd className="text-soma-moon text-right">
              {ENERGY_LABEL[meta.energy]}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-soma-mist shrink-0">Traditional practice</dt>
            <dd className="text-soma-moon text-right">
              {PRACTICE_LABEL[meta.recommendedPractice]}
            </dd>
          </div>
        </dl>

        {meta.citationIds.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {meta.citationIds.map((id) => (
              <ReceiptChip key={id} citationId={id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
