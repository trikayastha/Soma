import { useMemo } from 'react';
import { addDays, toISODate } from '../lib/lunar';
import { computeTithiAtSunrise, tithiShort } from '../lib/tithi';
import { track } from '../lib/analytics';
import type { FastSession, Location, SomaDay } from '../lib/types';

interface CalendarProps {
  /** Any date within the month to display. */
  month: Date;
  todayIso: string;
  selectedIso: string;
  scheduleByDate: Map<string, SomaDay>;
  sessions: FastSession[];
  onSelect: (iso: string) => void;
  onMonthChange: (next: Date) => void;
  /** Optional location used to anchor each cell's tithi at sunrise. */
  location?: Location | null;
}

interface CellData {
  iso: string;
  dayOfMonth: number;
  inMonth: boolean;
  tithiText: string;
  isShukla: boolean;
  somaDay: SomaDay | null;
  hasSession: boolean;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

/**
 * Month-grid calendar. Each cell shows day-of-month, a compact tithi label,
 * highlights Soma days and dates with logged sessions, and is a tappable tab.
 */
export function Calendar({
  month,
  todayIso,
  selectedIso,
  scheduleByDate,
  sessions,
  onSelect,
  onMonthChange,
  location = null,
}: CalendarProps) {
  const monthLabel = useMemo(
    () =>
      month.toLocaleDateString([], {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }),
    [month],
  );

  const sessionDates = useMemo(() => {
    const set = new Set<string>();
    for (const s of sessions) set.add(s.dayDate);
    return set;
  }, [sessions]);

  const cells = useMemo<CellData[]>(() => {
    const year = month.getUTCFullYear();
    const m = month.getUTCMonth();
    const firstOfMonth = new Date(Date.UTC(year, m, 1));
    const startWeekday = firstOfMonth.getUTCDay(); // 0=Sun
    const gridStart = addDays(firstOfMonth, -startWeekday);
    const total = 42; // 6 rows × 7 cols

    return Array.from({ length: total }, (_, i) => {
      const d = addDays(gridStart, i);
      const iso = toISODate(d);
      const noonUtc = new Date(iso + 'T12:00:00Z');
      const t = computeTithiAtSunrise(noonUtc, location);
      const somaDay = scheduleByDate.get(iso) ?? null;
      return {
        iso,
        dayOfMonth: d.getUTCDate(),
        inMonth: d.getUTCMonth() === m,
        tithiText: tithiShort(t),
        isShukla: t.paksha === 'shukla',
        somaDay,
        hasSession: sessionDates.has(iso),
      };
    });
  }, [month, scheduleByDate, sessionDates, location]);

  // Orient-loop instrumentation. Coarse offset only (days from today), never a
  // raw date; fires for non-today days and dedupes re-taps on the current
  // selection. See docs/user-journeys.md §5 (N1/N2).
  function handleSelect(iso: string) {
    if (iso !== todayIso && iso !== selectedIso) {
      const offsetDays = Math.round(
        (Date.parse(iso) - Date.parse(todayIso)) / 86_400_000,
      );
      track('calendar_day_selected', {
        offset_days: offsetDays,
        is_fast_day: scheduleByDate.get(iso) != null,
      });
    }
    onSelect(iso);
  }

  function step(delta: number) {
    track('calendar_month_changed', { direction: delta < 0 ? 'prev' : 'next' });
    const next = new Date(
      Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + delta, 1),
    );
    onMonthChange(next);
  }

