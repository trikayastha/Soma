import { useMemo } from 'react';
import { toISODate } from '../lib/lunar';
import type { FastSession } from '../lib/types';

interface WeekGlanceProps {
  sessions: FastSession[];
  today: Date;
}

const DAY_MS = 86_400_000;

/**
 * Last-7-days glance strip for the Rhythm tab — one dot per day (filled
 * when a fast landed on it) plus total hours fasted across the window.
 * A summary, not a streak: a hollow dot is just an unfasted day.
 */
export function WeekGlance({ sessions, today }: WeekGlanceProps) {
  const { days, fastedDates, totalHours } = useMemo(() => {
    const done = sessions.filter(
      (s) => s.status === 'completed' || s.status === 'late-completed',
    );
    const week = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today.getTime() - (6 - i) * DAY_MS);
      return { iso: toISODate(d), letter: weekdayLetter(d) };
    });
    const inWindow = new Set(week.map((d) => d.iso));
    const fasted = new Set(
      done.filter((s) => inWindow.has(s.dayDate)).map((s) => s.dayDate),
    );
    const hours = done
      .filter((s) => inWindow.has(s.dayDate))
      .reduce((sum, s) => sum + sessionHours(s), 0);
    return { days: week, fastedDates: fasted, totalHours: hours };
  }, [sessions, today]);

  const fastedCount = fastedDates.size;

  return (
    <section
      className="soma-card p-4 flex items-center justify-between gap-4"
      aria-label={`Last 7 days: ${fastedCount} ${
        fastedCount === 1 ? 'fast' : 'fasts'
      }, ${Math.round(totalHours)} hours fasted`}
    >
      <div>
        <div className="text-[10px] uppercase tracking-wider text-soma-mist">
          Last 7 days
        </div>
        <ul className="flex gap-2 mt-2" aria-hidden="true">
          {days.map((d, i) => {
            const isToday = i === 6;
            const fasted = fastedDates.has(d.iso);
            return (
              <li key={d.iso} className="flex flex-col items-center gap-1">
                <span
                  className={`block w-2.5 h-2.5 rounded-full ${
                    fasted
                      ? 'bg-soma-glow'
                      : 'border border-white/25'
                  } ${isToday ? 'ring-1 ring-soma-accent ring-offset-1 ring-offset-transparent' : ''}`}
                />
                <span className="text-[9px] text-soma-mist">{d.letter}</span>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="text-right shrink-0">
        <div className="text-soma-glow text-2xl tabular-nums display-serif">
          {formatHours(totalHours)}
        </div>
        <div className="text-soma-mist text-[10px] uppercase tracking-wider">
          hours fasted
        </div>
      </div>
    </section>
  );
}

function weekdayLetter(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: 'narrow',
    timeZone: 'UTC',
  });
}

/** Actual fasted hours when the session has an end time; planned otherwise. */
function sessionHours(s: FastSession): number {
  if (s.endedAt) {
    const ms = new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime();
    if (ms > 0) return ms / 3_600_000;
  }
  return s.intensityHours;
}

function formatHours(h: number): string {
  const rounded = Math.round(h * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
