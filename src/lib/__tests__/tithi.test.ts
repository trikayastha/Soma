import { describe, it, expect } from 'vitest';
import { computeTithi, tithiLabel, tithiShort } from '../tithi';
import { SearchMoonPhase } from 'astronomy-engine';

describe('tithi / computeTithi', () => {
  it('returns index in [1,30] and fraction in [0,1)', () => {
    const t = computeTithi(new Date('2025-06-15T12:00:00Z'));
    expect(t.index).toBeGreaterThanOrEqual(1);
    expect(t.index).toBeLessThanOrEqual(30);
    expect(t.fraction).toBeGreaterThanOrEqual(0);
    expect(t.fraction).toBeLessThan(1);
  });

  it('Amavasya (index 30) at the new moon instant', () => {
    const t0 = SearchMoonPhase(0, new Date('2025-01-01T00:00:00Z'), 40);
    expect(t0).not.toBeNull();
    // Just before the new-moon instant, elongation wraps to ~360° → tithi 30.
    const slightlyBefore = new Date(t0!.date.getTime() - 60 * 1000);
    const t = computeTithi(slightlyBefore);
    expect(t.index).toBe(30);
    expect(t.name).toBe('Amavasya');
    expect(t.paksha).toBe('krishna');
  });

  it('Purnima (index 15) at the full moon instant', () => {
    const t0 = SearchMoonPhase(180, new Date('2025-01-01T00:00:00Z'), 40);
    expect(t0).not.toBeNull();
    const slightlyBefore = new Date(t0!.date.getTime() - 60 * 1000);
    const t = computeTithi(slightlyBefore);
    expect(t.index).toBe(15);
    expect(t.name).toBe('Purnima');
    expect(t.paksha).toBe('shukla');
  });

  it('Ekadashi falls on tithi 11 or 26', () => {
    const t0 = SearchMoonPhase(120, new Date('2025-01-01T00:00:00Z'), 40);
    expect(t0).not.toBeNull();
    // Elongation 120° is the *start* of Shukla Ekadashi; sample just after.
    const slightlyAfter = new Date(t0!.date.getTime() + 60 * 1000);
    const t = computeTithi(slightlyAfter);
    expect(t.index).toBe(11);
    expect(t.name).toBe('Ekadashi');
    expect(t.indexInPaksha).toBe(11);
  });

  it('shukla paksha covers indices 1..15, krishna 16..30', () => {
    const a = computeTithi(new Date('2025-03-01T12:00:00Z'));
    expect(a.paksha === 'shukla' || a.paksha === 'krishna').toBe(true);
    if (a.index <= 15) {
      expect(a.paksha).toBe('shukla');
      expect(a.indexInPaksha).toBe(a.index);
    } else {
      expect(a.paksha).toBe('krishna');
      expect(a.indexInPaksha).toBe(a.index - 15);
    }
  });
});

describe('tithi / labels', () => {
  it('formats long and short labels for Purnima', () => {
    const t = { index: 15, indexInPaksha: 15, paksha: 'shukla' as const, name: 'Purnima', fraction: 0.5 };
    expect(tithiLabel(t)).toBe('Purnima');
    expect(tithiShort(t)).toBe('Pur');
  });

  it('formats long and short labels for Krishna Ekadashi', () => {
    const t = { index: 26, indexInPaksha: 11, paksha: 'krishna' as const, name: 'Ekadashi', fraction: 0.1 };
    expect(tithiLabel(t)).toBe('Krishna Ekadashi');
    expect(tithiShort(t)).toBe('K11');
  });
});
