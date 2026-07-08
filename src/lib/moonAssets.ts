/**
 * Bundled per-tithi moon renders — 30 NASA SVS "Dial-A-Moon" frames
 * sampled across one lunation (see scripts/fetch-tithi-moons.mjs) and
 * shipped as local assets. Same-origin and offline-friendly: no runtime
 * dependency on NASA, no per-year gallery maintenance, and usable on a
 * canvas without tainting it.
 *
 * Imagery courtesy of NASA's Scientific Visualization Studio.
 */

const frames = import.meta.glob('../assets/moon/tithi/*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const byIndex = new Map<number, string>();
for (const [path, url] of Object.entries(frames)) {
  const m = path.match(/tithi-(\d{2})\.jpg$/);
  if (m) byIndex.set(parseInt(m[1], 10), url);
}

/** Asset URL for a tithi index (1..30), or null if out of range. */
export function tithiMoonUrl(index: number): string | null {
  return byIndex.get(Math.round(index)) ?? null;
}
