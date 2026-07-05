import type { Location } from './types';
import { computeSunrise } from './sunrise';
import { computeTithiAtSunrise, tithiBoundaries } from './tithi';

/**
 * Parana window — the permitted time-of-day on the day after Ekadashi
 * during which the fast must be broken.
 *
 * Drik Panchang convention (Hemadri's Vrata Khanda):
 *  - Parana opens at sunrise of the day after the Ekadashi fast day.
 *  - It must close before Dwadashi tithi end.
 *  - It additionally must close within the first quarter of the
 *    Dwadashi duration.
 *  - When Dwadashi ends before the next sunrise, the parana day shifts
 *    forward to the next civil day where Dwadashi is still active at
 *    sunrise — but in practice this is rare and we accept the simpler
 *    "next-day sunrise" rule for S2.
 *
 * Returns `null` when:
 *  - `location` is missing (degraded UI: "Break fast at sunrise tomorrow").
 *  - The fast date does not resolve to an Ekadashi.
 *  - Sunrise cannot be computed (polar fallback).
 */
export interface ParanaWindow {
  /** Sunrise of the parana day. */
  earliest: Date;
  /** min(Dwadashi end, sunrise + Dwadashi/4). */
  latest: Date;
  /** Civil date used for display (UTC midnight of parana day). */
  paranaDay: Date;
}

/**
 * Compute the parana window for a given Ekadashi fast date.
 * `fastDate` should be the local civil date of the Ekadashi day.
 */
export function paranaWindow(
  fastDate: Date,
  location?: Location | null,
): ParanaWindow | null {
  if (!location) return null;

  const fastInfo = computeTithiAtSunrise(fastDate, location);
  // Only Ekadashi tithis (index 11 or 26) have a parana.
  if (fastInfo.index !== 11 && fastInfo.index !== 26) return null;

  // Parana day is the civil day after the fast date.
  const paranaDay = new Date(
    Date.UTC(
      fastDate.getUTCFullYear(),
      fastDate.getUTCMonth(),
      fastDate.getUTCDate() + 1,
      0,
      0,
      0,
      0,
    ),
  );

  const sr = computeSunrise(paranaDay, location.lat, location.lon);
  if (!sr) return null;
  const earliest = sr.date;

  // Find Dwadashi window. The boundary at the parana-day sunrise should
  // straddle Dwadashi (tithi index 12 or 27). If the sun rises in
  // Trayodashi or later, Dwadashi has already closed — caller's UI must
  // handle the "fast broken late" edge separately.
  const boundaries = tithiBoundaries(paranaDay, location);
  const dwadashiEnd = boundaries.end;

  // Quarter-duration cap: parana should close within the first 1/4 of
  // Dwadashi — but Dwadashi spans ~24 hours, so its quarter is ~6 hours.
  const dwadashiDurationMs = boundaries.end.getTime() - boundaries.start.getTime();
  const quarterCap = new Date(earliest.getTime() + dwadashiDurationMs / 4);

  const latestMs = Math.min(dwadashiEnd.getTime(), quarterCap.getTime());
  const latest = new Date(latestMs);

  return { earliest, latest, paranaDay };
}
