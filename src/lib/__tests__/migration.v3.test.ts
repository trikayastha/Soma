import { describe, it, expect, beforeEach } from 'vitest';
import {
  emptyState,
  loadState,
  migrateToCurrent,
  saveState,
  withLocation,
} from '../storage';
import {
  APP_STATE_VERSION,
  defaultPreferences,
  type AppState,
  type Location,
  type SomaDay,
  type UserProfile,
} from '../types';

const V1_KEY = 'soma.state.v1';
const V2_KEY = 'soma.state.v2';
const V3_KEY = 'soma.state.v3';

const sampleLocation: Location = {
  lat: 27.7172,
  lon: 85.324,
  label: 'Kathmandu',
  slug: 'kathmandu',
  tz: 'Asia/Kathmandu',
  countryCode: 'NP',
};

const sampleProfile: UserProfile = {
  name: 'Beta User',
  timezone: 'Asia/Kathmandu',
  experience: 'some',
  goal: 'focus',
  defaultIntensity: '16h',
  onboardedAt: new Date('2025-03-14T00:00:00Z').toISOString(),
  safetyFlags: {
    pregnant: false,
    eatingDisorderHistory: false,
    diabetes: false,
    under18: false,
  },
  reminders: { dayOfTime: '17:00', leadMinutes: 30, liveNotifications: false },
};

const sampleDayLegacy: SomaDay = {
  date: '2025-03-15',
  kind: 'full-moon',
  intensityHours: 16,
  title: 'Purnima — Full Moon',
  tradition: 'vedic',
  tithi: { index: 15, indexInPaksha: 15, paksha: 'shukla', name: 'Purnima' },
};

describe('migrateToCurrent (v3)', () => {
  it('produces a v3 state with default preferences and null location', () => {
    const result = migrateToCurrent({});
    expect(result.version).toBe(APP_STATE_VERSION);
    expect(result.preferences).toEqual(defaultPreferences());
    expect(result.profile).toBeNull();
  });

  it('preserves v2 preferences when migrating', () => {
    const v2: AppState = {
      profile: null,
      schedule: [],
      sessions: [],
      onboardingComplete: false,
      preferences: { ...defaultPreferences(), voice: 'traditional', theme: 'devotional' },
      version: 2 as 3, // simulate stale version field
    };
    const result = migrateToCurrent(v2 as unknown as Record<string, unknown>);
    expect(result.preferences.voice).toBe('traditional');
    expect(result.preferences.theme).toBe('devotional');
    expect(result.version).toBe(APP_STATE_VERSION);
  });

  it('backfills tithi.accuracy="approximate" on legacy SomaDays', () => {
    const result = migrateToCurrent({
      profile: sampleProfile,
      schedule: [sampleDayLegacy],
      sessions: [],
      onboardingComplete: true,
    });
    expect(result.schedule[0].tithi?.accuracy).toBe('approximate');
  });

  it('preserves a well-formed location on the profile', () => {
    const result = migrateToCurrent({
      profile: { ...sampleProfile, location: sampleLocation },
      schedule: [],
      sessions: [],
      onboardingComplete: true,
    });
    expect(result.profile?.location?.slug).toBe('kathmandu');
  });

  it('coerces malformed location to null', () => {
    const result = migrateToCurrent({
      profile: { ...sampleProfile, location: { lat: 'oops' } },
      schedule: [],
      sessions: [],
      onboardingComplete: true,
    });
    expect(result.profile?.location).toBeNull();
  });

  it('is idempotent on a v3 state', () => {
    const v3 = migrateToCurrent({
      profile: { ...sampleProfile, location: sampleLocation },
      schedule: [sampleDayLegacy],
      sessions: [],
      onboardingComplete: true,
    });
    const again = migrateToCurrent(v3 as unknown as Record<string, unknown>);
    expect(again.profile?.location?.slug).toBe('kathmandu');
    expect(again.schedule[0].tithi?.accuracy).toBe('approximate');
  });
});

describe('loadState — v3 layered fallback', () => {
  beforeEach(() => localStorage.clear());

  it('reads from v3 key first', () => {
    const v3State: AppState = {
      ...emptyState(),
      profile: { ...sampleProfile, location: sampleLocation },
      onboardingComplete: true,
    };
    localStorage.setItem(V3_KEY, JSON.stringify(v3State));

    const loaded = loadState();
    expect(loaded.profile?.location?.slug).toBe('kathmandu');
    expect(loaded.version).toBe(APP_STATE_VERSION);
  });

  it('falls back from v2 when v3 absent', () => {
    const v2State = {
      profile: sampleProfile,
      schedule: [],
      sessions: [],
      onboardingComplete: true,
      preferences: { ...defaultPreferences(), theme: 'devotional' },
      version: 2,
    };
    localStorage.setItem(V2_KEY, JSON.stringify(v2State));

    const loaded = loadState();
    expect(loaded.preferences.theme).toBe('devotional');
    expect(loaded.profile?.name).toBe('Beta User');
    // v2 had no location -> defaults to undefined/null after sanitize
    expect(loaded.profile?.location ?? null).toBeNull();
  });

  it('falls back from v1 when v2 and v3 absent', () => {
    const v1 = {
      profile: sampleProfile,
      schedule: [sampleDayLegacy],
      sessions: [],
      onboardingComplete: true,
    };
    localStorage.setItem(V1_KEY, JSON.stringify(v1));

    const loaded = loadState();
    expect(loaded.profile?.name).toBe('Beta User');
    expect(loaded.preferences).toEqual(defaultPreferences());
    expect(loaded.schedule[0].tithi?.accuracy).toBe('approximate');
  });

  it('does not destructively delete v1 or v2 on save', () => {
    const v1Raw = JSON.stringify({ profile: sampleProfile });
    const v2Raw = JSON.stringify({ ...emptyState(), version: 2 });
    localStorage.setItem(V1_KEY, v1Raw);
    localStorage.setItem(V2_KEY, v2Raw);
    saveState(emptyState());
    expect(localStorage.getItem(V1_KEY)).toBe(v1Raw);
    expect(localStorage.getItem(V2_KEY)).toBe(v2Raw);
  });
});

describe('withLocation', () => {
  it('updates the location on an existing profile', () => {
    const s = { ...emptyState(), profile: sampleProfile };
    const next = withLocation(s, sampleLocation);
    expect(next.profile?.location?.slug).toBe('kathmandu');
    // Original untouched (immutability).
    expect(s.profile?.location ?? null).toBeNull();
  });

  it('clears location when given null', () => {
    const s = withLocation(
      { ...emptyState(), profile: sampleProfile },
      sampleLocation,
    );
    const cleared = withLocation(s, null);
    expect(cleared.profile?.location).toBeNull();
  });

  it('is a no-op when no profile exists', () => {
    const s = emptyState();
    const next = withLocation(s, sampleLocation);
    expect(next.profile).toBeNull();
  });
});
