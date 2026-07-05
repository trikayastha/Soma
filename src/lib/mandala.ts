import {
  MANDALA_CONFIG,
  type AppState,
  type FastSession,
  type Mandala,
  type MandalaStatus,
  type SomaDay,
  type SomaDayKind,
} from './types';
import { addDays, toISODate } from './lunar';

/**
 * Mandala Engine
 * --------------
 * A mandala is a 40-day cycle. Completion is "≥60% of expected major fasts
 * within the window AND at least {@link MANDALA_CONFIG.minExpected} expected
 * fasts in the window". Windows with fewer than `minExpected` expected fasts
 * carry their expected list forward into the next window — this prevents a
 * thin month from forcing a "partial" stamp on otherwise-strong practice.
 *
 * Hard invariants:
 *   - Missing a major-fast day reduces completionRate but NEVER produces a
 *     "broken" status. There is no such status.
 *   - Aborted sessions are not counted.
 *   - Both 'completed' and 'late-completed' sessions count.
 *   - The current (last) window is always 'in-progress' until it ends.
 */

/** Major-fast kinds — those that count toward a mandala's expected list. */
const MAJOR_FAST_KINDS: ReadonlySet<SomaDayKind> = new Set<SomaDayKind>([
  'ekadashi',
  'full-moon',
  'new-moon',
  'chaturthi',
  'shivaratri',
]);

export function isMajorFast(kind: SomaDayKind): boolean {
  return MAJOR_FAST_KINDS.has(kind);
}

/** Return the dayDate (yyyy-mm-dd) used to seed Mandala 1. */
export function resolveAnchorDate(state: AppState): string | null {
  const a = state.mandalaAnchor;
  if (a.manualResetDate) return a.manualResetDate.slice(0, 10);
  if (a.firstObservedFastDate) return a.firstObservedFastDate.slice(0, 10);
  return null;
}

/** Build the set of yyyy-mm-dd dates that count as observed fasts. */
function buildObservedSet(sessions: FastSession[]): Set<string> {
  const set = new Set<string>();
  for (const s of sessions) {
    if (s.status === 'completed' || s.status === 'late-completed') {
      set.add(s.dayDate);
    }
  }
  return set;
}

/** Build the list of major-fast dates from the schedule, sorted ascending. */
function majorFastDates(schedule: SomaDay[]): string[] {
  return schedule
    .filter((d) => isMajorFast(d.kind))
    .map((d) => d.date)
    .sort();
}

function addDaysIso(iso: string, n: number): string {
  // Use noon UTC anchor so DST shifts cannot drift by ±1 day.
  return toISODate(addDays(new Date(iso + 'T12:00:00Z'), n));
}

/**
 * Compute the full mandala history up to (and including) the window
 * containing `today`. Returns an empty list if no anchor is set.
 */
export function mandalaHistory(state: AppState, today: Date): Mandala[] {
  const anchor = resolveAnchorDate(state);
  if (!anchor) return [];

  const observedSet = buildObservedSet(state.sessions);
  const majors = majorFastDates(state.schedule);

  const todayIso = toISODate(today);
  const out: Mandala[] = [];
  let i = 1;
  let windowStart = anchor;
  let carryExpected: string[] = [];

  // Hard cap to keep the loop bounded for absurd far-future dates / corrupt
  // anchors. 40 day cycles → 200 mandalas covers ~22 years of practice.
  const MAX_ITER = 200;

  while (windowStart <= todayIso && i <= MAX_ITER) {
    const windowEnd = addDaysIso(windowStart, MANDALA_CONFIG.cycleDays);
    const expectedThis = majors.filter(
      (d) => d >= windowStart && d < windowEnd,
    );
    const expected = [...carryExpected, ...expectedThis];
    const observed = expected.filter((d) => observedSet.has(d));
    const rate = expected.length === 0 ? 0 : observed.length / expected.length;

    let status: MandalaStatus;
    const isPast = windowEnd <= todayIso;
    if (!isPast) {
      status = 'in-progress';
      carryExpected = [];
    } else if (expected.length < MANDALA_CONFIG.minExpected) {
      // Thin window — carry expected forward. Never stamp 'partial'.
      status = 'in-progress';
      carryExpected = expected;
    } else {
      status = rate >= MANDALA_CONFIG.threshold ? 'completed' : 'partial';
      carryExpected = [];
    }

    out.push({
      index: i,
      startDate: windowStart,
      endDate: windowEnd,
      observed,
      expected,
      completionRate: rate,
      status,
    });

    windowStart = windowEnd;
    i += 1;
  }

  return out;
}

/** The current (most recent) mandala, or null if no anchor. */
export function currentMandala(state: AppState, today: Date): Mandala | null {
  const all = mandalaHistory(state, today);
  if (all.length === 0) return null;
  return all[all.length - 1];
}

/** Days elapsed in the current mandala window, clamped to [0, cycleDays]. */
export function daysElapsedInMandala(m: Mandala, today: Date): number {
  const start = new Date(m.startDate + 'T12:00:00Z').getTime();
  const t = new Date(toISODate(today) + 'T12:00:00Z').getTime();
  const days = Math.floor((t - start) / 86_400_000) + 1;
  if (days < 0) return 0;
  if (days > MANDALA_CONFIG.cycleDays) return MANDALA_CONFIG.cycleDays;
  return days;
}
