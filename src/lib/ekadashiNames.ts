import type { Location } from './types';
import type { Paksha } from './tithi';
import { resolveLunarMonth } from './lunarMonth';

/**
 * 24 named Ekadashis across the 12 Amanta lunar months × 2 pakshas, plus
 * 2 names reserved for Adhik (intercalary) months.
 *
 * Source: Drik Panchang almanac + Padma Purana (Uttara Khanda, ch. 47-58).
 * Cited via `ekadashi-padma-purana` in `citations.ts`.
 *
 * `EKADASHI_NAMES[month-1]` = `[shukla, krishna]`.
 * `ADHIK_EKADASHIS[paksha]` overrides during Adhik Maas.
 */
export const EKADASHI_NAMES: ReadonlyArray<readonly [string, string]> = [
  ['Kamada', 'Varuthini'],         //  1 Chaitra
  ['Mohini', 'Apara'],              //  2 Vaishakha
  ['Nirjala', 'Yogini'],            //  3 Jyeshtha
  ['Devshayani', 'Kamika'],         //  4 Ashadha
  ['Pavitra', 'Aja'],               //  5 Shravana   (Pavitra a.k.a. Putrada)
  ['Parsva', 'Indira'],             //  6 Bhadrapada (Parsva a.k.a. Parivartini)
  ['Papankusha', 'Rama'],           //  7 Ashwin
  ['Devotthani', 'Utpanna'],        //  8 Kartika    (Devotthani a.k.a. Prabodhini)
  ['Mokshada', 'Saphala'],          //  9 Margashirsha
  ['Pausha Putrada', 'Shattila'],   // 10 Pausha
  ['Jaya', 'Vijaya'],               // 11 Magha
  ['Amalaki', 'Papamochani'],       // 12 Phalguna
] as const;

/** Adhik-Maas Ekadashi names (Padma Purana, Uttara Khanda). */
export const ADHIK_EKADASHIS = {
  shukla: 'Padmini',
  krishna: 'Parama',
} as const;

/**
 * Resolve the named Ekadashi for a given lunar month + paksha.
 * `adhik=true` overrides month-bound names with Padmini / Parama.
 */
export function ekadashiNameFor(
  lunarMonth: number,
  paksha: Paksha,
  adhik = false,
): string {
  if (adhik) return ADHIK_EKADASHIS[paksha];
  if (lunarMonth < 1 || lunarMonth > 12) {
    throw new Error(`lunarMonth out of range: ${lunarMonth}`);
  }
  const pair = EKADASHI_NAMES[lunarMonth - 1];
  return paksha === 'shukla' ? pair[0] : pair[1];
}

/**
 * Resolve the named Ekadashi for an arbitrary civil date + paksha.
 * Convenience wrapper that looks up the lunar month from `date`.
 */
export function ekadashiNameForDate(
  date: Date,
  paksha: Paksha,
  location?: Location | null,
): string {
  const month = resolveLunarMonth(date, location);
  return ekadashiNameFor(month.index, paksha, month.adhik);
}
