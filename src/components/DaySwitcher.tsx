import { useEffect, useRef } from 'react';
import { addDays, elongationToPhaseName, moonElongation, moonIllumination, toISODate } from '../lib/lunar';
import type { SomaDay } from '../lib/types';

interface DaySwitcherProps {
  selectedIso: string;
  todayIso: string;
  scheduleByDate: Map<string, SomaDay>;
  onSelect: (iso: string) => void;
  /** How many days to show before and after today. */
  range?: number;
}

/**
 * Horizontal scroll strip of ±range days around today.
 * Each pill shows the weekday, day-of-month, a tiny moon dot, and a
 * Soma-day marker if that date has a scheduled fast.
 */
export function DaySwitcher({
  selectedIso,
  todayIso,
  scheduleByDate,
  onSelect,
  range = 7,
}: DaySwitcherProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  const today = new Date(todayIso + 'T00:00:00Z');
  const days: Date[] = [];
  for (let i = -range; i <= range; i++) {
    days.push(addDays(today, i));
  }

  // Scroll the selected pill into view when it changes. Guarded for jsdom.
  useEffect(() => {
    const el = selectedRef.current;
    if (el && typeof el.scrollIntoView === 'function') {
      try {
        el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } catch {
        // ignore — jsdom or older browsers without options support
      }
    }
  }, [selectedIso]);

  return (
    <div
      ref={scrollerRef}
      className="flex gap-2 overflow-x-auto no-scrollbar -mx-6 px-6 py-1 snap-x snap-mandatory"
      role="tablist"
      aria-label="Select day"
    >
      {days.map((d) => {
        const iso = toISODate(d);
        const isSelected = iso === selectedIso;
        const isToday = iso === todayIso;
        const somaDay = scheduleByDate.get(iso);
        const elong = moonElongation(new Date(iso + 'T12:00:00Z'));
        const illum = moonIllumination(new Date(iso + 'T12:00:00Z'));
        const phase = elongationToPhaseName(elong);
        const waxing = elong < 180;

        return (
          <button
            key={iso}
            ref={isSelected ? selectedRef : undefined}
            onClick={() => onSelect(iso)}
            role="tab"
            aria-selected={isSelected}
            aria-current={isToday ? 'date' : undefined}
            className={`shrink-0 snap-center flex flex-col items-center justify-center w-14 min-h-[76px] rounded-2xl border px-2 py-2 transition-colors duration-200 ${
              isSelected
                ? 'bg-soma-glow/15 border-soma-glow/60'
                : 'bg-white/5 border-white/10 hover:border-white/25'
            }`}
          >
            <span
              className={`text-[10px] uppercase tracking-wider ${
                isSelected ? 'text-soma-glow' : 'text-soma-mist'
              }`}
            >
              {isToday ? 'Today' : d.toLocaleDateString([], { weekday: 'short' })}
            </span>
            <span
              className={`display-serif text-xl leading-none mt-1 ${
                isSelected ? 'text-soma-glow' : 'text-soma-moon'
              }`}
            >
              {d.getUTCDate()}
            </span>
            <MiniMoon illum={illum} waxing={waxing} phase={phase} />
            {somaDay && (
              <span className="mt-1 h-1 w-1 rounded-full bg-soma-accent" aria-hidden="true" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function MiniMoon({
  illum,
  waxing,
}: {
  illum: number;
  waxing: boolean;
  phase: string;
}) {
  const size = 16;
  const r = size / 2 - 1;
  const cx = size / 2;
  const cy = size / 2;
  const ellipseRx = r * Math.abs(1 - 2 * illum);
  const shadowOnLeft = waxing ? !(illum > 0.5) : illum > 0.5;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="mt-1"
      aria-hidden="true"
    >
      <circle cx={cx} cy={cy} r={r} fill="#E8E4D2" />
      {illum < 0.99 && (
        <ellipse
          cx={shadowOnLeft ? cx - r + ellipseRx : cx + r - ellipseRx}
          cy={cy}
          rx={ellipseRx}
          ry={r}
          fill="#11141C"
        />
      )}
      {illum < 0.01 && <circle cx={cx} cy={cy} r={r} fill="#11141C" stroke="#E8E4D2" strokeWidth="0.5" />}
    </svg>
  );
}
