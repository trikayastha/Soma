import { describe, it, expect } from 'vitest';
import {
  SEED_CITIES,
  customCity,
  findCityBySlug,
  searchCities,
  slugify,
} from '../cities';

describe('cities / SEED_CITIES', () => {
  it('contains exactly 30 entries', () => {
    expect(SEED_CITIES).toHaveLength(30);
  });

  it('has unique slugs', () => {
    const slugs = new Set(SEED_CITIES.map((c) => c.slug));
    expect(slugs.size).toBe(SEED_CITIES.length);
  });

  it('every city has plausible lat/lon and an IANA tz', () => {
    for (const c of SEED_CITIES) {
      expect(c.lat).toBeGreaterThanOrEqual(-90);
      expect(c.lat).toBeLessThanOrEqual(90);
      expect(c.lon).toBeGreaterThanOrEqual(-180);
      expect(c.lon).toBeLessThanOrEqual(180);
      expect(c.tz).toMatch(/\//);
      expect(c.countryCode).toMatch(/^[A-Z]{2}$/);
    }
  });
});

describe('cities / findCityBySlug', () => {
  it('returns Varanasi for "varanasi"', () => {
    const c = findCityBySlug('varanasi');
    expect(c?.label).toBe('Varanasi');
  });

  it('is case-insensitive', () => {
    expect(findCityBySlug('KATHMANDU')?.label).toBe('Kathmandu');
  });

  it('returns null for unknown slug', () => {
    expect(findCityBySlug('atlantis')).toBeNull();
  });
});

describe('cities / searchCities', () => {
  it('returns Varanasi first for "var"', () => {
    const results = searchCities('var');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].slug).toBe('varanasi');
  });

  it('matches case-insensitively', () => {
    const results = searchCities('LONDON');
    expect(results[0].slug).toBe('london');
  });

  it('respects the limit parameter', () => {
    const results = searchCities('a', 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('returns first N seed entries on empty query', () => {
    const results = searchCities('', 5);
    expect(results).toHaveLength(5);
  });

  it('prefix matches outrank substring matches', () => {
    // "san" prefix-matches San Francisco and substring-matches none of the
    // other seeds — assert San Francisco appears first.
    const results = searchCities('san');
    expect(results[0].slug).toBe('san-francisco');
  });

  it('returns empty array for no match', () => {
    expect(searchCities('zzzzzz')).toEqual([]);
  });
});

describe('cities / slugify', () => {
  it('lowercases and dashes a label', () => {
    expect(slugify('São Paulo')).toBe('s-o-paulo');
    expect(slugify('San Francisco')).toBe('san-francisco');
  });

  it('strips leading and trailing dashes', () => {
    expect(slugify('  hello  ')).toBe('hello');
  });
});

describe('cities / customCity', () => {
  it('builds a deterministic slug from the label', () => {
    const c = customCity('Varanasi', 25.3176, 82.9739, 'Asia/Kolkata');
    expect(c.slug).toBe('varanasi');
    expect(c.countryCode).toBe('XX');
  });

  it('falls back to coords when label is empty', () => {
    const c = customCity('', 25.3176, 82.9739, 'Asia/Kolkata');
    expect(c.slug).toMatch(/25-32/);
  });
});
