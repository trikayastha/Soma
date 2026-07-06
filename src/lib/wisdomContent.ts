import { getTithiMeta } from './tithiMeta';
import type { SomaDayKind } from './types';

/**
 * Wisdom content resolver (S4 expansion).
 *
 * Replaces the 8-entry table that previously lived inside `Wisdom.tsx` with a
 * lookup that draws the one-word benefit and citation IDs from the 30-tithi
 * `tithiMeta` seed, while keeping the curated per-kind wisdom prose that has
 * no home in `tithiMeta`.
 *
 * - **Scheduled SomaDay** → curated benefit + line (tuned per kind), citations
 *   sourced from the live tithi index so the card always cites a real source.
 * - **Generic day** (no scheduled fast) → the tithi's own `oneWordBenefit`
 *   (all 30 covered) + a generic "look up" line, still citation-backed.
 */

export interface WisdomContent {
  /** One-word benefit (rendered uppercase on the share card). */
  benefit: string;
  /** Wisdom line — short, ≤120 chars. */
  line: string;
  /** Citation IDs backing this day, drawn from `tithiMeta`. */
  citationIds: readonly string[];
}

/** Curated benefit + prose per scheduled kind. Plain English, no Sanskrit. */
const BY_KIND: Record<SomaDayKind, { benefit: string; line: string }> = {
  ekadashi: {
    benefit: 'Focus',
    line: 'A short fast steadies the mind for the work that matters tomorrow.',
  },
  'full-moon': {
    benefit: 'Stillness',
    line: 'The brightest night asks for less doing — sit, watch, soften the day.',
  },
  'new-moon': {
    benefit: 'Reset',
    line: 'A quiet night is a clean slate. Match the dark sky, then begin again.',
  },
  chaturthi: {
    benefit: 'Rhythm',
    line: 'A small skipped meal becomes a steady cue — show up the same way next month.',
  },
  pradosh: {
    benefit: 'Surrender',
    line: 'Twilight pauses the day. A short evening fast lets it land before sleep.',
  },
  'sankashti-chaturthi': {
    benefit: 'Clearing',
    line: 'A long fast broken at moonrise marks the end of one rhythm and the start of another.',
  },
  shivaratri: {
    benefit: 'Vigil',
    line: 'A long night of stillness is its own teaching. Keep it short, keep it warm.',
  },
  custom: {
    benefit: 'Resolve',
    line: 'A vow you set yourself is the quietest kind of strength. Keep it simply.',
  },
};

/** Fallback line for a day with no scheduled fast. */
const GENERIC_LINE =
  'The moon is a slow hand on a quiet clock. Step outside; look up.';

/**
 * Resolve the wisdom payload for a lunar day.
 *
 * @param tithiIndex Absolute tithi index 1..30 (throws if out of range).
 * @param kind The scheduled SomaDay kind, or null for a generic day.
 */
export function resolveWisdom(
  tithiIndex: number,
  kind: SomaDayKind | null,
): WisdomContent {
  const meta = getTithiMeta(tithiIndex);
  if (kind) {
    const curated = BY_KIND[kind];
    return {
      benefit: curated.benefit,
      line: curated.line,
      citationIds: meta.citationIds,
    };
  }
  return {
    benefit: meta.oneWordBenefit,
    line: GENERIC_LINE,
    citationIds: meta.citationIds,
  };
}
