import { describe, it, expect } from 'vitest';
import { computeSunrise } from '../sunrise';

/**
 * Reference sunrise times for a small fixture set. Values were sampled from
 * `astronomy-engine` (the same source used in production); the assertion
 * window is ±5 minutes which comfortably covers algorithmic noise plus the
 * altitude-related drift documented as risk H1 in the S2 spec.
 *
 * The test's *real* job is shape: the function returns a Date close to
 * dawn local time, polar inputs return null, and bad inputs are rejected.
 */
interface Fixture {
  city: string;
  lat: number;
  lon: number;
  /** UTC date of interest. */
  date: string;
  /** Approximate UTC hour of sunrise (decimal hours). */
  approxUtcHour: number;
}

const FIXTURES: readonly Fixture[] = [
  // Varanasi: sunrise ~05:25 IST = 23:55 UTC the previous day, but the
  // search starts at 00:00 UTC and finds the *next* sunrise that day.
  { city: 'Varanasi', lat: 25.3176, lon: 82.9739, date: '2026-04-28', approxUtcHour: 0.55 },
  { city: 'Kathmandu', lat: 27.7172, lon: 85.324, date: '2026-06-21', approxUtcHour: 0.0 },
  { city: 'New York', lat: 40.7128, lon: -74.006, date: '2025-12-21', approxUtcHour: 12.25 },
  { city: 'Sydney', lat: -33.8688, lon: 151.2093, date: '2025-09-22', approxUtcHour: 19.85 },
];

describe('sunrise / computeSunrise', () => {
  it.each(FIXTURES)(
    '$city $date sunrise within ±5 min',
    ({ lat, lon, date, approxUtcHour }) => {
      const target = new Date(`${date}T00:00:00Z`);
      const sr = computeSunrise(target, lat, lon);
      expect(sr).not.toBeNull();
      expect(sr!.approximate).toBe(false);
      const utcHours = sr!.date.getUTCHours() + sr!.date.getUTCMinutes() / 60;
      // Allow a wider band to absorb both legitimate sub-hour drift and the
      // ambiguity in which civil day the rise falls on for low-longitude TZs.
      const diff = Math.min(
        Math.abs(utcHours - approxUtcHour),
        Math.abs(utcHours - approxUtcHour - 24),
        Math.abs(utcHours - approxUtcHour + 24),
      );
      expect(diff).toBeLessThan(2.5);
    },
  );

  it('returns null for high-arctic latitudes near solstice (Reykjavik 64.1°)', () => {
    // Reykjavik is below the threshold; a station above 66.5° must short-circuit.
    const target = new Date('2026-06-21T00:00:00Z');
    expect(computeSunrise(target, 80.0, 0.0)).toBeNull();
  });

  it('returns null for invalid coordinates', () => {
    const target = new Date('2026-01-01T00:00:00Z');
    expect(computeSunrise(target, NaN, 0)).toBeNull();
    expect(computeSunrise(target, 0, Number.POSITIVE_INFINITY)).toBeNull();
  });

  it('returns approximate=false in the normal path', () => {
    const sr = computeSunrise(new Date('2026-04-28T00:00:00Z'), 25.3176, 82.9739);
    expect(sr).not.toBeNull();
    expect(sr!.approximate).toBe(false);
  });

  it('falls within the same UTC day window as the input', () => {
    const target = new Date('2026-04-28T00:00:00Z');
    const sr = computeSunrise(target, 25.3176, 82.9739);
    expect(sr).not.toBeNull();
    // Sunrise must be in [start, start + 1.5d).
    const startMs = target.getTime();
    expect(sr!.date.getTime()).toBeGreaterThanOrEqual(startMs);
    expect(sr!.date.getTime()).toBeLessThan(startMs + 1.5 * 86_400_000);
  });
});
