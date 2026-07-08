/**
 * One-off fetcher: downloads one NASA SVS "Dial-A-Moon" frame per tithi
 * (30 total) sampled across a single lunation, for bundling as local
 * assets in src/assets/moon/tithi/.
 *
 * Sampling: anchor on the new moon (via the API's `age` field), then take
 * each tithi's midpoint at age = (k - 0.5) * synodic/30. Equal-age slices
 * deviate from true 12°-elongation tithi bounds by at most a few degrees —
 * invisible at display size. The API logs each frame's illumination so the
 * sweep can be sanity-checked.
 *
 * Imagery courtesy of NASA's Scientific Visualization Studio.
 * Usage: node scripts/fetch-tithi-moons.mjs
 * Then:  for f in src/assets/moon/tithi/tithi-*.jpg; do sips -Z 512 "$f"; done
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const API = 'https://svs.gsfc.nasa.gov/api/dialamoon/';
const SYNODIC_DAYS = 29.530588;
const DAY_MS = 86_400_000;
const ANCHOR_PROBE = '2026-07-06T12:00';
const OUT_DIR = 'src/assets/moon/tithi';

function apiStamp(ms) {
  // API takes hour resolution: YYYY-MM-DDTHH:00
  return new Date(ms).toISOString().slice(0, 13) + ':00';
}

async function getJson(stamp) {
  const res = await fetch(API + stamp);
  if (!res.ok) throw new Error(`API ${stamp} → HTTP ${res.status}`);
  return res.json();
}

const probe = await getJson(ANCHOR_PROBE);
const newMoonMs = Date.parse(ANCHOR_PROBE + ':00Z') - probe.age * DAY_MS;
console.log(
  `Anchor new moon ≈ ${new Date(newMoonMs).toISOString()} (probe age ${probe.age}d)`,
);

await mkdir(OUT_DIR, { recursive: true });

for (let k = 1; k <= 30; k++) {
  const midMs = newMoonMs + (k - 0.5) * (SYNODIC_DAYS / 30) * DAY_MS;
  const stamp = apiStamp(midMs);
  const data = await getJson(stamp);
  const imgRes = await fetch(data.image.url);
  if (!imgRes.ok) throw new Error(`image ${data.image.url} → ${imgRes.status}`);
  const file = path.join(OUT_DIR, `tithi-${String(k).padStart(2, '0')}.jpg`);
  await writeFile(file, Buffer.from(await imgRes.arrayBuffer()));
  console.log(
    `tithi ${String(k).padStart(2, ' ')} · ${stamp} · illum ${data.phase}% · age ${data.age}d → ${file}`,
  );
}
console.log('Done.');
