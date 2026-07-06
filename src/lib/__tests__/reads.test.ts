import { describe, expect, it } from 'vitest';
import { READS, READ_KINDS } from '../data/reads';
import { getCitation } from '../citations';

describe('reads library', () => {
  it('exposes a non-empty, uniquely-keyed set of reads', () => {
    expect(READS.length).toBeGreaterThan(0);
    const ids = READS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only uses declared read kinds', () => {
    for (const read of READS) {
      expect(READ_KINDS).toContain(read.kind);
    }
  });

  it('resolves every citationId that a read references', () => {
    for (const read of READS) {
      if (read.citationId) {
        expect(getCitation(read.citationId)).not.toBeNull();
      }
    }
  });

  it('keeps the non-medical-claims caution pinned', () => {
    const caution = READS.find((r) => r.kind === 'Caution');
    expect(caution).toBeDefined();
    expect(caution?.body).toMatch(/not make medical claims/i);
  });
});
