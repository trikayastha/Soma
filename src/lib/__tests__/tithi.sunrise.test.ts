import { describe, it, expect } from 'vitest';
import { computeTithiAtSunrise, tithiBoundaries } from '../tithi';
import type { Location } from '../types';

const KATHMANDU: Location = {
  lat: 27.7172,
  lon: 85.324,
  label: 'Kathmandu',
  slug: 'kathmandu',
  tz: 'Asia/Kathmandu',
  countryCode: 'NP',
};

const LOS_ANGELES: Location = {
  lat: 34.0522,
  lon: -118.2437,
  label: 'Los Angeles',
  slug: 'los-angeles',
  tz: 'America/Los_Angeles',
  countryCode: 'US',
};

const POLAR: Location = {
  lat: 80.0,
  lon: 15.0,
  label: 'Svalbard',
  slug: 'svalbard',
  tz: 'Arctic/Longyearbyen',
  countryCode: 'NO',
};

describe('computeTithiAtSunrise', () => {
  it('falls back to UTC noon with accuracy=approximate when no location', () => {
    const date = new Date('2026-04-28T00:00:00Z');
    const info = computeTithiAtSunrise(date, null);
    expect(info.accuracy).toBe('approximate');
    expect(info.anchor).toBe('utc-noon');
    expect(info.anchorAt.getUTCHours()).toBe(12);
    expect(info.index).toBeGreaterThanOrEqual(1);
    expect(info.index).toBeLessThanOrEqual(30);
  });

  it('anchors at sunrise when location is provided', () => {
    const date = new Date('2026-04-28T00:00:00Z');
    const info = computeTithiAtSunrise(date, KATHMANDU);
    expect(info.accuracy).toBe('sunrise');
    expect(info.anchor).toBe('sunrise');
    expect(info.anchorAt).toBeInstanceOf(Date);
  });

  it('falls back with polar-fallback for high-arctic locations', () => {
    const date = new Date('2026-12-21T00:00:00Z');
    const info = computeTithiAtSunrise(date, POLAR);
    expect(info.accuracy).toBe('polar-fallback');
    expect(info.anchor).toBe('utc-noon');
  });

  it('emits a tithi within bounds for both Kathmandu and Los Angeles', () => {
    const date = new Date('2026-04-28T00:00:00Z');
    const ktm = computeTithiAtSunrise(date, KATHMANDU);
    const la = computeTithiAtSunrise(date, LOS_ANGELES);
    for (const t of [ktm, la]) {
      expect(t.index).toBeGreaterThanOrEqual(1);
      expect(t.index).toBeLessThanOrEqual(30);
      expect(t.indexInPaksha).toBeGreaterThanOrEqual(1);
      expect(t.indexInPaksha).toBeLessThanOrEqual(15);
    }
  });
});

describe('tithiBoundaries', () => {
  it('start < anchor < end for a sunrise-anchored day', () => {
    const date = new Date('2026-04-28T00:00:00Z');
    const info = computeTithiAtSunrise(date, KATHMANDU);
    const { start, end } = tithiBoundaries(date, KATHMANDU);
    expect(start.getTime()).toBeLessThan(info.anchorAt.getTime());
    expect(info.anchorAt.getTime()).toBeLessThanOrEqual(end.getTime());
  });

  it('window length is roughly 1 tithi (~24 hours)', () => {
    const date = new Date('2026-04-28T00:00:00Z');
    const { start, end } = tithiBoundaries(date, KATHMANDU);
    const hours = (end.getTime() - start.getTime()) / 3_600_000;
    // A tithi can range ~19-26h; allow generous bounds.
    expect(hours).toBeGreaterThan(15);
    expect(hours).toBeLessThan(35);
  });

  it('returns a sane window when location is missing (UTC-noon anchor)', () => {
    const date = new Date('2026-04-28T00:00:00Z');
    const { start, end } = tithiBoundaries(date, null);
    expect(start.getTime()).toBeLessThan(end.getTime());
  });

  it('produces consistent boundaries across nearby cities (same tithi)', () => {
    const date = new Date('2026-04-28T00:00:00Z');
    const a = tithiBoundaries(date, KATHMANDU);
    // Slightly displaced location (~150 km) — same tithi window expected.
    const nearby: Location = { ...KATHMANDU, slug: 'pokhara', label: 'Pokhara', lat: 28.2096, lon: 83.9856 };
    const b = tithiBoundaries(date, nearby);
    // The boundaries should agree to within ~6 hours since a tithi spans ~24h.
    const startDiff = Math.abs(a.start.getTime() - b.start.getTime());
    expect(startDiff).toBeLessThan(6 * 3_600_000);
  });
});
