import { describe, expect, it } from 'vitest';
import { describeTithi, tithiNameGloss } from '../describeTithi';

describe('describeTithi', () => {
  it('anchors early waxing tithis to the new moon', () => {
    expect(describeTithi(1).landmark).toBe('1 night after the new moon');
    expect(describeTithi(5).landmark).toBe('5 nights after the new moon');
    expect(describeTithi(7).landmark).toBe('7 nights after the new moon');
  });

  it('anchors late waxing tithis to the coming full moon', () => {
    expect(describeTithi(8).landmark).toBe('7 nights until the full moon');
    expect(describeTithi(11).landmark).toBe('4 nights until the full moon');
    expect(describeTithi(14).landmark).toBe('Full moon tomorrow night');
  });

  it('names the landmark nights themselves', () => {
    expect(describeTithi(15).landmark).toBe('Full moon tonight');
    expect(describeTithi(30).landmark).toBe('New moon tonight');
  });

  it('anchors waning tithis to the full moon, then the coming new moon', () => {
    expect(describeTithi(16).landmark).toBe('1 night after the full moon');
    expect(describeTithi(19).landmark).toBe('4 nights after the full moon');
    expect(describeTithi(22).landmark).toBe('7 nights after the full moon');
    expect(describeTithi(25).landmark).toBe('5 nights until the new moon');
    expect(describeTithi(29).landmark).toBe('New moon tomorrow night');
  });

  it('translates the fasting class into a plain practice clause', () => {
    expect(describeTithi(11).practice).toBe('a traditional fasting day'); // Ekadashi
    expect(describeTithi(19).practice).toBe('a gentle fasting day'); // Sankashti
    expect(describeTithi(15).practice).toBe('a traditional observance'); // Purnima
    expect(describeTithi(3).practice).toBe('an auspicious day'); // Akshaya Tritiya
    expect(describeTithi(2).practice).toBe('a rest day');
  });

  it('glosses tithi names into plain ordinals', () => {
    expect(tithiNameGloss('Ekadashi')).toBe('the eleventh');
    expect(tithiNameGloss('Purnima')).toBe('the full-moon night');
    expect(tithiNameGloss('NotATithi')).toBeNull();
  });
});
