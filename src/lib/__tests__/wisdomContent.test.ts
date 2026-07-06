import { describe, expect, it } from 'vitest';
import { resolveWisdom } from '../wisdomContent';
import type { SomaDayKind } from '../types';

const ALL_KINDS: SomaDayKind[] = [
  'ekadashi',
  'full-moon',
  'new-moon',
  'chaturthi',
  'pradosh',
  'sankashti-chaturthi',
  'shivaratri',
  'custom',
];

describe('resolveWisdom', () => {
  it('resolves every tithi index 1..30 for a generic day', () => {
    for (let i = 1; i <= 30; i += 1) {
      const w = resolveWisdom(i, null);
      expect(w.benefit.length).toBeGreaterThan(0);
      expect(w.line.length).toBeGreaterThan(0);
      expect(w.citationIds.length).toBeGreaterThan(0);
    }
  });

  it('uses the tithi one-word benefit on a generic (unscheduled) day', () => {
    // Index 15 = Purnima, oneWordBenefit "Fullness".
    const w = resolveWisdom(15, null);
    expect(w.benefit).toBe('Fullness');
  });

  it('uses the curated benefit + line for a scheduled kind', () => {
    // Ekadashi is index 11.
    const w = resolveWisdom(11, 'ekadashi');
    expect(w.benefit).toBe('Focus');
    expect(w.line).toMatch(/steadies the mind/i);
    expect(w.citationIds).toContain('ekadashi-padma-purana');
  });

  it('returns a curated payload for all scheduled kinds', () => {
    for (const kind of ALL_KINDS) {
      const w = resolveWisdom(11, kind);
      expect(w.benefit.length).toBeGreaterThan(0);
      expect(w.line.length).toBeGreaterThan(0);
    }
  });

  it('throws on an out-of-range tithi index', () => {
    expect(() => resolveWisdom(0, null)).toThrow();
    expect(() => resolveWisdom(31, null)).toThrow();
  });
});
