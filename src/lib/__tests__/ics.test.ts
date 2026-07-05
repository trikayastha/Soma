import { describe, it, expect } from 'vitest';
import { buildIcs, escapeText, foldLine, icsFilename } from '../ics';
import type { RemindersPrefs, SomaDay } from '../types';

const reminders: RemindersPrefs = {
  dayOfTime: '17:00',
  leadMinutes: 30,
  liveNotifications: false,
};

const sampleDay: SomaDay = {
  date: '2025-04-15',
  kind: 'ekadashi',
  intensityHours: 24,
  title: 'Shukla Ekadashi',
  tradition: 'vedic',
};

const fixedNow = new Date('2025-04-10T12:00:00Z');

describe('ics / escape and fold helpers', () => {
  it('escapes backslash, semicolon, comma, and newlines', () => {
    expect(escapeText('a;b,c\\d\ne')).toBe('a\\;b\\,c\\\\d\\ne');
  });

  it('leaves short lines untouched', () => {
    expect(foldLine('SUMMARY:Hello world')).toBe('SUMMARY:Hello world');
  });

  it('folds a long line with leading space continuations at 74 chars', () => {
    const long = 'DESCRIPTION:' + 'x'.repeat(200);
    const folded = foldLine(long);
    const lines = folded.split('\r\n');
    expect(lines.length).toBeGreaterThan(1);
    expect(lines[0].length).toBeLessThanOrEqual(75);
    for (let i = 1; i < lines.length; i++) {
      expect(lines[i].startsWith(' ')).toBe(true);
      expect(lines[i].length).toBeLessThanOrEqual(75);
    }
    // Reassembling should give back the original content.
    const reassembled = lines[0] + lines.slice(1).map((l) => l.slice(1)).join('');
    expect(reassembled).toBe(long);
  });
});

describe('ics / buildIcs core structure', () => {
  it('emits CRLF line endings', () => {
    const out = buildIcs({
      schedule: [sampleDay],
      reminders,
      timezone: 'America/New_York',
      now: fixedNow,
    });
    expect(out.includes('\r\n')).toBe(true);
    expect(out.endsWith('\r\n')).toBe(true);
    // No bare LFs.
    expect(out.split('').some((c, i) => c === '\n' && out[i - 1] !== '\r')).toBe(false);
  });

  it('contains the required VCALENDAR envelope', () => {
    const out = buildIcs({
      schedule: [sampleDay],
      reminders,
      timezone: 'America/New_York',
      now: fixedNow,
    });
    expect(out).toContain('BEGIN:VCALENDAR');
    expect(out).toContain('VERSION:2.0');
    expect(out).toContain('PRODID:-//Soma//Beta v0.1//EN');
    expect(out).toContain('END:VCALENDAR');
    expect(out).toContain('X-WR-TIMEZONE:America/New_York');
  });

  it('produces one VEVENT per SomaDay', () => {
    const days: SomaDay[] = [
      sampleDay,
      { ...sampleDay, date: '2025-04-20', kind: 'full-moon', title: 'Purnima — Full Moon' },
      { ...sampleDay, date: '2025-05-01', kind: 'new-moon', title: 'Amavasya — New Moon' },
    ];
    const out = buildIcs({ schedule: days, reminders, timezone: 'UTC', now: fixedNow });
    const vevents = out.match(/BEGIN:VEVENT/g)?.length ?? 0;
    expect(vevents).toBe(3);
  });

  it('emits a stable UID per (date, kind)', () => {
    const out = buildIcs({
      schedule: [sampleDay],
      reminders,
      timezone: 'UTC',
      now: fixedNow,
    });
    expect(out).toContain('UID:soma-2025-04-15-ekadashi@soma.app');
  });

  it('includes DTSTART/DTEND with the correct TZID', () => {
    const out = buildIcs({
      schedule: [sampleDay],
      reminders,
      timezone: 'America/New_York',
      now: fixedNow,
    });
    expect(out).toContain('DTSTART;TZID=America/New_York:20250415T170000');
    // 24h later
    expect(out).toContain('DTEND;TZID=America/New_York:20250416T170000');
  });

  it('computes DTEND for 16h and 12h intensities', () => {
    const out16 = buildIcs({
      schedule: [{ ...sampleDay, intensityHours: 16 }],
      reminders,
      timezone: 'UTC',
      now: fixedNow,
    });
    expect(out16).toContain('DTEND;TZID=UTC:20250416T090000');

    const out12 = buildIcs({
      schedule: [{ ...sampleDay, intensityHours: 12 }],
      reminders,
      timezone: 'UTC',
      now: fixedNow,
    });
    expect(out12).toContain('DTEND;TZID=UTC:20250416T050000');
  });

  it('uses the dayOfTime preference for DTSTART', () => {
    const out = buildIcs({
      schedule: [sampleDay],
      reminders: { ...reminders, dayOfTime: '08:30' },
      timezone: 'UTC',
      now: fixedNow,
    });
    expect(out).toContain('DTSTART;TZID=UTC:20250415T083000');
  });

  it('emits two VALARM blocks per event: lead-time + day-of', () => {
    const out = buildIcs({
      schedule: [sampleDay],
      reminders: { ...reminders, leadMinutes: 45 },
      timezone: 'UTC',
      now: fixedNow,
    });
    const alarms = out.match(/BEGIN:VALARM/g)?.length ?? 0;
    expect(alarms).toBe(2);
    expect(out).toContain('TRIGGER:PT0S');
    expect(out).toContain('TRIGGER:-PT45M');
    expect(out).toContain('DESCRIPTION:Soma fast in 45 minutes');
  });

  it('escapes the description text safely', () => {
    const out = buildIcs({
      schedule: [sampleDay],
      reminders,
      timezone: 'UTC',
      now: fixedNow,
    });
    // Descriptions should contain escaped \n and not raw newlines inside the line.
    expect(out).toContain('\\n');
  });

  it('DTSTAMP reflects the provided now', () => {
    const out = buildIcs({
      schedule: [sampleDay],
      reminders,
      timezone: 'UTC',
      now: new Date('2026-01-02T03:04:05Z'),
    });
    expect(out).toContain('DTSTAMP:20260102T030405Z');
  });
});

describe('ics / filename helper', () => {
  it('produces a stable dated filename', () => {
    expect(icsFilename(new Date('2025-04-15T00:00:00Z'))).toBe('soma-reminders-2025-04-15.ics');
  });
});
