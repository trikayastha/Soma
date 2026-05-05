import { describe, it, expect } from 'vitest';
import {
  currentMandala,
  daysElapsedInMandala,
  isMajorFast,
  mandalaHistory,
  resolveAnchorDate,
} from '../mandala';
import { emptyState } from '../storage';
import type { AppState, FastSession, SomaDay } from '../types';

function day(date: string, kind: SomaDay['kind'] = 'ekadashi'): SomaDay {
  return { date, kind, intensityHours: 16, title: kind, tradition: 'vedic' };
}

function session(date: string, status: FastSession['status'] = 'completed'): FastSession {
  return {
    id: `s-${date}-${status}`,
    dayDate: date,
    startedAt: `${date}T08:00:00Z`,
    intensityHours: 16,
    status,
  };
}

function stateWith(parts: Partial<AppState>): AppState {
  return { ...emptyState(), ...parts };
}

describe('mandala / isMajorFast', () => {
  it('classifies majors and minors', () => {
    expect(isMajorFast('ekadashi')).toBe(true);
    expect(isMajorFast('full-moon')).toBe(true);
    expect(isMajorFast('new-moon')).toBe(true);
    expect(isMajorFast('chaturthi')).toBe(true);
    expect(isMajorFast('shivaratri')).toBe(true);
    expect(isMajorFast('pradosh')).toBe(false);
    expect(isMajorFast('sankashti-chaturthi')).toBe(false);
  });
});

describe('mandala / resolveAnchorDate', () => {
  it('returns null with no anchor', () => {
    expect(resolveAnchorDate(emptyState())).toBeNull();
  });

  it('prefers manualResetDate over firstObservedFastDate', () => {
    const s = stateWith({
      mandalaAnchor: {
        firstObservedFastDate: '2025-01-15',
        manualResetDate: '2025-04-20T00:00:00Z',
      },
    });
    expect(resolveAnchorDate(s)).toBe('2025-04-20');
  });

  it('falls back to firstObservedFastDate', () => {
    const s = stateWith({
      mandalaAnchor: {
        firstObservedFastDate: '2025-01-15',
        manualResetDate: null,
      },
    });
    expect(resolveAnchorDate(s)).toBe('2025-01-15');
  });
});

