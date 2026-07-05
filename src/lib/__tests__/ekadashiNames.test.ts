import { describe, it, expect } from 'vitest';
import {
  EKADASHI_NAMES,
  ADHIK_EKADASHIS,
  ekadashiNameFor,
} from '../ekadashiNames';

describe('ekadashiNames / data table', () => {
  it('has 12 lunar-month entries × 2 pakshas = 24 names total', () => {
    expect(EKADASHI_NAMES).toHaveLength(12);
    for (const pair of EKADASHI_NAMES) {
      expect(pair).toHaveLength(2);
      expect(pair[0].length).toBeGreaterThan(0);
      expect(pair[1].length).toBeGreaterThan(0);
    }
  });

  it('all 24 names are unique', () => {
    const all = EKADASHI_NAMES.flatMap((p) => [p[0], p[1]]);
    const uniq = new Set(all);
    expect(uniq.size).toBe(24);
  });

  it('exposes the two Adhik names', () => {
    expect(ADHIK_EKADASHIS.shukla).toBe('Padmini');
    expect(ADHIK_EKADASHIS.krishna).toBe('Parama');
  });
});

describe('ekadashiNames / ekadashiNameFor', () => {
  it('returns Kamada for Chaitra Shukla', () => {
    expect(ekadashiNameFor(1, 'shukla')).toBe('Kamada');
  });

  it('returns Varuthini for Chaitra Krishna', () => {
    expect(ekadashiNameFor(1, 'krishna')).toBe('Varuthini');
  });

  it('returns Nirjala for Jyeshtha Shukla', () => {
    expect(ekadashiNameFor(3, 'shukla')).toBe('Nirjala');
  });

  it('returns Mokshada for Margashirsha Shukla', () => {
    expect(ekadashiNameFor(9, 'shukla')).toBe('Mokshada');
  });

  it('returns Padmini when adhik=true and paksha=shukla', () => {
    expect(ekadashiNameFor(1, 'shukla', true)).toBe('Padmini');
    expect(ekadashiNameFor(7, 'shukla', true)).toBe('Padmini');
  });

  it('returns Parama when adhik=true and paksha=krishna', () => {
    expect(ekadashiNameFor(1, 'krishna', true)).toBe('Parama');
    expect(ekadashiNameFor(11, 'krishna', true)).toBe('Parama');
  });

  it('throws on out-of-range lunar month', () => {
    expect(() => ekadashiNameFor(0, 'shukla')).toThrow();
    expect(() => ekadashiNameFor(13, 'shukla')).toThrow();
  });
});
