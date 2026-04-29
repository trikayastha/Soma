import { moonElongation } from './lunar';

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
