/**
 * 30-tithi metadata seed.
 *
 * One {@link TithiMeta} entry per tithi index 1..30 keyed by absolute index
 * (1 = Shukla Pratipada through 30 = Amavasya). Citation IDs reference
 * entries in `citations.ts`.
 *
 * Sources cross-checked against the Drik Panchang almanac + the cited
 * primary texts. Reviewer notes live in `docs/CONTENT_REVIEW.md` (added
 * alongside PR 4).
 */

export type FastingClass =
  | 'major-fast'
  | 'minor-fast'
  | 'observance'
  | 'auspicious'
  | 'neutral';

export type Energy = 'rising' | 'peak' | 'falling' | 'still';

export type RecommendedPractice =
  | 'fast'
  | 'meditate'
  | 'reflect'
  | 'celebrate'
  | 'rest';

export interface TithiMeta {
  index: number;
  paksha: 'shukla' | 'krishna';
  name: string;
  /** IAST romanisation. */
  iast: string;
  /** Presiding deity. */
  deity: string;
  fastingClass: FastingClass;
  fastingName?: string;
  /** Single-word benefit shown in dual labelling (S1). */
  oneWordBenefit: string;
  energy: Energy;
  recommendedPractice: RecommendedPractice;
  citationIds: readonly string[];
}

