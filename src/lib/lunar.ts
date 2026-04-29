import { MoonPhase, SearchMoonPhase } from 'astronomy-engine';
import type { LunarPhaseName, SomaDay, SomaDayKind, Intensity } from './types';
import { computeTithi } from './tithi';

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
  lon: number;
  kind: SomaDayKind;
  title: string;
  tradition: SomaDay['tradition'];
}

const TARGETS: PhaseTarget[] = [
  { lon: 0, kind: 'new-moon', title: 'Amavasya — New Moon', tradition: 'vedic' },
  { lon: 120, kind: 'ekadashi', title: 'Shukla Ekadashi', tradition: 'vedic' },
  { lon: 180, kind: 'full-moon', title: 'Purnima — Full Moon', tradition: 'vedic' },
  { lon: 300, kind: 'ekadashi', title: 'Krishna Ekadashi', tradition: 'vedic' },
];

/**
 * Generate a schedule of Soma days between `from` and `from + days`.
 * Returns sorted ascending by date. Deterministic given the same inputs.
 */
export function generateSchedule(
  from: Date,
  days: number,
  intensity: Intensity,
): SomaDay[] {
  const end = addDays(from, days);
  const hours = intensityToHours(intensity);
  const results: SomaDay[] = [];

  for (const target of TARGETS) {
    let cursor = from;
    // Safety cap — at most ~4 events per target in a month.
    for (let i = 0; i < 20; i++) {
      const t = SearchMoonPhase(target.lon, cursor, 40);
      if (!t) break;
      const eventDate = t.date;
      if (eventDate >= end) break;
      const tithi = computeTithi(eventDate);
      results.push({
        date: toISODate(eventDate),
        kind: target.kind,
        intensityHours: hours,
        title: target.title,
        tradition: target.tradition,
        tithi: {
          index: tithi.index,
          indexInPaksha: tithi.indexInPaksha,
          paksha: tithi.paksha,
          name: tithi.name,
        },
      });
      cursor = addDays(eventDate, 1);
    }
  }

  return results.sort((a, b) => a.date.localeCompare(b.date));
}

/** Find the next Soma day on or after `today` from an existing schedule. */
export function findNextSomaDay(schedule: SomaDay[], today: Date): SomaDay | null {
  const todayIso = toISODate(today);
  return schedule.find((d) => d.date >= todayIso) ?? null;
}
