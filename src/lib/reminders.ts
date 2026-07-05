import type {
  NotificationPhilosophy,
  RemindersPrefs,
  SomaDay,
  UserProfile,
} from './types';
import { buildIcs, icsFilename } from './ics';
import { buildPhilosophySchedule } from './notificationPhilosophy';

/**
 * Reminders facade. Three responsibilities:
 *   1. Request browser notification permission on demand.
 *   2. Build and download an .ics file for the user's calendar app.
 *   3. Schedule in-session browser notifications via setTimeout.
 *
 * Everything is client-side. No backend, no service worker. The live
 * scheduler is best-effort — it only fires while the tab/PWA is open.
 */

export type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export function getPermissionState(): PermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as PermissionState;
}

export async function requestPermission(): Promise<PermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const res = await Notification.requestPermission();
  return res as PermissionState;
}

/**
 * Download an .ics file containing every Soma day in the schedule, with
 * lead-time and day-of VALARM triggers baked in. Uses the profile's stored
 * timezone but falls back to the browser's live zone if it looks stale.
 */
export function downloadIcs(profile: UserProfile, schedule: SomaDay[]): void {
  if (typeof document === 'undefined') return;
  const liveTz = safeLiveTimezone(profile.timezone);
  const content = buildIcs({
    schedule,
    reminders: profile.reminders,
    timezone: liveTz,
  });
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = icsFilename();
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function safeLiveTimezone(fallback: string): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Given a SomaDay and the user's RemindersPrefs, return the two absolute
 * Date targets for the lead-time reminder and the day-of reminder, computed
 * against the user's local timezone (the browser's current zone).
 */
export function computeReminderTimes(
  day: SomaDay,
  prefs: RemindersPrefs,
): { lead: Date; dayOf: Date } {
  const [hh, mm] = prefs.dayOfTime.split(':').map((n) => parseInt(n, 10));
  // Construct a local Date for that day at hh:mm.
  const [y, mo, d] = day.date.split('-').map((n) => parseInt(n, 10));
  const dayOf = new Date(y, mo - 1, d, hh, mm, 0, 0);
  const lead = new Date(dayOf.getTime() - prefs.leadMinutes * 60_000);
  return { lead, dayOf };
}

interface Timer {
  id: number;
  when: Date;
  label: string;
}

interface ScheduleHandle {
  timers: Timer[];
  clear: () => void;
}

/**
 * Schedule in-session browser Notifications for any upcoming Soma day.
 *
 * In S3 the schedule is synthesized from the user's NotificationPhilosophy
 * (quiet / standard / detailed) instead of raw lead+dayOf timers. The 24h
 * horizon and the legacy "permission granted + liveNotifications on" gates
 * are unchanged — call the handle's `clear()` on re-schedule to cancel.
 */
export function scheduleLiveReminders(
  profile: UserProfile,
  schedule: SomaDay[],
  now: Date = new Date(),
  philosophy: NotificationPhilosophy = 'quiet',
): ScheduleHandle {
  const timers: Timer[] = [];
  const prefs = profile.reminders;

  const nowMs = now.getTime();
  const horizonMs = nowMs + 24 * 3600 * 1000;

  const canNotify =
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted' &&
    prefs.liveNotifications;

  if (!canNotify) {
    return { timers, clear: () => {} };
  }

  const planned = buildPhilosophySchedule(schedule, philosophy, prefs);
  for (const entry of planned) {
    const when = new Date(entry.at);
    const delay = when.getTime() - nowMs;
    if (delay <= 0 || when.getTime() > horizonMs) continue;
    const day = schedule.find((d) => d.date === entry.dayDate);
    const label = formatLabel(entry.kind, day?.title ?? entry.dayDate, prefs);
    const id = window.setTimeout(() => {
      try {
        new Notification('Soma', { body: label });
      } catch {
        // ignore — user may have revoked permission mid-session
      }
    }, delay);
    timers.push({ id, when, label });
  }

  return {
    timers,
    clear: () => {
      for (const t of timers) {
        clearTimeout(t.id);
      }
      timers.length = 0;
    },
  };
}

function formatLabel(
  kind: string,
  title: string,
  prefs: RemindersPrefs,
): string {
  switch (kind) {
    case 'pre-fast':
      return `Soma: ${title} in ${prefs.leadMinutes} minutes`;
    case 'day-of':
      return `Soma: ${title} — begin fast`;
    case 'parana':
      return `Soma: parana — break ${title}`;
    case 'tithi-sunrise':
      return `Soma: ${title} begins at sunrise`;
    case 'pradosh':
      return `Soma: pradosh begins this evening`;
    case 'sankashti':
      return `Soma: sankashti chaturthi tonight`;
    case 'shivaratri':
      return `Soma: shivaratri tonight`;
    case 'reflection':
      return `Soma: log how today landed`;
    default:
      return `Soma: ${title}`;
  }
}
