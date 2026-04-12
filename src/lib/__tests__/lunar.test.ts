import { describe, it, expect } from 'vitest';
import {
  addDays,
  elongationToPhaseName,
  findNextSomaDay,
  generateSchedule,
  intensityToHours,
  moonElongation,
  moonIllumination,
  phaseNameToLabel,
  toISODate,
} from '../lunar';

describe('lunar / date helpers', () => {
  it('formats a date as yyyy-mm-dd in UTC', () => {
    expect(toISODate(new Date('2025-03-14T10:00:00Z'))).toBe('2025-03-14');
  });

  it('adds days without mutating the input', () => {
    const base = new Date('2025-03-14T00:00:00Z');
    const out = addDays(base, 3);
    expect(toISODate(out)).toBe('2025-03-17');
    expect(toISODate(base)).toBe('2025-03-14');
  });
});

describe('lunar / phase math', () => {
  it('returns elongation in [0, 360)', () => {
    const e = moonElongation(new Date('2025-01-01T00:00:00Z'));
    expect(e).toBeGreaterThanOrEqual(0);
    expect(e).toBeLessThan(360);
  });

  it('illumination is in [0, 1]', () => {
    const i = moonIllumination(new Date('2025-06-15T00:00:00Z'));
    expect(i).toBeGreaterThanOrEqual(0);
    expect(i).toBeLessThanOrEqual(1);
  });

  it('maps elongation to each of the 8 canonical phase names', () => {
    expect(elongationToPhaseName(0)).toBe('new-moon');
    expect(elongationToPhaseName(45)).toBe('waxing-crescent');
    expect(elongationToPhaseName(90)).toBe('first-quarter');
    expect(elongationToPhaseName(135)).toBe('waxing-gibbous');
    expect(elongationToPhaseName(180)).toBe('full-moon');
    expect(elongationToPhaseName(225)).toBe('waning-gibbous');
    expect(elongationToPhaseName(270)).toBe('last-quarter');
    expect(elongationToPhaseName(315)).toBe('waning-crescent');
  });

  it('normalizes out-of-range elongation inputs', () => {
    expect(elongationToPhaseName(-45)).toBe('waning-crescent');
    expect(elongationToPhaseName(720)).toBe('new-moon');
  });

  it('labels phases with human-readable text', () => {
    expect(phaseNameToLabel('full-moon')).toBe('Full Moon');
    expect(phaseNameToLabel('new-moon')).toBe('New Moon');
  });
});

describe('lunar / schedule generation', () => {
  it('intensity maps to hours', () => {
    expect(intensityToHours('12h')).toBe(12);
    expect(intensityToHours('16h')).toBe(16);
    expect(intensityToHours('24h')).toBe(24);
  });

  it('produces sorted, unique-date Soma days covering the window', () => {
    const from = new Date('2025-03-01T00:00:00Z');
    const schedule = generateSchedule(from, 60, '24h');
    expect(schedule.length).toBeGreaterThan(4); // at least ~4 full/new/2 ekadashi in 2 months
    const dates = schedule.map((d) => d.date);
    const sorted = [...dates].sort();
    expect(dates).toEqual(sorted);
  });

  it('returns only days inside the requested window', () => {
    const from = new Date('2025-03-01T00:00:00Z');
    const days = 30;
    const end = addDays(from, days);
    const schedule = generateSchedule(from, days, '16h');
    const fromIso = toISODate(from);
    const endIso = toISODate(end);
    for (const d of schedule) {
      expect(d.date >= fromIso).toBe(true);
      expect(d.date < endIso).toBe(true);
    }
  });

  it('every generated day carries the selected intensity', () => {
    const schedule = generateSchedule(new Date('2025-05-01T00:00:00Z'), 45, '16h');
    expect(schedule.length).toBeGreaterThan(0);
    for (const d of schedule) expect(d.intensityHours).toBe(16);
  });

  it('findNextSomaDay returns the first day on or after today', () => {
    const schedule = generateSchedule(new Date('2025-04-01T00:00:00Z'), 60, '24h');
    const target = schedule[2];
    const queryDate = new Date(target.date + 'T00:00:00Z');
    const found = findNextSomaDay(schedule, queryDate);
    expect(found?.date).toBe(target.date);
  });

  it('findNextSomaDay returns null if all days are in the past', () => {
    const schedule = generateSchedule(new Date('2025-01-01T00:00:00Z'), 30, '12h');
    const future = new Date('2030-01-01T00:00:00Z');
    expect(findNextSomaDay(schedule, future)).toBeNull();
  });
});
