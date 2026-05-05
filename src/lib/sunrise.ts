import { Body, Observer, SearchRiseSet } from 'astronomy-engine';

export interface SunriseResult {
  /** UTC instant of sunrise on the requested local-civil date. */
  date: Date;
  /** True if a polar fallback was applied (no rise/set on that day). */
  approximate: boolean;
}

/**
 * Compute the sunrise instant for the given local civil date and location.
 *
 * Returns `null` for polar or extreme-latitude inputs where the sun does
 * not rise on the requested day. Callers should fall back to UTC noon and
 * tag the resulting tithi as `'polar-fallback'`.
 *
 * Implementation notes:
 * - We anchor the search at 00:00 UTC of `date.getUTCFullYear/Month/Date`
 *   and search forward up to 1.0 day. This is sufficient for any
 *   non-polar location: at most one sunrise occurs per 24 h window.
 * - `Observer(lat, lon, 0)` uses sea-level elevation. The ±2 min tolerance
 *   that we test against (and that Drik Panchang uses) absorbs altitude
 *   error up to ~1 km — risk H1 in the spec.
 * - `astronomy-engine`'s `SearchRiseSet` returns `null` when the sun does
 *   not cross the horizon during the search window. We treat that as a
 *   polar fallback regardless of the latitude threshold (risk H2 — covers
 *   Reykjavik 64.1° near solstice).
 * - Conservative threshold: `|lat| > 66.5°` short-circuits without calling
 *   the engine. The threshold is the Arctic Circle.
 */
export function computeSunrise(
  date: Date,
  lat: number,
  lon: number,
): SunriseResult | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (Math.abs(lat) > 66.5) return null;

  const observer = new Observer(lat, lon, 0);
  const startUtc = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
  // direction +1 = rising; limitDays = 1.5 buffers any minor edge cases at
  // local-midnight boundaries without straying into the next civil day.
  const result = SearchRiseSet(Body.Sun, observer, +1, startUtc, 1.5);
  if (!result) return null;
  return { date: result.date, approximate: false };
}
