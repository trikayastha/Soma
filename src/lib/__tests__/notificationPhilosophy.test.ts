import { describe, it, expect } from 'vitest';
import {
  buildPhilosophySchedule,
  notificationsForDay,
  type ScheduledNotification,
} from '../notificationPhilosophy';
import type { RemindersPrefs, SomaDay } from '../types';

const PREFS: RemindersPrefs = {
  dayOfTime: '17:00',
  leadMinutes: 30,
  liveNotifications: true,
};

function day(overrides: Partial<SomaDay> = {}): SomaDay {
  return {
    date: '2026-05-01',
    kind: 'ekadashi',
    intensityHours: 16,
    title: 'Shukla Ekadashi',
    tradition: 'vedic',
    sunriseAt: '2026-05-01T06:00:00.000Z',
    tithi: {
      index: 11,
      indexInPaksha: 11,
      paksha: 'shukla',
      name: 'Ekadashi',
    },
    ...overrides,
  };
}

const kindsOf = (entries: ScheduledNotification[]) =>
  entries.map((e) => e.kind).sort();

describe('notificationPhilosophy / quiet tier', () => {
  it('emits a single day-of ping for major fasts', () => {
    const out = notificationsForDay(day(), 'quiet', PREFS);
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe('day-of');
  });

  it('emits no pings for non-major fast days (e.g. pradosh)', () => {
    const out = notificationsForDay(day({ kind: 'pradosh' }), 'quiet', PREFS);
    expect(out).toHaveLength(0);
  });

  it('emits day-of for full-moon, new-moon, shivaratri', () => {
    expect(notificationsForDay(day({ kind: 'full-moon' }), 'quiet', PREFS)).toHaveLength(1);
    expect(notificationsForDay(day({ kind: 'new-moon' }), 'quiet', PREFS)).toHaveLength(1);
    expect(notificationsForDay(day({ kind: 'shivaratri' }), 'quiet', PREFS)).toHaveLength(1);
  });
});

describe('notificationPhilosophy / standard tier', () => {
  it('adds a pre-fast lead-time ping', () => {
    const out = notificationsForDay(day(), 'standard', PREFS);
    expect(kindsOf(out)).toEqual(['day-of', 'pre-fast']);
  });

  it('orders entries chronologically (lead before day-of)', () => {
    const out = notificationsForDay(day(), 'standard', PREFS);
    expect(out[0].kind).toBe('pre-fast');
    expect(out[1].kind).toBe('day-of');
  });

  it('encodes the lead minutes token on the prefast entry', () => {
    const out = notificationsForDay(day(), 'standard', {
      ...PREFS,
      leadMinutes: 90,
    });
    const prefast = out.find((e) => e.kind === 'pre-fast');
    expect(prefast?.tokens?.minutes).toBe(90);
  });
});

describe('notificationPhilosophy / detailed tier', () => {
  it('adds parana, tithi-sunrise, and reflection for ekadashi', () => {
    const out = notificationsForDay(day(), 'detailed', PREFS);
    const kinds = kindsOf(out);
    expect(kinds).toContain('day-of');
    expect(kinds).toContain('pre-fast');
    expect(kinds).toContain('parana');
    expect(kinds).toContain('tithi-sunrise');
    expect(kinds).toContain('reflection');
  });

  it('parana window opens 24h after sunriseAt', () => {
    const out = notificationsForDay(day(), 'detailed', PREFS);
    const parana = out.find((e) => e.kind === 'parana');
    expect(parana).toBeDefined();
    expect(new Date(parana!.at).getTime()).toBe(
      new Date('2026-05-01T06:00:00.000Z').getTime() + 24 * 3600_000,
    );
  });

  it('skips tithi-sunrise when sunriseAt is missing', () => {
    const out = notificationsForDay(day({ sunriseAt: null }), 'detailed', PREFS);
    expect(kindsOf(out)).not.toContain('tithi-sunrise');
  });

  it('emits a pradosh-specific kind on pradosh days', () => {
    const out = notificationsForDay(day({ kind: 'pradosh' }), 'detailed', PREFS);
    expect(kindsOf(out)).toContain('pradosh');
  });

  it('emits a sankashti-specific kind on sankashti-chaturthi days', () => {
    const out = notificationsForDay(
      day({ kind: 'sankashti-chaturthi' }),
      'detailed',
      PREFS,
    );
    expect(kindsOf(out)).toContain('sankashti');
  });
});

describe('notificationPhilosophy / dedupe', () => {
  it('drops duplicate (kind, dayDate) pairs across multiple days', () => {
    const sched = [day(), day()]; // same date twice
    const out = buildPhilosophySchedule(sched, 'standard', PREFS);
    // Without dedupe we'd have 4 entries. With dedupe we have 2 (one per kind).
    expect(out).toHaveLength(2);
    expect(kindsOf(out)).toEqual(['day-of', 'pre-fast']);
  });
});

describe('notificationPhilosophy / monthly volume bands', () => {
  function thirtyDayMonth(kinds: SomaDay['kind'][]): SomaDay[] {
    return kinds.map((k, i) =>
      day({
        date: `2026-05-${String(i + 1).padStart(2, '0')}`,
        kind: k,
        sunriseAt: `2026-05-${String(i + 1).padStart(2, '0')}T06:00:00.000Z`,
      }),
    );
  }

  it('quiet stays in the ~2-3/month band for a typical lunar month', () => {
    // Typical month: 2 ekadashis + 1 full-moon + 1 new-moon = 4 majors,
    // but we tolerate 2–3 visible cards because `quiet` only fires day-of.
    const sched = thirtyDayMonth(['ekadashi', 'full-moon', 'ekadashi']);
    const out = buildPhilosophySchedule(sched, 'quiet', PREFS);
    expect(out.length).toBeGreaterThanOrEqual(2);
    expect(out.length).toBeLessThanOrEqual(4);
  });

  it('detailed produces multi-step output for an ekadashi day (5+)', () => {
    const out = notificationsForDay(day(), 'detailed', PREFS);
    expect(out.length).toBeGreaterThanOrEqual(5);
  });
});
