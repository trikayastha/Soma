import type {
  CopyKey,
} from '../i18n/copy';
import type {
  NotificationPhilosophy,
  RemindersPrefs,
  SomaDay,
} from './types';

/**
 * Notification Philosophy — synthesizes a deduped schedule of in-app
 * notifications from the user's chosen volume tier.
 *
 *  - quiet (~2–3/month):    day-of major fasts only.
 *  - standard (~7–8/month): day-of + pre-fast lead-time.
 *  - detailed (~15–19/month): adds parana, sunrise tithi handoff for
 *                             ekadashi, pradosh, sankashti, shivaratri,
 *                             and an evening reflection ping.
 *
 * Dedupe rule: at most one notification of each (kind, dayDate) pair.
 * Ties are resolved by the order of the inputs — first wins.
 *
 * The output is a pure data structure (no side-effects). The caller —
 * usually `scheduleLiveReminders` — turns each entry into a real
 * `setTimeout`-backed Notification.
 */

export type NotificationKind =
  | 'day-of'
  | 'pre-fast'
  | 'parana'
  | 'tithi-sunrise'
  | 'pradosh'
  | 'sankashti'
  | 'shivaratri'
  | 'reflection';

/** Single, time-stamped notification entry. */
export interface ScheduledNotification {
  /** ISO 8601 absolute instant. */
  at: string;
  /** ISO yyyy-mm-dd of the SomaDay this notification belongs to. */
  dayDate: string;
  kind: NotificationKind;
  /** Voice copy key — caller resolves through `useVoice`. */
  copyKey: CopyKey;
  /** Optional phrase substitution tokens (for `{minutes}`, `{tithi}`, …). */
  tokens?: Record<string, string | number>;
}

/** The major-fast kinds that always trigger at least a day-of ping. */
const MAJOR_FASTS: ReadonlySet<SomaDay['kind']> = new Set([
  'ekadashi',
  'full-moon',
  'new-moon',
  'shivaratri',
]);

/**
 * Build the notification schedule for a single SomaDay given a philosophy
 * tier and the user's reminder preferences.
 *
 * Pure: deterministic given inputs. No I/O, no Notification API calls.
 */
export function notificationsForDay(
  day: SomaDay,
  philosophy: NotificationPhilosophy,
  prefs: RemindersPrefs,
): ScheduledNotification[] {
  const out: ScheduledNotification[] = [];
  const dayOfAt = computeDayOfInstant(day.date, prefs.dayOfTime);

  // Tier: quiet — only major-fast day-of.
  if (MAJOR_FASTS.has(day.kind)) {
    out.push({
      at: dayOfAt.toISOString(),
      dayDate: day.date,
      kind: 'day-of',
      copyKey: copyKeyForDayOf(day.kind),
    });
  }

  if (philosophy === 'quiet') return dedupe(out);

  // Tier: standard — adds pre-fast lead time on every fast day.
  const leadAt = new Date(dayOfAt.getTime() - prefs.leadMinutes * 60_000);
  out.push({
    at: leadAt.toISOString(),
    dayDate: day.date,
    kind: 'pre-fast',
    copyKey: 'notif.prefast',
    tokens: { minutes: prefs.leadMinutes },
  });

  if (philosophy === 'standard') return dedupe(out);

  // Tier: detailed — adds tithi-sunrise, parana (next day), pradosh,
  // sankashti, shivaratri-specific cue, and an evening reflection.
  if (day.sunriseAt) {
    out.push({
      at: day.sunriseAt,
      dayDate: day.date,
      kind: 'tithi-sunrise',
      copyKey: 'notif.tithi.sunrise',
      tokens: { tithi: day.tithi?.name ?? day.title },
    });
  }
  if (day.kind === 'ekadashi') {
    // Parana window opens at sunrise of the *next* civil day.
    const paranaAt = nextDaySunrise(day);
    out.push({
      at: paranaAt.toISOString(),
      dayDate: day.date,
      kind: 'parana',
      copyKey: 'notif.parana',
      tokens: {
        start: formatLocalTime(paranaAt),
        end: formatLocalTime(new Date(paranaAt.getTime() + 90 * 60_000)),
      },
    });
  }
  if (day.kind === 'pradosh') {
    out.push({
      at: dayOfAt.toISOString(),
      dayDate: day.date,
      kind: 'pradosh',
      copyKey: 'notif.pradosh.evening',
    });
  }
  if (day.kind === 'sankashti-chaturthi') {
    out.push({
      at: dayOfAt.toISOString(),
      dayDate: day.date,
      kind: 'sankashti',
      copyKey: 'notif.sankashti',
    });
  }
  if (day.kind === 'shivaratri') {
    out.push({
      at: dayOfAt.toISOString(),
      dayDate: day.date,
      kind: 'shivaratri',
      copyKey: 'notif.shivaratri',
    });
  }
  // Evening reflection — 3h after the day-of trigger.
  const reflectAt = new Date(dayOfAt.getTime() + 3 * 3600_000);
  out.push({
    at: reflectAt.toISOString(),
    dayDate: day.date,
    kind: 'reflection',
    copyKey: 'notif.reflection',
  });

  return dedupe(out);
}

/**
 * Build the full philosophy-driven schedule for a horizon of SomaDays.
 * Caller is responsible for trimming to the live 24h window.
 */
export function buildPhilosophySchedule(
  schedule: SomaDay[],
  philosophy: NotificationPhilosophy,
  prefs: RemindersPrefs,
): ScheduledNotification[] {
  const all: ScheduledNotification[] = [];
  for (const day of schedule) {
    all.push(...notificationsForDay(day, philosophy, prefs));
  }
  return dedupe(all);
}

/* -------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------*/

function copyKeyForDayOf(kind: SomaDay['kind']): CopyKey {
  switch (kind) {
    case 'ekadashi':
      return 'notif.ekadashi.morning';
    case 'shivaratri':
      return 'notif.shivaratri';
    case 'pradosh':
      return 'notif.pradosh.evening';
    case 'sankashti-chaturthi':
      return 'notif.sankashti';
    default:
      return 'notif.prefast';
  }
}

function computeDayOfInstant(dateIso: string, hhmm: string): Date {
  const [hh, mm] = hhmm.split(':').map((n) => parseInt(n, 10));
  const [y, mo, d] = dateIso.split('-').map((n) => parseInt(n, 10));
  return new Date(y, mo - 1, d, hh, mm, 0, 0);
}

function nextDaySunrise(day: SomaDay): Date {
  // If the day has a recorded sunrise, advance by 24h. Otherwise use a
  // safe 06:00 fallback on the next civil day.
  if (day.sunriseAt) {
    return new Date(new Date(day.sunriseAt).getTime() + 24 * 3600_000);
  }
  const [y, mo, d] = day.date.split('-').map((n) => parseInt(n, 10));
  return new Date(y, mo - 1, d + 1, 6, 0, 0, 0);
}

function formatLocalTime(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** Remove duplicates: same (kind, dayDate) pair — first wins. */
function dedupe(entries: ScheduledNotification[]): ScheduledNotification[] {
  const seen = new Set<string>();
  const out: ScheduledNotification[] = [];
  for (const e of entries) {
    const key = `${e.kind}.${e.dayDate}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out.sort((a, b) => a.at.localeCompare(b.at));
}
