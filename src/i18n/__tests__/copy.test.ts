import { describe, it, expect } from 'vitest';
import { COPY, COPY_KEYS, t, tFormat, type CopyEntry } from '../copy';
import { VOICE_IDS } from '../voices';

describe('COPY catalog', () => {
  it('has every voice populated for every key', () => {
    for (const key of COPY_KEYS) {
      const entry = COPY[key];
      for (const voice of VOICE_IDS) {
        const value = entry[voice as keyof CopyEntry];
        expect(value, `${key} / ${voice} must be a non-empty string`).toBeTypeOf(
          'string',
        );
        expect(value.length, `${key} / ${voice} must be non-empty`).toBeGreaterThan(
          0,
        );
      }
    }
  });

  it('exports the expected number of keys (≥25 for S1)', () => {
    expect(COPY_KEYS.length).toBeGreaterThanOrEqual(25);
  });

  it('contains no duplicate keys', () => {
    expect(new Set(COPY_KEYS).size).toBe(COPY_KEYS.length);
  });
});

describe('t()', () => {
  it('returns the coach voice by default for known key', () => {
    expect(t('fast.start.cta', 'coach')).toBe('Begin fast');
  });

  it('returns the scientific variant', () => {
    expect(t('fast.start.cta', 'scientific')).toBe('Begin protocol');
  });

  it('returns the traditional variant', () => {
    expect(t('fast.start.cta', 'traditional')).toBe('Begin vrat');
  });
});

describe('tFormat()', () => {
  it('substitutes a single token', () => {
    expect(tFormat('fast.timer.label', 'coach', { hours: 16 })).toBe(
      'Fasting · 16h',
    );
  });

  it('substitutes a percent token', () => {
    expect(tFormat('fast.progress.label', 'coach', { percent: 42 })).toBe(
      '42% complete',
    );
  });

  it('leaves unknown tokens untouched', () => {
    expect(tFormat('fast.timer.label', 'coach', {})).toBe('Fasting · {hours}h');
  });

  it('respects voice when substituting', () => {
    expect(tFormat('fast.timer.label', 'traditional', { hours: 24 })).toBe(
      'Upavasa · 24 ghanta',
    );
  });
});
