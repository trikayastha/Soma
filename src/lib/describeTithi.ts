import { getTithiMeta } from './tithiMeta';
import type { FastingClass } from './tithiMeta';

export interface TithiDescription {
  /** Plain-English position anchored to the full/new moon. */
  landmark: string;
  /** What the day traditionally asks of the user, in plain English. */
  practice: string;
}

const PRACTICE_BY_CLASS: Record<FastingClass, string> = {
  'major-fast': 'a traditional fasting day',
  'minor-fast': 'a gentle fasting day',
  observance: 'a traditional observance',
  auspicious: 'an auspicious day',
  neutral: 'a rest day',
};

/** English glosses for the 15 tithi names (paksha-independent). */
const NAME_GLOSS: Record<string, string> = {
  Pratipada: 'the first',
  Dwitiya: 'the second',
  Tritiya: 'the third',
  Chaturthi: 'the fourth',
  Panchami: 'the fifth',
  Shashthi: 'the sixth',
  Saptami: 'the seventh',
  Ashtami: 'the eighth',
  Navami: 'the ninth',
  Dashami: 'the tenth',
  Ekadashi: 'the eleventh',
  Dwadashi: 'the twelfth',
  Trayodashi: 'the thirteenth',
  Chaturdashi: 'the fourteenth',
  Purnima: 'the full-moon night',
  Amavasya: 'the new-moon night',
};

function nights(n: number): string {
  return n === 1 ? '1 night' : `${n} nights`;
}

/**
 * Layer-0 tithi presentation (plain English, no Sanskrit).
 *
 * Nobody outside the tradition knows what "Shukla Dashami" is; everybody
 * understands "5 nights until the full moon". Each tithi index is anchored
 * to its nearest landmark — the new moon (0/30) or the full moon (15) —
 * and paired with what the day traditionally asks, derived from the
 * tithi's fasting class.
 */
export function describeTithi(index: number): TithiDescription {
  const meta = getTithiMeta(index);
  const practice = PRACTICE_BY_CLASS[meta.fastingClass];

  if (index === 15) return { landmark: 'Full moon tonight', practice };
  if (index === 30) return { landmark: 'New moon tonight', practice };

  let landmark: string;
  if (index < 15) {
    if (index <= 7) {
      landmark = `${nights(index)} after the new moon`;
    } else {
      const n = 15 - index;
      landmark =
        n === 1
          ? 'Full moon tomorrow night'
          : `${nights(n)} until the full moon`;
    }
  } else {
    const afterFull = index - 15;
    if (afterFull <= 7) {
      landmark = `${nights(afterFull)} after the full moon`;
    } else {
      const n = 30 - index;
      landmark =
        n === 1
          ? 'New moon tomorrow night'
          : `${nights(n)} until the new moon`;
    }
  }
  return { landmark, practice };
}

/** English gloss for a tithi name, or null for unknown names. */
export function tithiNameGloss(name: string): string | null {
  return NAME_GLOSS[name] ?? null;
}
