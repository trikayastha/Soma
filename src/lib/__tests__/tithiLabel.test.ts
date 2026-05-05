import { describe, it, expect } from 'vitest';
import { formatTithiLabel } from '../tithiLabel';
import type { Tithi } from '../tithi';

const sample: Tithi = {
  index: 11,
  indexInPaksha: 11,
  paksha: 'shukla',
  name: 'Ekadashi',
  fraction: 0.5,
};

describe('formatTithiLabel', () => {
  it('default (performance) puts Lunar Day first', () => {
    expect(formatTithiLabel(sample, 'performance')).toBe(
      'Lunar Day 11 · Ekadashi',
    );
  });

  it('devotional reverses order', () => {
    expect(formatTithiLabel(sample, 'devotional')).toBe(
      'Ekadashi · Lunar Day 11',
    );
  });

  it('minimal drops the Lunar Day prefix', () => {
    expect(formatTithiLabel(sample, 'minimal')).toBe('Ekadashi');
  });

  it('appends benefit when provided', () => {
    expect(formatTithiLabel(sample, 'performance', 'Clarity')).toBe(
      'Lunar Day 11 · Ekadashi · Clarity',
    );
    expect(formatTithiLabel(sample, 'devotional', 'Clarity')).toBe(
      'Ekadashi · Lunar Day 11 · Clarity',
    );
    expect(formatTithiLabel(sample, 'minimal', 'Clarity')).toBe(
      'Ekadashi · Clarity',
    );
  });

  it('omits empty/whitespace benefit', () => {
    expect(formatTithiLabel(sample, 'performance', '   ')).toBe(
      'Lunar Day 11 · Ekadashi',
    );
    expect(formatTithiLabel(sample, 'performance', '')).toBe(
      'Lunar Day 11 · Ekadashi',
    );
  });
});
