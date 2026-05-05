import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  computeReminderTimes,
  getPermissionState,
  scheduleLiveReminders,
} from '../reminders';
import type { SomaDay, UserProfile } from '../types';

const profile: UserProfile = {
  name: 'T',
  timezone: 'UTC',
  experience: 'some',
  goal: 'focus',
  defaultIntensity: '16h',
  onboardedAt: '2025-01-01T00:00:00Z',
  safetyFlags: {
    pregnant: false,
    eatingDisorderHistory: false,
    diabetes: false,
    under18: false,
  },
  reminders: { dayOfTime: '17:00', leadMinutes: 30, liveNotifications: true },
};

const sampleDay: SomaDay = {
  date: '2025-04-15',
  kind: 'ekadashi',
  intensityHours: 16,
  title: 'Shukla Ekadashi',
  tradition: 'vedic',
};

/**
 * Stub the global Notification API. jsdom does not ship one, so we install
 * a minimal impl whose `permission` property can be flipped per test.
 */
class FakeNotification {
  static permission: NotificationPermission = 'granted';
  static requestPermission = vi.fn(async () => FakeNotification.permission);
  title: string;
  options?: NotificationOptions;
  constructor(title: string, options?: NotificationOptions) {
    this.title = title;
    this.options = options;
  }
}

function installFakeNotification(permission: NotificationPermission = 'granted') {
  FakeNotification.permission = permission;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).Notification = FakeNotification;
}

function uninstallNotification() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (globalThis as any).Notification;
}

describe('reminders / computeReminderTimes', () => {
  it('computes dayOf at the requested local time and lead N minutes earlier', () => {
    const { lead, dayOf } = computeReminderTimes(sampleDay, profile.reminders);
    expect(dayOf.getHours()).toBe(17);
    expect(dayOf.getMinutes()).toBe(0);
    expect(dayOf.getDate()).toBe(15);
    expect(dayOf.getFullYear()).toBe(2025);
    const diffMs = dayOf.getTime() - lead.getTime();
    expect(diffMs).toBe(30 * 60_000);
  });

  it('respects a different dayOfTime', () => {
    const { dayOf } = computeReminderTimes(sampleDay, {
      ...profile.reminders,
      dayOfTime: '07:45',
    });
    expect(dayOf.getHours()).toBe(7);
    expect(dayOf.getMinutes()).toBe(45);
  });

  it('respects a different leadMinutes', () => {
    const { lead, dayOf } = computeReminderTimes(sampleDay, {
      ...profile.reminders,
      leadMinutes: 120,
    });
    expect(dayOf.getTime() - lead.getTime()).toBe(120 * 60_000);
  });
});

describe('reminders / getPermissionState', () => {
  beforeEach(() => {
    uninstallNotification();
    vi.useRealTimers();
  });

  it('returns "unsupported" when Notification API is missing', () => {
    expect(getPermissionState()).toBe('unsupported');
  });

  it('returns the live permission value when present', () => {
    installFakeNotification('denied');
    expect(getPermissionState()).toBe('denied');
    installFakeNotification('granted');
    expect(getPermissionState()).toBe('granted');
    uninstallNotification();
  });
});

describe('reminders / scheduleLiveReminders', () => {
  beforeEach(() => {
    uninstallNotification();
    vi.useFakeTimers();
  });

  it('no-ops when Notification API is unsupported', () => {
    const handle = scheduleLiveReminders(profile, [sampleDay], new Date());
    expect(handle.timers).toHaveLength(0);
  });

  it('no-ops when permission is not granted', () => {
    installFakeNotification('denied');
    const handle = scheduleLiveReminders(profile, [sampleDay], new Date());
    expect(handle.timers).toHaveLength(0);
  });

  it('no-ops when liveNotifications preference is false', () => {
    installFakeNotification('granted');
    const handle = scheduleLiveReminders(
      { ...profile, reminders: { ...profile.reminders, liveNotifications: false } },
      [sampleDay],
      new Date(),
    );
    expect(handle.timers).toHaveLength(0);
  });

  it('skips reminders whose target time has already passed', () => {
    installFakeNotification('granted');
    const now = new Date('2025-04-15T20:00:00'); // after 17:00 on the same day
    const handle = scheduleLiveReminders(profile, [sampleDay], now);
    expect(handle.timers).toHaveLength(0);
  });

  it('skips reminders more than 24h in the future', () => {
    installFakeNotification('granted');
    const now = new Date('2025-04-10T12:00:00'); // 5 days before the 15th
    const handle = scheduleLiveReminders(profile, [sampleDay], now);
    expect(handle.timers).toHaveLength(0);
  });

  it('schedules lead + day-of timers under standard philosophy', () => {
    installFakeNotification('granted');
    const now = new Date('2025-04-15T08:00:00'); // 9h before 17:00
    const handle = scheduleLiveReminders(profile, [sampleDay], now, 'standard');
    expect(handle.timers.length).toBe(2);
    const labels = handle.timers.map((t) => t.label);
    expect(labels.some((l) => l.includes('in 30 minutes'))).toBe(true);
    expect(labels.some((l) => l.includes('begin fast'))).toBe(true);
  });

  it('quiet philosophy schedules only the day-of for a major fast', () => {
    installFakeNotification('granted');
    const now = new Date('2025-04-15T08:00:00');
    const handle = scheduleLiveReminders(profile, [sampleDay], now, 'quiet');
    expect(handle.timers.length).toBe(1);
    expect(handle.timers[0].label).toMatch(/begin fast/);
  });

  it('clear() cancels all timers without throwing', () => {
    installFakeNotification('granted');
    const now = new Date('2025-04-15T08:00:00');
    const handle = scheduleLiveReminders(profile, [sampleDay], now, 'standard');
    expect(() => handle.clear()).not.toThrow();
    expect(handle.timers.length).toBe(0);
  });
});
