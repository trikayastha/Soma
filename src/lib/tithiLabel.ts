import type { Theme } from './types';
import type { Tithi } from './tithi';

/**
 * Render a dual-labeled string for a tithi according to the active theme.
 *
 * Default order is `Lunar Day {n} · {Name} · {Benefit?}`. The devotional
 * theme reverses to put the Sanskrit name first; the minimal theme drops
 * the "Lunar Day" prefix entirely. Benefit is optional — S2 will source
 * it from `tithiMeta`. Any falsy/empty benefit is omitted gracefully.
 *
 * NOTE on naming: a sibling `tithiLabel(tithi)` already exists in
 * `tithi.ts` (returns "Shukla Pratipada"). The verb-prefixed name here
 * disambiguates without breaking existing imports (see H8).
 */
export function formatTithiLabel(
  tithi: Tithi,
  theme: Theme,
  benefit?: string,
): string {
  const idx = `Lunar Day ${tithi.index}`;
  const name = tithi.name;
  const parts: string[] = [];

  if (theme === 'devotional') {
    parts.push(name, idx);
  } else if (theme === 'minimal') {
    parts.push(name);
  } else {
    parts.push(idx, name);
  }

  if (benefit && benefit.trim().length > 0) {
    parts.push(benefit.trim());
  }
  return parts.join(' · ');
}
