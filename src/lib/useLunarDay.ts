import { useMemo } from 'react';
import {
  elongationToPhaseName,
  moonElongation,
  moonIllumination,
  phaseNameToLabel,
} from './lunar';
import { computeTithiAtSunrise } from './tithi';
import type { TithiInfo } from './tithi';
import type { Location, LunarPhaseName, SomaDay } from './types';

export interface LunarDay {
  /** Noon UTC of the ISO day — a stable, timezone-agnostic midday reading. */
  noonUtc: Date;
  elongation: number;
  /** Illuminated fraction, 0..1. */
  illum: number;
  phaseName: LunarPhaseName;
  phaseLabel: string;
  waxing: boolean;
  tithi: TithiInfo;
}

/**
 * Shared noon-UTC → elongation / illumination / tithi math for a single ISO
 * day. Memoized on the day + location so repeated callers (header, day card,
 * strips) recompute only when the day or location changes.
 */
export function useLunarDay(iso: string, location: Location | null): LunarDay {
  return useMemo(() => {
    const noonUtc = new Date(iso + 'T12:00:00Z');
    const elongation = moonElongation(noonUtc);
    const illum = moonIllumination(noonUtc);
    const phaseName = elongationToPhaseName(elongation);
    return {
      noonUtc,
      elongation,
      illum,
      phaseName,
      phaseLabel: phaseNameToLabel(phaseName),
      waxing: elongation < 180,
      tithi: computeTithiAtSunrise(noonUtc, location),
    };
  }, [iso, location]);
}

/** Build the date → SomaDay lookup once per schedule. */
export function useScheduleByDate(schedule: SomaDay[]): Map<string, SomaDay> {
  return useMemo(() => {
    const m = new Map<string, SomaDay>();
    for (const d of schedule) m.set(d.date, d);
    return m;
  }, [schedule]);
}
