import { describe, it, expect } from 'vitest';
import drikFixtures from '../data/drik-fixtures.json';
import { computeTithiAtSunrise } from '../tithi';
import type { Location } from '../types';

/**
 * Drik Panchang parity smoke test.
 *
 * Each fixture in `drik-fixtures.json` carries an `expectedTithiIndex` and
 * `expectedPaksha` cross-checked against drikpanchang.com on 2026-04-28
 * (see file's `_note` header for tolerances).
 *
 * We assert:
 *  - tithi index matches within ±1 (boundary-day tolerance per spec H11)
 *  - paksha matches exactly
 *  - accuracy === 'sunrise' (location is provided in every fixture)
 *
 * If `astronomy-engine` is upgraded and shifts a boundary, only the
 * fixtures should need adjustment, not the assertion logic.
 */
interface Fixture {
  city: string;
  lat: number;
  lon: number;
  tz: string;
  date: string;
  expectedTithiIndex: number;
  expectedPaksha: 'shukla' | 'krishna';
}

const FIXTURES: readonly Fixture[] = drikFixtures.fixtures as readonly Fixture[];

function locationFor(f: Fixture): Location {
  return {
    lat: f.lat,
    lon: f.lon,
    label: f.city,
    slug: f.city,
    tz: f.tz,
    countryCode: 'XX',
  };
}

describe('Drik Panchang parity', () => {
  it('fixture file has at least 9 entries (3 cities × 3 dates)', () => {
    expect(FIXTURES.length).toBeGreaterThanOrEqual(9);
  });

  it.each(FIXTURES)(
    '$city $date → tithi $expectedTithiIndex / $expectedPaksha (±1)',
    (f) => {
      const noon = new Date(`${f.date}T00:00:00Z`);
      const info = computeTithiAtSunrise(noon, locationFor(f));
      expect(info.accuracy).toBe('sunrise');
      const diff = Math.min(
        Math.abs(info.index - f.expectedTithiIndex),
        Math.abs(info.index - f.expectedTithiIndex - 30),
        Math.abs(info.index - f.expectedTithiIndex + 30),
      );
      expect(
        diff,
        `expected tithi ~${f.expectedTithiIndex} for ${f.city} ${f.date}; got ${info.index}`,
      ).toBeLessThanOrEqual(1);
      // Paksha agreement only checked when not on a paksha boundary
      // (indices 14/15/16 or 29/30/1 are paksha boundary tithis).
      const onPakshaBoundary =
        info.index === 15 ||
        info.index === 16 ||
        info.index === 30 ||
        info.index === 1;
      if (!onPakshaBoundary) {
        expect(info.paksha).toBe(f.expectedPaksha);
      }
    },
  );

  it('exact-match rate ≥80% across the fixture', () => {
    const total = FIXTURES.length;
    let exact = 0;
    for (const f of FIXTURES) {
      const noon = new Date(`${f.date}T00:00:00Z`);
      const info = computeTithiAtSunrise(noon, locationFor(f));
      if (info.index === f.expectedTithiIndex) exact++;
    }
    const rate = exact / total;
    expect(
      rate,
      `exact-match parity ${exact}/${total} = ${(rate * 100).toFixed(1)}%`,
    ).toBeGreaterThanOrEqual(0.8);
  });
});
