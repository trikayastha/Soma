/**
 * Compute upcoming Hindu lunar fasts from astronomy-engine (the app's own
 * dependency). No LLM date-guessing — the tithi is derived from the real
 * Sun–Moon elongation (MoonPhase 0..360°).
 *
 *   tithi index = floor(phase / 12)  (0..29)   →   tithi number = index + 1
 *   Ekadashi  = tithi 11 (Shukla) or 26 (Krishna)
 *   Pradosh   = tithi 13 or 28   ·  Purnima = tithi 15  ·  Amavasya = tithi 30
 *
 * Observance date uses the common sunrise rule: the fast is kept on the solar
 * day whose sunrise (~06:00 IST) falls inside the tithi. Reported in IST, since
 * these are Indian-subcontinent observances. Location-exact dates resolve in-app.
 *
 * Usage: node compute-next-fasts.mjs
 */
import { MoonPhase } from 'astronomy-engine';

const IST_OFFSET_MS = 5.5 * 3600_000;
const DAY_MS = 86_400_000;

const tithiNum = (d) => Math.floor(MoonPhase(d) / 12) + 1; // 1..30
const paksha = (d) => (MoonPhase(d) < 180 ? 'Shukla' : 'Krishna');

// Sunrise proxy: 06:00 IST = 00:30 UTC.
function sunriseUTC(istDayStartMs) {
  return new Date(istDayStartMs - IST_OFFSET_MS + 6 * 3600_000);
}
const istDateLabel = (istDayStartMs) =>
  new Date(istDayStartMs).toISOString().slice(0, 10);
const istWeekday = (istDayStartMs) =>
  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(istDayStartMs).getUTCDay()];

const FASTS = {
  Ekadashi: (t) => t === 11 || t === 26,
  Pradosh: (t) => t === 13 || t === 28,
  Purnima: (t) => t === 15,
  Amavasya: (t) => t === 30,
};

const nowIstDayStart = Math.floor((Date.now() + IST_OFFSET_MS) / DAY_MS) * DAY_MS;
const found = {};

for (let k = 0; k < 120 && Object.keys(found).length < 4; k++) {
  const istDayStart = nowIstDayStart + k * DAY_MS;
  const sr = sunriseUTC(istDayStart);
  if (sr.getTime() < Date.now()) continue; // only future observances
  const t = tithiNum(sr);
  for (const [name, test] of Object.entries(FASTS)) {
    if (!found[name] && test(t)) {
      found[name] = {
        date: istDateLabel(istDayStart),
        weekday: istWeekday(istDayStart),
        paksha: paksha(sr),
        tithi: t,
      };
    }
  }
}

console.log('Upcoming fasts (IST, sunrise rule):\n');
for (const [name, f] of Object.entries(found)) {
  console.log(`  ${name.padEnd(9)} ${f.date} (${f.weekday}) · ${f.paksha} paksha · tithi ${f.tithi}`);
}
console.log('\nJSON:', JSON.stringify(found));
