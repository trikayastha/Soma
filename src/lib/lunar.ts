import { MoonPhase, SearchMoonPhase } from 'astronomy-engine';
import type {
  Intensity,
  Location,
  LunarPhaseName,
  SomaDay,
  SomaDayKind,
} from './types';
import { computeTithiAtSunrise } from './tithi';

/** Convert a Date to a yyyy-mm-dd string in UTC. */
export function toISODate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

/**
 * Return the moon's elongation from the sun at the given date (0-360 degrees).
 * 0 = new moon, 90 = first quarter, 180 = full moon, 270 = last quarter.
 */
export function moonElongation(date: Date): number {
  const lon = MoonPhase(date);
  // Normalize into [0, 360)
  return ((lon % 360) + 360) % 360;
}

/** Illumination fraction 0..1 based on elongation. */
export function moonIllumination(date: Date): number {
  const e = moonElongation(date);
  const rad = (e * Math.PI) / 180;
  return (1 - Math.cos(rad)) / 2;
}

/** Map elongation to one of 8 canonical phase names. */
export function elongationToPhaseName(elongation: number): LunarPhaseName {
  const e = ((elongation % 360) + 360) % 360;
  if (e < 22.5 || e >= 337.5) return 'new-moon';
  if (e < 67.5) return 'waxing-crescent';
  if (e < 112.5) return 'first-quarter';
  if (e < 157.5) return 'waxing-gibbous';
  if (e < 202.5) return 'full-moon';
  if (e < 247.5) return 'waning-gibbous';
  if (e < 292.5) return 'last-quarter';
  return 'waning-crescent';
}

export function phaseNameToLabel(p: LunarPhaseName): string {
  return {
    'new-moon': 'New Moon',
    'waxing-crescent': 'Waxing Crescent',
    'first-quarter': 'First Quarter',
    'waxing-gibbous': 'Waxing Gibbous',
    'full-moon': 'Full Moon',
    'waning-gibbous': 'Waning Gibbous',
    'last-quarter': 'Last Quarter',
    'waning-crescent': 'Waning Crescent',
  }[p];
}

export function intensityToHours(i: Intensity): number {
  return i === '12h' ? 12 : i === '16h' ? 16 : 24;
}

interface PhaseTarget {
  /** Sun-moon elongation in degrees that *starts* this tithi. */
  lon: number;
  kind: SomaDayKind;
  title: string;
  tradition: SomaDay['tradition'];
  /** Hour-offset within the elongation step where the day-of-record sits.
   *  We add this many hours to the SearchMoonPhase result before
   *  emitting the SomaDay so the local date matches Drik convention. */
  hourOffset?: number;
}

/**
 * Phase targets that anchor each {@link SomaDayKind}. Each entry's `lon`
 * is the elongation that *begins* the named tithi; the SomaDay date is
 * derived from that instant + a small forward offset so we sit firmly
 * inside the tithi (not on the boundary).
 *
 * - Tithi index 11 (Shukla Ekadashi) starts at 120°
 * - Tithi index 13 (Shukla Trayodashi → Pradosh) starts at 144°
 * - Tithi index 15 (Purnima) starts at 168°; we sample +6 h to land in
 *   it across timezones
 * - Tithi index 19 (Krishna Chaturthi → Sankashti) starts at 216°
 * - Tithi index 26 (Krishna Ekadashi) starts at 300°
 * - Tithi index 28 (Krishna Trayodashi → Pradosh) starts at 324°
 * - Tithi index 29 (Krishna Chaturdashi → Shivaratri) starts at 336°
 * - Tithi index 30 (Amavasya) starts at 348°
 */
const TARGETS: readonly PhaseTarget[] = [
  { lon: 0, kind: 'new-moon', title: 'Amavasya — New Moon', tradition: 'vedic', hourOffset: -6 },
  { lon: 36, kind: 'chaturthi', title: 'Vinayaka Chaturthi', tradition: 'vedic', hourOffset: 6 },
  { lon: 120, kind: 'ekadashi', title: 'Shukla Ekadashi', tradition: 'vedic', hourOffset: 6 },
  { lon: 144, kind: 'pradosh', title: 'Shukla Pradosh', tradition: 'vedic', hourOffset: 6 },
  { lon: 180, kind: 'full-moon', title: 'Purnima — Full Moon', tradition: 'vedic', hourOffset: -6 },
  { lon: 216, kind: 'sankashti-chaturthi', title: 'Sankashti Chaturthi', tradition: 'vedic', hourOffset: 6 },
  { lon: 300, kind: 'ekadashi', title: 'Krishna Ekadashi', tradition: 'vedic', hourOffset: 6 },
  { lon: 324, kind: 'pradosh', title: 'Krishna Pradosh', tradition: 'vedic', hourOffset: 6 },
  { lon: 336, kind: 'shivaratri', title: 'Shivaratri', tradition: 'vedic', hourOffset: 6 },
];

/**
 * Generate a schedule of Soma days between `from` and `from + days`.
 * Returns sorted ascending by date. Deterministic given the same inputs.
 *
 * Pass `location` for sunrise-anchored tithi metadata + accuracy provenance
 * (S2). When omitted, tithi falls back to UTC-noon with
 * `accuracy: 'approximate'`.
 */
export function generateSchedule(
  from: Date,
  days: number,
  intensity: Intensity,
  location?: Location | null,
): SomaDay[] {
  const end = addDays(from, days);
  const hours = intensityToHours(intensity);
  const results: SomaDay[] = [];
  const seenIso = new Set<string>(); // dedupe across overlapping targets

  for (const target of TARGETS) {
    let cursor = from;
    const offsetMs = (target.hourOffset ?? 0) * 3600 * 1000;
    // Safety cap — at most ~4 events per target in a month.
    for (let i = 0; i < 20; i++) {
      const t = SearchMoonPhase(target.lon, cursor, 40);
      if (!t) break;
      const eventInstant = new Date(t.date.getTime() + offsetMs);
      if (eventInstant >= end) break;
      const iso = toISODate(eventInstant);
      const dedupeKey = `${iso}|${target.kind}`;
      if (!seenIso.has(dedupeKey)) {
        seenIso.add(dedupeKey);
        const localCivil = new Date(iso + 'T12:00:00Z');
        const info = computeTithiAtSunrise(localCivil, location ?? null);
        results.push({
          date: iso,
          kind: target.kind,
          intensityHours: hours,
          title: target.title,
          tradition: target.tradition,
          sunriseAt:
            info.anchor === 'sunrise' ? info.anchorAt.toISOString() : null,
          tithi: {
            index: info.index,
            indexInPaksha: info.indexInPaksha,
            paksha: info.paksha,
            name: info.name,
            accuracy: info.accuracy,
          },
        });
      }
      cursor = addDays(t.date, 1);
    }
  }

  return results.sort((a, b) => a.date.localeCompare(b.date));
}

/** Find the next Soma day on or after `today` from an existing schedule. */
export function findNextSomaDay(schedule: SomaDay[], today: Date): SomaDay | null {
  const todayIso = toISODate(today);
  return schedule.find((d) => d.date >= todayIso) ?? null;
}
