import { describe, it, expect } from 'vitest';
import { CITATIONS, citationIds, getCitation } from '../citations';
import { TITHI_META } from '../tithiMeta';

describe('citations / registry', () => {
  it('contains at least 30 entries split across studies + traditions', () => {
    const ids = citationIds();
    expect(ids.length).toBeGreaterThanOrEqual(30);
    const studies = ids.filter((id) => CITATIONS[id].type === 'study');
    const traditions = ids.filter((id) => CITATIONS[id].type === 'tradition');
    expect(studies.length).toBeGreaterThanOrEqual(15);
    expect(traditions.length).toBeGreaterThanOrEqual(15);
  });

  it('every entry has non-empty title, summary (≤140 chars), and url', () => {
    for (const c of Object.values(CITATIONS)) {
      expect(c.title.length).toBeGreaterThan(0);
      expect(c.summary.length).toBeGreaterThan(0);
      expect(c.summary.length).toBeLessThanOrEqual(140);
      expect(c.url).toMatch(/^https?:\/\//);
    }
  });

  it('id field matches the map key', () => {
    for (const [key, c] of Object.entries(CITATIONS)) {
      expect(c.id).toBe(key);
    }
  });
});

describe('citations / getCitation', () => {
  it('returns the entry for a known id', () => {
    const c = getCitation('autophagy-mizushima-2008');
    expect(c).not.toBeNull();
    expect(c!.year).toBe(2008);
  });

  it('returns null for unknown ids', () => {
    expect(getCitation('does-not-exist')).toBeNull();
  });
});

describe('citations / TithiMeta integrity', () => {
  it('every TithiMeta.citationIds resolves to a citation', () => {
    for (let i = 1; i <= 30; i++) {
      const meta = TITHI_META[i];
      for (const id of meta.citationIds) {
        const c = getCitation(id);
        expect(c, `tithi ${i} cites unknown id "${id}"`).not.toBeNull();
      }
    }
  });
});
