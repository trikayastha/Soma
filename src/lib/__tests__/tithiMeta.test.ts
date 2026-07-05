import { describe, it, expect } from 'vitest';
import { TITHI_META, getTithiMeta } from '../tithiMeta';

describe('tithiMeta / TITHI_META', () => {
  it('contains exactly 30 entries indexed 1..30', () => {
    const keys = Object.keys(TITHI_META).map(Number).sort((a, b) => a - b);
    expect(keys).toHaveLength(30);
    expect(keys[0]).toBe(1);
    expect(keys[29]).toBe(30);
  });

  it('every entry has non-empty name, iast, deity, oneWordBenefit', () => {
    for (let i = 1; i <= 30; i++) {
      const m = TITHI_META[i];
      expect(m.name.length).toBeGreaterThan(0);
      expect(m.iast.length).toBeGreaterThan(0);
      expect(m.deity.length).toBeGreaterThan(0);
      expect(m.oneWordBenefit.length).toBeGreaterThan(0);
      expect(m.citationIds.length).toBeGreaterThan(0);
    }
  });

  it('paksha is shukla for 1..15 and krishna for 16..30', () => {
    for (let i = 1; i <= 15; i++) expect(TITHI_META[i].paksha).toBe('shukla');
    for (let i = 16; i <= 30; i++) expect(TITHI_META[i].paksha).toBe('krishna');
  });

  it('Shukla Ekadashi (11) is a major-fast for Vishnu with practice=fast', () => {
    const m = TITHI_META[11];
    expect(m.fastingClass).toBe('major-fast');
    expect(m.deity).toBe('Vishnu');
    expect(m.recommendedPractice).toBe('fast');
  });

  it('Krishna Ekadashi (26) is a major-fast for Vishnu', () => {
    const m = TITHI_META[26];
    expect(m.fastingClass).toBe('major-fast');
    expect(m.deity).toBe('Vishnu');
  });

  it('Purnima (15) and Amavasya (30) are observances', () => {
    expect(TITHI_META[15].fastingClass).toBe('observance');
    expect(TITHI_META[15].name).toBe('Purnima');
    expect(TITHI_META[30].fastingClass).toBe('observance');
    expect(TITHI_META[30].name).toBe('Amavasya');
  });

  it('Pradosh Trayodashi (13, 28) maps to Shiva minor-fast', () => {
    expect(TITHI_META[13].fastingName).toBe('Pradosh');
    expect(TITHI_META[28].fastingName).toBe('Pradosh');
    expect(TITHI_META[13].deity).toBe('Shiva');
  });

  it('Krishna Chaturthi (19) is Sankashti', () => {
    expect(TITHI_META[19].fastingName).toBe('Sankashti Chaturthi');
    expect(TITHI_META[19].deity).toBe('Ganesha');
  });

  it('Krishna Chaturdashi (29) is Shivaratri', () => {
    expect(TITHI_META[29].fastingName).toBe('Shivaratri');
  });
});

describe('tithiMeta / getTithiMeta', () => {
  it('returns the same object as TITHI_META[i] for valid index', () => {
    expect(getTithiMeta(11)).toBe(TITHI_META[11]);
  });

  it('throws on out-of-range index', () => {
    expect(() => getTithiMeta(0)).toThrow();
    expect(() => getTithiMeta(31)).toThrow();
    expect(() => getTithiMeta(-1)).toThrow();
  });
});
