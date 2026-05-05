import type { RemindersPrefs, SomaDay } from './types';
import { getWhyCopy } from './whyThisDay';

/**
 * Minimal RFC 5545 iCalendar generator for Soma Days.
 *
 * We intentionally emit a flat, timezone-floating event set (DTSTART with
 * TZID param and a separate VTIMEZONE-less document) because:
 *  - The beta target calendars (Apple, Google, Outlook) all understand
 *    DTSTART;TZID with a well-known IANA zone name.
 *  - We do not ship a VTIMEZONE block — a full one with DST transitions is
 *    hundreds of lines per zone, and every real calendar app already has
 *    the zone database. This keeps the file small (~1 KB per event).
 *
 * All output uses CRLF line endings (`\r\n`) and long-line folding at 73
 * octets per RFC 5545 §3.1 (one octet short of 75 to account for the
 * leading space on continuation lines).
 */

const CRLF = '\r\n';

export interface BuildIcsInput {
  schedule: SomaDay[];
  reminders: RemindersPrefs;
  timezone: string; // IANA zone e.g. "America/New_York"
  /** Used for DTSTAMP — defaults to now, exposed for deterministic tests. */
  now?: Date;
}

export function buildIcs(input: BuildIcsInput): string {
  const { schedule, reminders, timezone } = input;
  const dtstamp = toUtcBasic(input.now ?? new Date());

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Soma//Beta v0.1//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Soma — Lunar fasts',
    'X-WR-TIMEZONE:' + timezone,
  ];

  for (const day of schedule) {
    lines.push(...buildVevent(day, reminders, timezone, dtstamp));
  }

  lines.push('END:VCALENDAR');

  return lines.map(foldLine).join(CRLF) + CRLF;
}

function buildVevent(
  day: SomaDay,
  reminders: RemindersPrefs,
  timezone: string,
  dtstamp: string,
): string[] {
  const start = toLocalBasic(day.date, reminders.dayOfTime);
  const end = addHoursLocal(start, day.intensityHours);
  const uid = `soma-${day.date}-${day.kind}@soma.app`;
  const summary = `Soma — ${day.title} (${day.intensityHours}h fast)`;
  const why = getWhyCopy(day.kind);
  const parts = [
    `A ${day.intensityHours}-hour lunar-aligned fast paired with a 10-minute meditation.`,
    `Why this day: ${why.plain}`,
  ];
  if (day.sunriseAt) {
    parts.push(
      `Computed at sunrise (${day.sunriseAt}) — source: astronomy-engine.`,
    );
  }
  if (day.kind === 'ekadashi' && day.ekadashiName) {
    parts.push(`Named: ${day.ekadashiName} Ekadashi.`);
  }
  const description = escapeText(parts.join('\n'));

  return [
    'BEGIN:VEVENT',
    'UID:' + uid,
    'DTSTAMP:' + dtstamp,
    `DTSTART;TZID=${timezone}:${start}`,
    `DTEND;TZID=${timezone}:${end}`,
    'SUMMARY:' + escapeText(summary),
    'DESCRIPTION:' + description,
    // Day-of alarm — fires when the fast begins
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Soma fast begins now',
    'TRIGGER:PT0S',
    'END:VALARM',
    // Lead-time alarm
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:Soma fast in ${reminders.leadMinutes} minutes`,
    `TRIGGER:-PT${reminders.leadMinutes}M`,
    'END:VALARM',
    'END:VEVENT',
  ];
}

/** yyyymmddTHHmmss (no Z) for local TZID events. */
function toLocalBasic(dateIso: string, hhmm: string): string {
  const [y, m, d] = dateIso.split('-');
  const [hh, mm] = hhmm.split(':');
  return `${y}${m}${d}T${pad2(hh)}${pad2(mm)}00`;
}

function addHoursLocal(basic: string, hours: number): string {
  // basic: yyyymmddTHHmmss
  const y = parseInt(basic.slice(0, 4), 10);
  const mo = parseInt(basic.slice(4, 6), 10) - 1;
  const d = parseInt(basic.slice(6, 8), 10);
  const hh = parseInt(basic.slice(9, 11), 10);
  const mm = parseInt(basic.slice(11, 13), 10);
  const ss = parseInt(basic.slice(13, 15), 10);
  const asDate = new Date(Date.UTC(y, mo, d, hh, mm, ss));
  asDate.setUTCHours(asDate.getUTCHours() + hours);
  const py = asDate.getUTCFullYear();
  const pmo = asDate.getUTCMonth() + 1;
  const pd = asDate.getUTCDate();
  const ph = asDate.getUTCHours();
  const pm = asDate.getUTCMinutes();
  const ps = asDate.getUTCSeconds();
  return `${py}${pad2(pmo)}${pad2(pd)}T${pad2(ph)}${pad2(pm)}${pad2(ps)}`;
}

/** yyyymmddTHHmmssZ — UTC basic format. */
function toUtcBasic(d: Date): string {
  const y = d.getUTCFullYear();
  const mo = d.getUTCMonth() + 1;
  const da = d.getUTCDate();
  const h = d.getUTCHours();
  const mi = d.getUTCMinutes();
  const s = d.getUTCSeconds();
  return `${y}${pad2(mo)}${pad2(da)}T${pad2(h)}${pad2(mi)}${pad2(s)}Z`;
}

function pad2(n: number | string): string {
  return String(n).padStart(2, '0');
}

/** Escape iCalendar text per RFC 5545 §3.3.11. */
export function escapeText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Fold a long content line per RFC 5545 §3.1. Lines longer than 75 octets
 * (we use 73 to leave room for CR and the continuation space) are split and
 * continued with a leading single space.
 */
export function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let i = 0;
  // First chunk: 75 chars max.
  chunks.push(line.slice(i, i + 75));
  i += 75;
  // Continuation chunks: 74 chars max because each is prefixed with a space.
  while (i < line.length) {
    chunks.push(' ' + line.slice(i, i + 74));
    i += 74;
  }
  return chunks.join(CRLF);
}

/** Suggest a filename for the download based on the current date. */
export function icsFilename(now: Date = new Date()): string {
  const d = now.toISOString().slice(0, 10);
  return `soma-reminders-${d}.ics`;
}
