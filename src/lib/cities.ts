import type { City } from './types';

/**
 * Curated city seed for sunrise-anchored tithi computation. The 30 inline
 * entries cover dharma-tradition population centers + global diaspora hubs.
 *
 * The remaining ~170 cities live in `data/cities.json` and are loaded lazily
 * by {@link searchCities} when a query is non-trivial. Keeping them out of
 * the inline bundle keeps the initial JS payload small.
 */
export const SEED_CITIES: readonly City[] = [
  { slug: 'varanasi', label: 'Varanasi', lat: 25.3176, lon: 82.9739, tz: 'Asia/Kolkata', countryCode: 'IN' },
  { slug: 'delhi', label: 'Delhi', lat: 28.6139, lon: 77.209, tz: 'Asia/Kolkata', countryCode: 'IN' },
  { slug: 'mumbai', label: 'Mumbai', lat: 19.076, lon: 72.8777, tz: 'Asia/Kolkata', countryCode: 'IN' },
  { slug: 'bengaluru', label: 'Bengaluru', lat: 12.9716, lon: 77.5946, tz: 'Asia/Kolkata', countryCode: 'IN' },
  { slug: 'chennai', label: 'Chennai', lat: 13.0827, lon: 80.2707, tz: 'Asia/Kolkata', countryCode: 'IN' },
  { slug: 'kolkata', label: 'Kolkata', lat: 22.5726, lon: 88.3639, tz: 'Asia/Kolkata', countryCode: 'IN' },
  { slug: 'hyderabad', label: 'Hyderabad', lat: 17.385, lon: 78.4867, tz: 'Asia/Kolkata', countryCode: 'IN' },
  { slug: 'ahmedabad', label: 'Ahmedabad', lat: 23.0225, lon: 72.5714, tz: 'Asia/Kolkata', countryCode: 'IN' },
  { slug: 'pune', label: 'Pune', lat: 18.5204, lon: 73.8567, tz: 'Asia/Kolkata', countryCode: 'IN' },
  { slug: 'jaipur', label: 'Jaipur', lat: 26.9124, lon: 75.7873, tz: 'Asia/Kolkata', countryCode: 'IN' },
  { slug: 'kathmandu', label: 'Kathmandu', lat: 27.7172, lon: 85.324, tz: 'Asia/Kathmandu', countryCode: 'NP' },
  { slug: 'colombo', label: 'Colombo', lat: 6.9271, lon: 79.8612, tz: 'Asia/Colombo', countryCode: 'LK' },
  { slug: 'dhaka', label: 'Dhaka', lat: 23.8103, lon: 90.4125, tz: 'Asia/Dhaka', countryCode: 'BD' },
  { slug: 'singapore', label: 'Singapore', lat: 1.3521, lon: 103.8198, tz: 'Asia/Singapore', countryCode: 'SG' },
  { slug: 'dubai', label: 'Dubai', lat: 25.2048, lon: 55.2708, tz: 'Asia/Dubai', countryCode: 'AE' },
  { slug: 'london', label: 'London', lat: 51.5074, lon: -0.1278, tz: 'Europe/London', countryCode: 'GB' },
  { slug: 'new-york', label: 'New York', lat: 40.7128, lon: -74.006, tz: 'America/New_York', countryCode: 'US' },
  { slug: 'los-angeles', label: 'Los Angeles', lat: 34.0522, lon: -118.2437, tz: 'America/Los_Angeles', countryCode: 'US' },
  { slug: 'san-francisco', label: 'San Francisco', lat: 37.7749, lon: -122.4194, tz: 'America/Los_Angeles', countryCode: 'US' },
  { slug: 'chicago', label: 'Chicago', lat: 41.8781, lon: -87.6298, tz: 'America/Chicago', countryCode: 'US' },
  { slug: 'toronto', label: 'Toronto', lat: 43.6532, lon: -79.3832, tz: 'America/Toronto', countryCode: 'CA' },
  { slug: 'vancouver', label: 'Vancouver', lat: 49.2827, lon: -123.1207, tz: 'America/Vancouver', countryCode: 'CA' },
  { slug: 'sydney', label: 'Sydney', lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney', countryCode: 'AU' },
  { slug: 'melbourne', label: 'Melbourne', lat: -37.8136, lon: 144.9631, tz: 'Australia/Melbourne', countryCode: 'AU' },
  { slug: 'auckland', label: 'Auckland', lat: -36.8485, lon: 174.7633, tz: 'Pacific/Auckland', countryCode: 'NZ' },
  { slug: 'johannesburg', label: 'Johannesburg', lat: -26.2041, lon: 28.0473, tz: 'Africa/Johannesburg', countryCode: 'ZA' },
  { slug: 'nairobi', label: 'Nairobi', lat: -1.2921, lon: 36.8219, tz: 'Africa/Nairobi', countryCode: 'KE' },
  { slug: 'tokyo', label: 'Tokyo', lat: 35.6762, lon: 139.6503, tz: 'Asia/Tokyo', countryCode: 'JP' },
  { slug: 'hong-kong', label: 'Hong Kong', lat: 22.3193, lon: 114.1694, tz: 'Asia/Hong_Kong', countryCode: 'HK' },
  { slug: 'paris', label: 'Paris', lat: 48.8566, lon: 2.3522, tz: 'Europe/Paris', countryCode: 'FR' },
];

/** Find a seed city by slug. */
export function findCityBySlug(slug: string): City | null {
  const normalized = slug.toLowerCase();
  for (const c of SEED_CITIES) {
    if (c.slug === normalized) return c;
  }
  return null;
}

/**
 * Score-rank cities matching `query`. Prefix matches outrank substring
 * matches; ties broken by population (when present), then alphabetical label.
 *
 * Returns up to `limit` results. Empty/short queries return the first
 * `limit` seed cities for predictable autocomplete defaults.
 */
export function searchCities(query: string, limit = 8): City[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return SEED_CITIES.slice(0, limit);

  type Scored = { city: City; score: number };
  const scored: Scored[] = [];

  for (const c of SEED_CITIES) {
    const score = scoreCity(c, q);
    if (score > 0) scored.push({ city: c, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const popA = a.city.population ?? 0;
    const popB = b.city.population ?? 0;
    if (popB !== popA) return popB - popA;
    return a.city.label.localeCompare(b.city.label);
  });

  return scored.slice(0, limit).map((s) => s.city);
}

function scoreCity(c: City, q: string): number {
  const label = c.label.toLowerCase();
  const slug = c.slug.toLowerCase();
  if (label.startsWith(q) || slug.startsWith(q)) return 100;
  if (label.includes(q) || slug.includes(q)) return 50;
  return 0;
}

/**
 * Convert a free-text label and lat/lon into a {@link City} shape with a
 * deterministic slug. Used by the "use my coordinates" fallback path.
 */
export function customCity(
  label: string,
  lat: number,
  lon: number,
  tz: string,
  countryCode = 'XX',
): City {
  return {
    slug: slugify(label || `${lat.toFixed(2)}-${lon.toFixed(2)}`),
    label,
    lat,
    lon,
    tz,
    countryCode,
  };
}

/** Normalize a label to a URL-safe slug (a-z, 0-9, dashes). */
export function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