  return (
    <div className="px-6 pt-4 pb-2" aria-label="Calendar">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Previous month"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-soma-mist hover:text-soma-glow rounded-lg transition-colors"
        >
          <Chevron dir="left" />
        </button>
        <h2 className="display-serif text-lg text-soma-glow" aria-live="polite">
          {monthLabel}
        </h2>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Next month"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-soma-mist hover:text-soma-glow rounded-lg transition-colors"
        >
          <Chevron dir="right" />
        </button>
      </div>

      <div
        className="grid grid-cols-7 gap-1 text-[10px] uppercase tracking-wider text-soma-mist mb-1"
        aria-hidden="true"
      >
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="text-center">
            {w}
          </div>
        ))}
      </div>

      <div role="grid" className="grid grid-cols-7 gap-1">
        {cells.map((c) => {
          const isSelected = c.iso === selectedIso;
          const isToday = c.iso === todayIso;
          return (
            <button
              key={c.iso}
              type="button"
              role="gridcell"
              aria-selected={isSelected}
              aria-current={isToday ? 'date' : undefined}
              aria-label={`${c.iso}${c.somaDay ? ' — ' + c.somaDay.title : ''}`}
              onClick={() => handleSelect(c.iso)}
              className={`relative aspect-square rounded-xl border flex flex-col items-center justify-center transition-colors duration-200 min-h-[44px] ${
                isSelected
                  ? 'bg-soma-glow/15 border-soma-glow/60'
                  : c.somaDay
                  ? 'bg-soma-accent/10 border-soma-accent/40 hover:border-soma-accent/70'
                  : 'bg-white/5 border-white/10 hover:border-white/25'
              } ${c.inMonth ? '' : 'opacity-35'}`}
            >
              <span
                className={`display-serif text-base leading-none ${
                  isSelected ? 'text-soma-glow' : 'text-soma-moon'
                }`}
              >
                {c.dayOfMonth}
              </span>
              <span
                className={`text-[8px] mt-0.5 tracking-wider ${
                  c.isShukla ? 'text-soma-glow/70' : 'text-soma-mist/70'
                }`}
              >
                {c.tithiText}
              </span>
              {isToday && (
                <span
                  className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-soma-glow"
                  aria-hidden="true"
                />
              )}
              {c.hasSession && (
                <span
                  className="absolute bottom-1 h-1 w-1 rounded-full bg-soma-accent"
                  aria-hidden="true"
                />
              )}
              <CellDecoration somaDay={c.somaDay} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Per-kind decoration painted on top of each cell. All glyphs use
 * `currentColor` so they pick up the cell's text color (theme-aware) and
 * `aria-hidden` because the cell's `aria-label` already carries the
 * SomaDay title for screen readers.
 *
 * Decoration map (S2 spec §J):
 *  - ekadashi             gold ring around the cell
 *  - full-moon (Purnima)  filled radial glow
 *  - new-moon (Amavasya)  small dark dot center
 *  - pradosh              upward triangle bottom-right
 *  - sankashti-chaturthi  filled square bottom-right
 *  - shivaratri           cross/plus glyph bottom-right
 *  - chaturthi (Vinayaka) hollow circle bottom-right
 */
function CellDecoration({ somaDay }: { somaDay: SomaDay | null }) {
  if (!somaDay) return null;
  const a11y = decorationLabel(somaDay.kind);
  switch (somaDay.kind) {
    case 'ekadashi':
      return (
        <span
          className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-amber-400/70"
          aria-label={a11y}
          role="img"
        />
      );
    case 'full-moon':
      return (
        <span
          className="pointer-events-none absolute inset-0 rounded-xl bg-soma-glow/15 shadow-[inset_0_0_18px_rgba(255,236,189,0.3)]"
          aria-label={a11y}
          role="img"
        />
      );
    case 'new-moon':
      return (
        <span
          className="pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-soma-ink/80 left-1 bottom-1"
          aria-label={a11y}
          role="img"
        />
      );
    case 'pradosh':
      return (
        <span
          className="pointer-events-none absolute right-1 bottom-1 text-[9px] leading-none text-soma-accent"
          aria-label={a11y}
          role="img"
        >
          ▲
        </span>
      );
    case 'sankashti-chaturthi':
      return (
        <span
          className="pointer-events-none absolute right-1 bottom-1 text-[9px] leading-none text-soma-accent"
          aria-label={a11y}
          role="img"
        >
          ◼
        </span>
      );
    case 'shivaratri':
      return (
        <span
          className="pointer-events-none absolute right-1 bottom-1 text-[10px] leading-none text-soma-accent"
          aria-label={a11y}
          role="img"
        >
          ✚
        </span>
      );
    case 'chaturthi':
      return (
        <span
          className="pointer-events-none absolute right-1 bottom-1 h-1.5 w-1.5 rounded-full border border-soma-accent"
          aria-label={a11y}
          role="img"
        />
      );
    default:
      return null;
  }
}

function decorationLabel(kind: SomaDay['kind']): string {
  switch (kind) {
    case 'ekadashi':
      return 'Ekadashi — major fast';
    case 'full-moon':
      return 'Purnima — full moon';
    case 'new-moon':
      return 'Amavasya — new moon';
    case 'pradosh':
      return 'Pradosh — Trayodashi observance';
    case 'sankashti-chaturthi':
      return 'Sankashti Chaturthi';
    case 'shivaratri':
      return 'Shivaratri';
    case 'chaturthi':
      return 'Vinayaka Chaturthi';
    default:
      return '';
  }
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {dir === 'left' ? <path d="M10 3l-5 5 5 5" /> : <path d="M6 3l5 5-5 5" />}
    </svg>
  );
}
