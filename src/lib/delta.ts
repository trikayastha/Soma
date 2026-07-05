import type {
  AppState,
  DeltaContext,
  DeltaMetric,
  FastSession,
  PersonalDelta,
  SomaDay,
} from './types';

/**
 * Personal-delta computation
 * --------------------------
 * For each (metric × context) pair where the user has at least
 * {@link MIN_N} pre/post-logged credited sessions, emit a {@link PersonalDelta}
 * IFF the absolute mean delta exceeds the larger of {@link FLOOR} and the
 * standard error.
 *
 * Why both gates: the floor prevents trivially-small effects rendering with
 * tight variance. The |Δ| ≥ SE gate prevents noisy 1-or-2 effective samples
 * with high variance from rendering. Together they approximate t ≥ 1 with a
 * conservative floor — appropriate for a wellness app, not a clinical study.
 */

export const MIN_N = 3;
export const FLOOR = 0.3;

const METRICS: readonly DeltaMetric[] = ['focus', 'energy', 'mood', 'sleep'];

/** Map a SomaDay onto a DeltaContext bucket, or null if it does not bucket. */
export function contextFor(
  dayDate: string,
  schedule: SomaDay[],
): DeltaContext | null {
  const day = schedule.find((d) => d.date === dayDate);
  if (!day) return null;
  switch (day.kind) {
    case 'ekadashi': {
      // Ekadashis split by paksha when tithi metadata is present. Default
      // to shukla when paksha is missing — conservative; users with no
      // location won't fragment their data across two buckets.
      const paksha = day.tithi?.paksha ?? 'shukla';
      return paksha === 'krishna' ? 'krishna-ekadashi' : 'shukla-ekadashi';
    }
    case 'full-moon':
      return 'purnima';
    case 'new-moon':
      return 'amavasya';
    case 'pradosh':
      return 'pradosh';
    case 'sankashti-chaturthi':
      return 'sankashti';
    case 'shivaratri':
      return 'shivaratri';
    default:
      return null;
  }
}

function isCredited(s: FastSession): boolean {
  return s.status === 'completed' || s.status === 'late-completed';
}

/** Compute personal deltas. Sorted by |Δ| descending. */
export function computeDeltas(state: AppState): PersonalDelta[] {
  const buckets = new Map<string, number[]>();

  for (const s of state.sessions) {
    if (!isCredited(s)) continue;
    if (!s.preLog || !s.postLog) continue;
    const ctx = contextFor(s.dayDate, state.schedule);
    if (!ctx) continue;

    for (const m of METRICS) {
      const d = s.postLog[m] - s.preLog[m];
      const key = `${m}.${ctx}`;
      const arr = buckets.get(key);
      if (arr) {
        arr.push(d);
      } else {
        buckets.set(key, [d]);
      }
    }
  }

  const out: PersonalDelta[] = [];
  for (const [key, samples] of buckets) {
    if (samples.length < MIN_N) continue;
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    const variance =
      samples.reduce((a, b) => a + (b - mean) ** 2, 0) /
      Math.max(1, samples.length - 1);
    const se = Math.sqrt(variance / samples.length);
    if (Math.abs(mean) < Math.max(FLOOR, se)) continue;

    const [metric, context] = key.split('.') as [DeltaMetric, DeltaContext];
    out.push({
      key,
      metric,
      context,
      delta: round2(mean),
      n: samples.length,
      se: round3(se),
      phraseKey: `delta.${metric}.${context}`,
    });
  }

  out.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return out;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
