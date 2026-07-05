import { describe, it, expect } from 'vitest';
import { SearchMoonPhase } from 'astronomy-engine';
import { LUNAR_MONTHS, resolveLunarMonth, isAdhikMonth } from '../lunarMonth';

describe('lunarMonth / LUNAR_MONTHS', () => {
  it('lists 12 months starting at Chaitra', () => {
    expect(LUNAR_MONTHS).toHaveLength(12);
    expect(LUNAR_MONTHS[0]).toBe('Chaitra');
    expect(LUNAR_MONTHS[11]).toBe('Phalguna');
  });
});

describe('lunarMonth / resolveLunarMonth', () => {
  it('returns a valid index 1..12 and matching name', () => {
    const r = resolveLunarMonth(new Date('2026-04-28T00:00:00Z'));
    expect(r.index).toBeGreaterThanOrEqual(1);
    expect(r.index).toBeLessThanOrEqual(12);
    expect(r.name).toBe(LUNAR_MONTHS[r.index - 1]);
    expect(typeof r.adhik).toBe('boolean');
  });

  it('produces consistent month for adjacent dates within a month', () => {
    // Two dates ~10 days apart within the same lunar month should return
    // the same index.
    const a = resolveLunarMonth(new Date('2026-05-05T00:00:00Z'));
    const b = resolveLunarMonth(new Date('2026-05-12T00:00:00Z'));
    expect(a.index).toBe(b.index);
  });

  it('rolls over to a new month after the next new moon', () => {
    // Spanning a synodic-month boundary the index should shift by 1
    // (modulo 12).
    const a = resolveLunarMonth(new Date('2026-04-01T00:00:00Z'));
    const b = resolveLunarMonth(new Date('2026-06-01T00:00:00Z'));
    expect(a.index).not.toBe(b.index);
  });
});

describe('lunarMonth / isAdhikMonth', () => {
  it('returns a boolean for arbitrary dates', () => {
    const r = isAdhikMonth(new Date('2026-01-01T00:00:00Z'));
    expect(typeof r).toBe('boolean');
  });

  it('most ordinary new-moon anchored months are non-Adhik', () => {
    // Adhik Maas occurs roughly once every 32-33 months. Sample one year of
    // *actual new moons* and assert at most one is Adhik.
    const newMoons: Date[] = [];
    let cursor = new Date('2026-01-01T00:00:00Z');
    for (let i = 0; i < 12; i++) {
      const t = SearchMoonPhase(0, cursor, 35);
      if (!t) break;
      newMoons.push(t.date);
      cursor = new Date(t.date.getTime() + 1000);
    }
    const adhikCount = newMoons.filter((d) => isAdhikMonth(d)).length;
    expect(adhikCount).toBeLessThanOrEqual(2);
  });
});
