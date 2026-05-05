import { describe, it, expect } from 'vitest';
import { paranaWindow } from '../parana';
import { computeTithiAtSunrise } from '../tithi';
import { SearchMoonPhase } from 'astronomy-engine';
import type { Location } from '../types';

const KATHMANDU: Location = {
  lat: 27.7172,
  lon: 85.324,
  label: 'Kathmandu',
  slug: 'kathmandu',
  tz: 'Asia/Kathmandu',
  countryCode: 'NP',
};

/** Find an Ekadashi day (tithi 11 or 26) by searching forward from `from`. */
function findEkadashiDate(from: Date, location: Location, maxDays = 30): Date | null {
  const cursor = new Date(from);
  for (let i = 0; i < maxDays; i++) {
    const info = computeTithiAtSunrise(cursor, location);
    if (info.index === 11 || info.index === 26) return new Date(cursor);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return null;
}

describe('parana / paranaWindow', () => {
  it('returns null when location is missing', () => {
    const w = paranaWindow(new Date('2026-04-28T00:00:00Z'), null);
    expect(w).toBeNull();
  });

  it('returns null for a non-Ekadashi day', () => {
    // Pick a date guaranteed not to be Ekadashi by stepping near Purnima.
    const purn = SearchMoonPhase(180, new Date('2026-04-01T00:00:00Z'), 40);
    expect(purn).not.toBeNull();
    const w = paranaWindow(purn!.date, KATHMANDU);
    expect(w).toBeNull();
  });

  it('returns a sensible window on an Ekadashi day', () => {
    const fastDate = findEkadashiDate(new Date('2026-04-01T00:00:00Z'), KATHMANDU);
    expect(fastDate).not.toBeNull();
    const w = paranaWindow(fastDate!, KATHMANDU);
    expect(w).not.toBeNull();
    expect(w!.earliest.getTime()).toBeLessThan(w!.latest.getTime());
    // The parana day must be the day after fastDate (UTC).
    expect(w!.paranaDay.getUTCDate()).toBe(
      new Date(fastDate!.getTime() + 86_400_000).getUTCDate(),
    );
  });

  it('latest is bounded by sunrise + ~6h (Dwadashi-quarter cap)', () => {
    const fastDate = findEkadashiDate(new Date('2026-04-01T00:00:00Z'), KATHMANDU);
    expect(fastDate).not.toBeNull();
    const w = paranaWindow(fastDate!, KATHMANDU);
    expect(w).not.toBeNull();
    const minutesAfterSunrise =
      (w!.latest.getTime() - w!.earliest.getTime()) / 60_000;
    // Quarter of a tithi (~24h / 4 = ~6h).
    expect(minutesAfterSunrise).toBeGreaterThan(60);
    expect(minutesAfterSunrise).toBeLessThan(8 * 60);
  });
});