export const TITHI_META: Record<number, TithiMeta> = {
  1: { index: 1, paksha: 'shukla', name: 'Pratipada', iast: 'Pratipadā', deity: 'Agni', fastingClass: 'neutral', oneWordBenefit: 'Beginning', energy: 'rising', recommendedPractice: 'reflect', citationIds: ['panchanga-narada-purana'] },
  2: { index: 2, paksha: 'shukla', name: 'Dwitiya', iast: 'Dvitīyā', deity: 'Brahma', fastingClass: 'neutral', oneWordBenefit: 'Steadiness', energy: 'rising', recommendedPractice: 'reflect', citationIds: ['panchanga-narada-purana'] },
  3: { index: 3, paksha: 'shukla', name: 'Tritiya', iast: 'Tṛtīyā', deity: 'Gauri', fastingClass: 'auspicious', fastingName: 'Akshaya Tritiya', oneWordBenefit: 'Abundance', energy: 'rising', recommendedPractice: 'celebrate', citationIds: ['panchanga-narada-purana'] },
  4: { index: 4, paksha: 'shukla', name: 'Chaturthi', iast: 'Caturthī', deity: 'Ganesha', fastingClass: 'minor-fast', fastingName: 'Vinayaka Chaturthi', oneWordBenefit: 'Removal', energy: 'rising', recommendedPractice: 'reflect', citationIds: ['sankashti-ganesha-purana'] },
  5: { index: 5, paksha: 'shukla', name: 'Panchami', iast: 'Pañcamī', deity: 'Naga', fastingClass: 'neutral', oneWordBenefit: 'Knowledge', energy: 'rising', recommendedPractice: 'reflect', citationIds: ['panchanga-narada-purana'] },
  6: { index: 6, paksha: 'shukla', name: 'Shashthi', iast: 'Ṣaṣṭhī', deity: 'Kartikeya', fastingClass: 'neutral', oneWordBenefit: 'Vitality', energy: 'rising', recommendedPractice: 'meditate', citationIds: ['panchanga-narada-purana'] },
  7: { index: 7, paksha: 'shukla', name: 'Saptami', iast: 'Saptamī', deity: 'Surya', fastingClass: 'observance', oneWordBenefit: 'Radiance', energy: 'rising', recommendedPractice: 'meditate', citationIds: ['panchanga-narada-purana'] },
  8: { index: 8, paksha: 'shukla', name: 'Ashtami', iast: 'Aṣṭamī', deity: 'Durga', fastingClass: 'minor-fast', fastingName: 'Durga Ashtami', oneWordBenefit: 'Strength', energy: 'rising', recommendedPractice: 'meditate', citationIds: ['panchanga-narada-purana'] },
  9: { index: 9, paksha: 'shukla', name: 'Navami', iast: 'Navamī', deity: 'Durga', fastingClass: 'observance', fastingName: 'Rama Navami', oneWordBenefit: 'Devotion', energy: 'rising', recommendedPractice: 'celebrate', citationIds: ['panchanga-narada-purana'] },
  10: { index: 10, paksha: 'shukla', name: 'Dashami', iast: 'Daśamī', deity: 'Yama', fastingClass: 'neutral', oneWordBenefit: 'Patience', energy: 'peak', recommendedPractice: 'reflect', citationIds: ['panchanga-narada-purana'] },
  11: { index: 11, paksha: 'shukla', name: 'Ekadashi', iast: 'Ekādaśī', deity: 'Vishnu', fastingClass: 'major-fast', fastingName: 'Ekadashi', oneWordBenefit: 'Clarity', energy: 'peak', recommendedPractice: 'fast', citationIds: ['ekadashi-padma-purana', 'autophagy-mizushima-2008', 'tre-de-cabo-2019'] },
  12: { index: 12, paksha: 'shukla', name: 'Dwadashi', iast: 'Dvādaśī', deity: 'Vishnu', fastingClass: 'observance', fastingName: 'Parana', oneWordBenefit: 'Release', energy: 'peak', recommendedPractice: 'rest', citationIds: ['parana-hemadri-vrata-khanda'] },
  13: { index: 13, paksha: 'shukla', name: 'Trayodashi', iast: 'Trayodaśī', deity: 'Shiva', fastingClass: 'minor-fast', fastingName: 'Pradosh', oneWordBenefit: 'Surrender', energy: 'peak', recommendedPractice: 'meditate', citationIds: ['pradosh-skanda-purana'] },
  14: { index: 14, paksha: 'shukla', name: 'Chaturdashi', iast: 'Caturdaśī', deity: 'Shiva', fastingClass: 'observance', oneWordBenefit: 'Discernment', energy: 'peak', recommendedPractice: 'reflect', citationIds: ['panchanga-narada-purana'] },
  15: { index: 15, paksha: 'shukla', name: 'Purnima', iast: 'Pūrṇimā', deity: 'Soma', fastingClass: 'observance', fastingName: 'Purnima', oneWordBenefit: 'Fullness', energy: 'peak', recommendedPractice: 'celebrate', citationIds: ['purnima-vishnu-dharmottara', 'lunar-cajochen-2013', 'lunar-casiraghi-2021'] },
  16: { index: 16, paksha: 'krishna', name: 'Pratipada', iast: 'Pratipadā', deity: 'Agni', fastingClass: 'neutral', oneWordBenefit: 'Letting-go', energy: 'falling', recommendedPractice: 'reflect', citationIds: ['panchanga-narada-purana'] },
  17: { index: 17, paksha: 'krishna', name: 'Dwitiya', iast: 'Dvitīyā', deity: 'Brahma', fastingClass: 'neutral', oneWordBenefit: 'Yielding', energy: 'falling', recommendedPractice: 'rest', citationIds: ['panchanga-narada-purana'] },
  18: { index: 18, paksha: 'krishna', name: 'Tritiya', iast: 'Tṛtīyā', deity: 'Gauri', fastingClass: 'neutral', oneWordBenefit: 'Gentleness', energy: 'falling', recommendedPractice: 'rest', citationIds: ['panchanga-narada-purana'] },
  19: { index: 19, paksha: 'krishna', name: 'Chaturthi', iast: 'Caturthī', deity: 'Ganesha', fastingClass: 'minor-fast', fastingName: 'Sankashti Chaturthi', oneWordBenefit: 'Obstacle-clearing', energy: 'falling', recommendedPractice: 'fast', citationIds: ['sankashti-ganesha-purana'] },
  20: { index: 20, paksha: 'krishna', name: 'Panchami', iast: 'Pañcamī', deity: 'Naga', fastingClass: 'neutral', oneWordBenefit: 'Caution', energy: 'falling', recommendedPractice: 'reflect', citationIds: ['panchanga-narada-purana'] },
  21: { index: 21, paksha: 'krishna', name: 'Shashthi', iast: 'Ṣaṣṭhī', deity: 'Kartikeya', fastingClass: 'neutral', oneWordBenefit: 'Resilience', energy: 'falling', recommendedPractice: 'rest', citationIds: ['panchanga-narada-purana'] },
  22: { index: 22, paksha: 'krishna', name: 'Saptami', iast: 'Saptamī', deity: 'Surya', fastingClass: 'neutral', oneWordBenefit: 'Endurance', energy: 'falling', recommendedPractice: 'rest', citationIds: ['panchanga-narada-purana'] },
  23: { index: 23, paksha: 'krishna', name: 'Ashtami', iast: 'Aṣṭamī', deity: 'Kalashtami', fastingClass: 'minor-fast', fastingName: 'Kalashtami', oneWordBenefit: 'Inner-fire', energy: 'falling', recommendedPractice: 'meditate', citationIds: ['panchanga-narada-purana'] },
  24: { index: 24, paksha: 'krishna', name: 'Navami', iast: 'Navamī', deity: 'Durga', fastingClass: 'neutral', oneWordBenefit: 'Quietude', energy: 'falling', recommendedPractice: 'reflect', citationIds: ['panchanga-narada-purana'] },
  25: { index: 25, paksha: 'krishna', name: 'Dashami', iast: 'Daśamī', deity: 'Yama', fastingClass: 'neutral', oneWordBenefit: 'Acceptance', energy: 'still', recommendedPractice: 'rest', citationIds: ['panchanga-narada-purana'] },
  26: { index: 26, paksha: 'krishna', name: 'Ekadashi', iast: 'Ekādaśī', deity: 'Vishnu', fastingClass: 'major-fast', fastingName: 'Ekadashi', oneWordBenefit: 'Clarity', energy: 'still', recommendedPractice: 'fast', citationIds: ['ekadashi-padma-purana', 'ekadashi-skanda-purana', 'autophagy-mizushima-2008'] },
  27: { index: 27, paksha: 'krishna', name: 'Dwadashi', iast: 'Dvādaśī', deity: 'Vishnu', fastingClass: 'observance', fastingName: 'Parana', oneWordBenefit: 'Release', energy: 'still', recommendedPractice: 'rest', citationIds: ['parana-hemadri-vrata-khanda'] },
  28: { index: 28, paksha: 'krishna', name: 'Trayodashi', iast: 'Trayodaśī', deity: 'Shiva', fastingClass: 'minor-fast', fastingName: 'Pradosh', oneWordBenefit: 'Surrender', energy: 'still', recommendedPractice: 'meditate', citationIds: ['pradosh-skanda-purana'] },
  29: { index: 29, paksha: 'krishna', name: 'Chaturdashi', iast: 'Caturdaśī', deity: 'Shiva', fastingClass: 'minor-fast', fastingName: 'Shivaratri', oneWordBenefit: 'Stillness', energy: 'still', recommendedPractice: 'meditate', citationIds: ['shivaratri-ishana-samhita'] },
  30: { index: 30, paksha: 'krishna', name: 'Amavasya', iast: 'Amāvasyā', deity: 'Pitru', fastingClass: 'observance', fastingName: 'Amavasya', oneWordBenefit: 'Reset', energy: 'still', recommendedPractice: 'rest', citationIds: ['amavasya-garuda-purana'] },
};

/** Lookup helper. Throws if `index` is out of range. */
export function getTithiMeta(index: number): TithiMeta {
  const meta = TITHI_META[index];
  if (!meta) throw new Error(`tithi index out of range: ${index}`);
  return meta;
}
