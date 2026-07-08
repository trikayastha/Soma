import { describe, expect, it } from 'vitest';
import { tithiMoonUrl } from '../moonAssets';

describe('tithiMoonUrl', () => {
  it('maps every tithi index 1..30 to a bundled frame', () => {
    for (let k = 1; k <= 30; k++) {
      const url = tithiMoonUrl(k);
      expect(url, `tithi ${k}`).toBeTruthy();
      expect(url).toContain(`tithi-${String(k).padStart(2, '0')}`);
    }
  });

  it('returns null outside the 1..30 range', () => {
    expect(tithiMoonUrl(0)).toBeNull();
    expect(tithiMoonUrl(31)).toBeNull();
  });
});
