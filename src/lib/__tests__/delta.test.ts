import { describe, it, expect } from 'vitest';
import { computeDeltas, contextFor, FLOOR, MIN_N } from '../delta';
import { emptyState } from '../storage';
import type { AppState, FastSession, SomaDay, SubjectiveLog } from '../types';

function day(date: string, kind: SomaDay['kind'] = 'ekadashi'): SomaDay {
  return { date, kind, intensityHours: 16, title: kind, tradition: 'vedic' };
}

function log(focus: number, energy = 5, mood = 5, sleep = 5): SubjectiveLog {
  return { focus, energy, mood, sleep };
}

function session(
  date: string,
  pre: SubjectiveLog,
  post: SubjectiveLog,
  status: FastSession['status'] = 'completed',
): FastSession {
  return {
    id: `s-${date}-${Math.random()}`,
    dayDate: date,
    startedAt: `${date}T08:00:00Z`,
    endedAt: `${date}T20:00:00Z`,
    intensityHours: 16,
    status,
    preLog: pre,
    postLog: post,
  };
}

function s(parts: Partial<AppState>): AppState {
  return { ...emptyState(), ...parts };
}

describe('delta / contextFor', () => {
  it('maps schedule kinds to delta contexts', () => {
    const sched = [day('2025-01-05', 'full-moon')];
    expect(contextFor('2025-01-05', sched)).toBe('purnima');
  });
  it('returns null for unknown dates', () => {
    expect(contextFor('2099-12-31', [])).toBeNull();
  });
  it('buckets ekadashi by paksha when tithi present', () => {
    const sched: SomaDay[] = [
      {
        ...day('2025-01-05', 'ekadashi'),
        tithi: { index: 26, indexInPaksha: 11, paksha: 'krishna', name: 'Ekadashi' },
      },
    ];
    expect(contextFor('2025-01-05', sched)).toBe('krishna-ekadashi');
  });
  it('defaults ekadashi to shukla when paksha missing', () => {
    expect(contextFor('2025-01-05', [day('2025-01-05', 'ekadashi')])).toBe(
      'shukla-ekadashi',
    );
  });
});

describe('delta / computeDeltas', () => {
  const sched = [
    day('2025-01-05', 'ekadashi'),
    day('2025-01-19', 'ekadashi'),
    day('2025-02-02', 'ekadashi'),
    day('2025-02-16', 'ekadashi'),
    day('2025-03-02', 'ekadashi'),
  ];

  it('emits nothing with n < MIN_N', () => {
    const state = s({
      schedule: sched,
      sessions: [
        session('2025-01-05', log(3), log(8)),
        session('2025-01-19', log(3), log(8)),
      ],
    });
    expect(MIN_N).toBe(3);
    expect(computeDeltas(state)).toEqual([]);
  });

  it('emits nothing when |Δ| < FLOOR', () => {
    const state = s({
      schedule: sched,
      // Tiny consistent +0.1 delta on focus
      sessions: [
        session('2025-01-05', log(5), log(5.1)),
        session('2025-01-19', log(5), log(5.1)),
        session('2025-02-02', log(5), log(5.1)),
      ],
    });
    expect(FLOOR).toBe(0.3);
    const out = computeDeltas(state);
    const focusBucket = out.find((d) => d.metric === 'focus');
    expect(focusBucket).toBeUndefined();
  });

  it('emits nothing when |Δ| < SE (high variance)', () => {
    const state = s({
      schedule: sched,
      // Large variance, small mean: mean=0.33, samples [-3, 0, +4] → SE high
      sessions: [
        session('2025-01-05', log(5), log(2)),
        session('2025-01-19', log(5), log(5)),
        session('2025-02-02', log(5), log(9)),
      ],
    });
    const out = computeDeltas(state);
    const focusBucket = out.find((d) => d.metric === 'focus');
    expect(focusBucket).toBeUndefined();
  });

  it('emits a focus delta when both gates pass', () => {
    const state = s({
      schedule: sched,
      sessions: [
        session('2025-01-05', log(3), log(7)),
        session('2025-01-19', log(3), log(7)),
        session('2025-02-02', log(3), log(7)),
      ],
    });
    const out = computeDeltas(state);
    const focus = out.find((d) => d.metric === 'focus');
    expect(focus).toBeDefined();
    if (!focus) return;
    expect(focus.delta).toBeCloseTo(4, 1);
    expect(focus.n).toBe(3);
    expect(focus.context).toBe('shukla-ekadashi');
    expect(focus.phraseKey).toBe('delta.focus.shukla-ekadashi');
  });

  it('sorts results by |Δ| descending', () => {
    const state = s({
      schedule: sched,
      sessions: [
        session('2025-01-05', log(3, 5, 5, 5), log(7, 4, 5, 5)), // focus +4, energy -1
        session('2025-01-19', log(3, 5, 5, 5), log(7, 4, 5, 5)),
        session('2025-02-02', log(3, 5, 5, 5), log(7, 4, 5, 5)),
      ],
    });
    const out = computeDeltas(state);
    expect(out.length).toBeGreaterThanOrEqual(1);
    for (let i = 1; i < out.length; i++) {
      expect(Math.abs(out[i].delta)).toBeLessThanOrEqual(Math.abs(out[i - 1].delta));
    }
  });

  it('skips aborted sessions', () => {
    const state = s({
      schedule: sched,
      sessions: [
        session('2025-01-05', log(3), log(7), 'aborted'),
        session('2025-01-19', log(3), log(7), 'aborted'),
        session('2025-02-02', log(3), log(7), 'aborted'),
      ],
    });
    expect(computeDeltas(state)).toEqual([]);
  });

  it('counts late-completed sessions', () => {
    const state = s({
      schedule: sched,
      sessions: [
        session('2025-01-05', log(3), log(7), 'late-completed'),
        session('2025-01-19', log(3), log(7), 'late-completed'),
        session('2025-02-02', log(3), log(7), 'late-completed'),
      ],
    });
    const out = computeDeltas(state);
    expect(out.find((d) => d.metric === 'focus')).toBeDefined();
  });
});
