import { moonElongation } from './lunar';
import { computeSunrise } from './sunrise';
import type { Location, TithiAccuracy } from './types';

export type Paksha = 'shukla' | 'krishna';

export interface Tithi {
  /** 1..30 — 1=Shukla Pratipada (just after New Moon), 15=Purnima, 30=Amavasya. */
  index: number;
  /** 1..15 — index within the current paksha. */
  indexInPaksha: number;
  paksha: Paksha;
  name: string;
  /** Fraction through the current tithi, 0..1. */
  fraction: number;
}

/** Sunrise-anchored tithi enriched with provenance + anchor instant. */
export interface TithiInfo extends Tithi {
  accuracy: TithiAccuracy;
  anchor: 'sunrise' | 'utc-noon';
  anchorAt: Date;
}

/** Inclusive-start, exclusive-end tithi window in absolute UTC instants. */
export interface TithiBoundary {
  start: Date;
  end: Date;
}

/**
 * Sanskrit tithi names (Pratipada..Chaturdashi repeat in each paksha,
 * Purnima closes Shukla, Amavasya closes Krishna).
 */
export const TITHI_NAMES: readonly string[] = [
  'Pratipada',
  'Dwitiya',
  'Tritiya',
  'Chaturthi',
  'Panchami',
  'Shashthi',
  'Saptami',
  'Ashtami',
  'Navami',
  'Dashami',
  'Ekadashi',
  'Dwadashi',
  'Trayodashi',
  'Chaturdashi',
];

/**
 * Derive tithi from the sun-moon elongation at the given instant.
 * A tithi spans 12° of elongation; there are 30 tithis per synodic month.
 *
 * Reference time is the instant supplied; callers choose local midnight
 * for daily labels (simpler) or sunrise for traditional almanacs.
 */
export function computeTithi(date: Date): Tithi {
  const elong = moonElongation(date);
  const raw = elong / 12; // 0..30
  const index = Math.floor(raw) + 1; // 1..30
  const fraction = raw - Math.floor(raw);
  const paksha: Paksha = index <= 15 ? 'shukla' : 'krishna';
  const indexInPaksha = index <= 15 ? index : index - 15;
  const name = tithiName(index);
  return { index, indexInPaksha, paksha, name, fraction };
}

function tithiName(index: number): string {
  if (index === 15) return 'Purnima';
  if (index === 30) return 'Amavasya';
  const i = index <= 15 ? index - 1 : index - 16;
  return TITHI_NAMES[i];
}

export function tithiLabel(t: Tithi): string {
  if (t.index === 15) return 'Purnima';
  if (t.index === 30) return 'Amavasya';
  const p = t.paksha === 'shukla' ? 'Shukla' : 'Krishna';
  return `${p} ${t.name}`;
}

/** Short label suited to compact calendar cells, e.g. "S11" or "K14". */
export function tithiShort(t: Tithi): string {
  if (t.index === 15) return 'Pur';
  if (t.index === 30) return 'Ama';
  const p = t.paksha === 'shukla' ? 'S' : 'K';
  return `${p}${t.indexInPaksha}`;
}

/* -------------------------------------------------------------------------
 * Sunrise-anchored entry point (S2)
 * -----------------------------------------------------------------------*/

/** Civil-noon UTC instant for the given local civil date. */
function utcNoon(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      12,
      0,
      0,
      0,
    ),
  );
}

/**
 * Canonical tithi resolver. Anchors to the local sunrise of the supplied
 * `location`. Falls back to UTC noon (with `accuracy: 'approximate'`) when
 * `location` is missing, and to UTC noon with `accuracy: 'polar-fallback'`
 * when sunrise cannot be computed (high-arctic / extreme latitudes).
 */
export function computeTithiAtSunrise(
  date: Date,
  location?: Location | null,
): TithiInfo {
  if (!location) {
    const noon = utcNoon(date);
    return {
      ...computeTithi(noon),
      accuracy: 'approximate',
      anchor: 'utc-noon',
      anchorAt: noon,
    };
  }
  const sr = computeSunrise(date, location.lat, location.lon);
  if (!sr) {
    const noon = utcNoon(date);
    return {
      ...computeTithi(noon),
      accuracy: 'polar-fallback',
      anchor: 'utc-noon',
      anchorAt: noon,
    };
  }
  return {
    ...computeTithi(sr.date),
    accuracy: 'sunrise',
    anchor: 'sunrise',
    anchorAt: sr.date,
  };
}

/**
 * Find the elongation-window {@link TithiBoundary} that contains the
 * sunrise (or fallback) anchor of the given local civil date.
 *
 * The window edges are the elongations `floor(elong/12)*12` and that+12.
 * Each edge is located by binary search across a ±36 h interval around the
 * anchor instant, with up to 30 iterations — sub-2 second resolution.
 *
 * Returns the boundary in absolute UTC instants.
 */
export function tithiBoundaries(
  date: Date,
  location?: Location | null,
): TithiBoundary {
  const info = computeTithiAtSunrise(date, location);
  const anchorMs = info.anchorAt.getTime();
  const elongAtAnchor = moonElongation(info.anchorAt);
  const lower = Math.floor(elongAtAnchor / 12) * 12;
  const upper = lower + 12;
  const HALF_WINDOW_MS = 36 * 3600 * 1000;
  const start = bisectElongationCrossing(
    lower,
    new Date(anchorMs - HALF_WINDOW_MS),
    info.anchorAt,
  );
  const end = bisectElongationCrossing(
    upper,
    info.anchorAt,
    new Date(anchorMs + HALF_WINDOW_MS),
  );
  return { start, end };
}

/**
 * Locate the instant where the moon-sun elongation crosses `targetDeg`
 * (mod 360) between `lo` and `hi`. Assumes a single crossing in-window —
 * the caller's ±36 h frame is small relative to the synodic month so this
 * holds for any reasonable target.
 */
function bisectElongationCrossing(
  targetDeg: number,
  lo: Date,
  hi: Date,
): Date {
  const target = ((targetDeg % 360) + 360) % 360;
  let loMs = lo.getTime();
  let hiMs = hi.getTime();
  for (let i = 0; i < 30; i++) {
    const midMs = (loMs + hiMs) / 2;
    const mid = new Date(midMs);
    const elong = moonElongation(mid);
    // Normalize the elongation relative to the target so we can compare on
    // a signed axis. delta is in (-180, 180].
    const delta = signedDelta(elong, target);
    if (delta < 0) {
      loMs = midMs;
    } else {
      hiMs = midMs;
    }
  }
  return new Date((loMs + hiMs) / 2);
}

function signedDelta(a: number, b: number): number {
  let d = (a - b) % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}
