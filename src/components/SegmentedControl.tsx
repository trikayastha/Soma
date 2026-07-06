import { useRef } from 'react';
import { useReducedMotion } from '../lib/useReducedMotion';

export interface Segment<T extends string> {
  id: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  segments: readonly Segment<T>[];
  active: T;
  onChange: (id: T) => void;
  /** Accessible name for the tablist. */
  ariaLabel: string;
}

/**
 * Accessible segmented control (tablist) used to switch views within a single
 * screen — e.g. Wisdom's Today / Reads / You segments.
 *
 * Roving arrow-key navigation (Left/Right/Home/End) per the WAI-ARIA tabs
 * pattern; the active segment gets a highlighted pill whose transition is
 * suppressed under `prefers-reduced-motion`.
 */
export function SegmentedControl<T extends string>({
  segments,
  active,
  onChange,
  ariaLabel,
}: SegmentedControlProps<T>) {
  const reduce = useReducedMotion();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function focusIndex(index: number) {
    const clamped = (index + segments.length) % segments.length;
    const el = refs.current[clamped];
    if (el) {
      el.focus();
      onChange(segments[clamped].id);
    }
  }

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        focusIndex(index + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        focusIndex(index - 1);
        break;
      case 'Home':
        e.preventDefault();
        focusIndex(0);
        break;
      case 'End':
        e.preventDefault();
        focusIndex(segments.length - 1);
        break;
      default:
        break;
    }
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex items-center gap-1 rounded-full bg-soma-night/60 p-1"
    >
      {segments.map((seg, i) => {
        const on = seg.id === active;
        return (
          <button
            key={seg.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(seg.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`flex-1 min-h-[40px] rounded-full px-4 text-xs font-medium tracking-wide ${
              reduce ? '' : 'transition-colors duration-200'
            } ${
              on
                ? 'bg-soma-glow/10 text-soma-glow'
                : 'text-soma-mist hover:text-soma-moon'
            }`}
          >
            {seg.label}
          </button>
        );
      })}
    </div>
  );
}