describe('mandala / mandalaHistory', () => {
  it('returns [] without anchor', () => {
    expect(mandalaHistory(emptyState(), new Date('2025-05-01'))).toEqual([]);
  });

  it('returns one in-progress mandala when anchor is recent', () => {
    const s = stateWith({
      mandalaAnchor: {
        firstObservedFastDate: '2025-04-01',
        manualResetDate: null,
      },
      schedule: [day('2025-04-05'), day('2025-04-15')],
      sessions: [session('2025-04-05')],
    });
    const ms = mandalaHistory(s, new Date('2025-04-20T12:00:00Z'));
    expect(ms.length).toBe(1);
    expect(ms[0].status).toBe('in-progress');
    expect(ms[0].observed).toEqual(['2025-04-05']);
    expect(ms[0].expected).toEqual(['2025-04-05', '2025-04-15']);
  });

  it('completes a window when ≥60% of expected fasts observed and minExpected met', () => {
    const s = stateWith({
      mandalaAnchor: {
        firstObservedFastDate: '2025-01-01',
        manualResetDate: null,
      },
      schedule: [
        day('2025-01-05'),
        day('2025-01-12'),
        day('2025-01-20'),
        day('2025-01-28'),
      ],
      sessions: [
        session('2025-01-05'),
        session('2025-01-12'),
        session('2025-01-20'),
      ],
    });
    // Today after window 1 close (window: 2025-01-01 .. 2025-02-10)
    const ms = mandalaHistory(s, new Date('2025-02-15T12:00:00Z'));
    expect(ms[0].status).toBe('completed');
    expect(ms[0].completionRate).toBeCloseTo(0.75);
  });

  it('marks a window partial when threshold missed but minExpected met', () => {
    const s = stateWith({
      mandalaAnchor: {
        firstObservedFastDate: '2025-01-01',
        manualResetDate: null,
      },
      schedule: [
        day('2025-01-05'),
        day('2025-01-12'),
        day('2025-01-20'),
        day('2025-01-28'),
      ],
      sessions: [session('2025-01-05')], // 1 of 4 = 25%
    });
    const ms = mandalaHistory(s, new Date('2025-02-15T12:00:00Z'));
    expect(ms[0].status).toBe('partial');
    expect(ms[0].completionRate).toBeCloseTo(0.25);
  });

  it('NEVER produces a "broken" status — only completed, partial, in-progress', () => {
    const s = stateWith({
      mandalaAnchor: {
        firstObservedFastDate: '2025-01-01',
        manualResetDate: null,
      },
      schedule: [day('2025-01-05'), day('2025-01-12'), day('2025-01-20')],
      sessions: [], // missed every fast
    });
    const ms = mandalaHistory(s, new Date('2025-02-15T12:00:00Z'));
    for (const m of ms) {
      expect(m.status).not.toBe('broken' as never);
    }
  });

  it('carry-forwards a thin window (<minExpected) into the next window', () => {
    const s = stateWith({
      mandalaAnchor: {
        firstObservedFastDate: '2025-01-01',
        manualResetDate: null,
      },
      // Window 1: just 2 fasts (below minExpected=3) → carry forward
      // Window 2 (starts 2025-02-10): 2 fasts → combined with carry = 4
      schedule: [
        day('2025-01-10'),
        day('2025-01-25'),
        day('2025-02-15'),
        day('2025-03-01'),
      ],
      sessions: [
        session('2025-01-10'),
        session('2025-01-25'),
        session('2025-02-15'),
      ],
    });
    const ms = mandalaHistory(s, new Date('2025-04-01T12:00:00Z'));
    // First window stays 'in-progress' (carry-forward, never partial-stamped)
    expect(ms[0].status).toBe('in-progress');
    // Second window has 4 expected (2 carry + 2 native), 3 observed → completed
    expect(ms[1].expected.length).toBe(4);
    expect(ms[1].status).toBe('completed');
  });

  it('aborted sessions are NOT counted toward observed', () => {
    const s = stateWith({
      mandalaAnchor: {
        firstObservedFastDate: '2025-01-01',
        manualResetDate: null,
      },
      schedule: [day('2025-01-05'), day('2025-01-12'), day('2025-01-20')],
      sessions: [
        session('2025-01-05', 'aborted'),
        session('2025-01-12'),
        session('2025-01-20'),
      ],
    });
    const ms = mandalaHistory(s, new Date('2025-02-15T12:00:00Z'));
    expect(ms[0].observed).toEqual(['2025-01-12', '2025-01-20']);
  });

  it('late-completed sessions ARE counted toward observed', () => {
    const s = stateWith({
      mandalaAnchor: {
        firstObservedFastDate: '2025-01-01',
        manualResetDate: null,
      },
      schedule: [day('2025-01-05'), day('2025-01-12'), day('2025-01-20')],
      sessions: [
        session('2025-01-05', 'late-completed'),
        session('2025-01-12'),
        session('2025-01-20'),
      ],
    });
    const ms = mandalaHistory(s, new Date('2025-02-15T12:00:00Z'));
    expect(ms[0].observed.length).toBe(3);
    expect(ms[0].status).toBe('completed');
  });

  it('manual reset re-anchors mandala forward', () => {
    const s = stateWith({
      mandalaAnchor: {
        firstObservedFastDate: '2025-01-01',
        manualResetDate: '2025-03-01T00:00:00Z',
      },
      schedule: [day('2025-03-10'), day('2025-03-20')],
      sessions: [],
    });
    const ms = mandalaHistory(s, new Date('2025-03-15T12:00:00Z'));
    expect(ms.length).toBe(1);
    expect(ms[0].startDate).toBe('2025-03-01');
  });

  it('idempotent across repeated calls (pure function)', () => {
    const s = stateWith({
      mandalaAnchor: {
        firstObservedFastDate: '2025-01-01',
        manualResetDate: null,
      },
      schedule: [day('2025-01-05'), day('2025-01-12'), day('2025-01-20')],
      sessions: [session('2025-01-05'), session('2025-01-12')],
    });
    const a = mandalaHistory(s, new Date('2025-02-15T12:00:00Z'));
    const b = mandalaHistory(s, new Date('2025-02-15T12:00:00Z'));
    expect(a).toEqual(b);
  });
});

describe('mandala / currentMandala + daysElapsedInMandala', () => {
  it('returns null with no anchor', () => {
    expect(currentMandala(emptyState(), new Date())).toBeNull();
  });

  it('reports days elapsed within a window', () => {
    const s = stateWith({
      mandalaAnchor: {
        firstObservedFastDate: '2025-04-01',
        manualResetDate: null,
      },
      schedule: [day('2025-04-05')],
    });
    const today = new Date('2025-04-10T12:00:00Z');
    const m = currentMandala(s, today);
    expect(m).not.toBeNull();
    if (!m) return;
    expect(daysElapsedInMandala(m, today)).toBe(10);
  });
});
