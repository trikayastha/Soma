import { describe, it, expect, beforeEach } from 'vitest';
import {
  emptyState,
  loadState,
  migrateToV2,
  saveState,
  withPreferences,
} from '../storage';
import {
  APP_STATE_VERSION,
  defaultPreferences,
  type AppState,
} from '../types';

const LEGACY_KEY = 'soma.state.v1';
const STORAGE_KEY = 'soma.state.v2';

const sampleProfile = {
  name: 'Beta User',
  timezone: 'UTC',
  experience: 'some' as const,
  goal: 'focus' as const,
  defaultIntensity: '16h' as const,
  onboardedAt: new Date('2025-03-14T00:00:00Z').toISOString(),
  safetyFlags: {
    pregnant: false,
    eatingDisorderHistory: false,
    diabetes: false,
    under18: false,
  },
  reminders: {
    dayOfTime: '17:00',
    leadMinutes: 30,
    liveNotifications: false,
  },
};

describe('migrateToV2', () => {
  it('produces a v2 state with default preferences when input is empty', () => {
    const result = migrateToV2({});
    expect(result.version).toBe(APP_STATE_VERSION);
    expect(result.preferences).toEqual(defaultPreferences());
    expect(result.profile).toBeNull();
    expect(result.schedule).toEqual([]);
    expect(result.sessions).toEqual([]);
    expect(result.onboardingComplete).toBe(false);
  });

  it('preserves v1 fields and seeds default preferences', () => {
    const v1 = {
      profile: sampleProfile,
      schedule: [],
      sessions: [],
      onboardingComplete: true,
    };
    const result = migrateToV2(v1);
    expect(result.profile?.name).toBe('Beta User');
    expect(result.onboardingComplete).toBe(true);
    expect(result.preferences).toEqual(defaultPreferences());
    expect(result.version).toBe(APP_STATE_VERSION);
  });

  it('is idempotent on already-v2 input', () => {
    const v2: AppState = {
      profile: null,
      schedule: [],
      sessions: [],
      onboardingComplete: false,
      preferences: { ...defaultPreferences(), voice: 'traditional' },
      version: APP_STATE_VERSION,
    };
    const result = migrateToV2(v2 as unknown as Record<string, unknown>);
    expect(result.preferences.voice).toBe('traditional');
    expect(result.version).toBe(APP_STATE_VERSION);
  });

  it('fills missing preference fields with defaults (partial v2)', () => {
    const partial = {
      profile: null,
      schedule: [],
      sessions: [],
      onboardingComplete: false,
      preferences: { voice: 'scientific' },
      version: 2,
    };
    const result = migrateToV2(partial);
    expect(result.preferences.voice).toBe('scientific');
    expect(result.preferences.theme).toBe('performance');
    expect(result.preferences.intent).toBeNull();
    expect(result.preferences.notificationPhilosophy).toBe('quiet');
  });

  it('falls back to defaults when arrays are malformed', () => {
    const result = migrateToV2({
      schedule: 'not-an-array',
      sessions: null,
    });
    expect(result.schedule).toEqual([]);
    expect(result.sessions).toEqual([]);
  });
});

describe('loadState() — beta user migration path', () => {
  beforeEach(() => localStorage.clear());

  it('reads v1 blob from legacy key and migrates to v2 on save', () => {
    const v1 = {
      profile: sampleProfile,
      schedule: [],
      sessions: [],
      onboardingComplete: true,
    };
    localStorage.setItem(LEGACY_KEY, JSON.stringify(v1));

    const loaded = loadState();
    expect(loaded.version).toBe(APP_STATE_VERSION);
    expect(loaded.profile?.name).toBe('Beta User');
    expect(loaded.preferences).toEqual(defaultPreferences());
  });

  it('prefers v2 key when both v1 and v2 exist', () => {
    localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify({ ...emptyState(), profile: sampleProfile }),
    );
    const v2State: AppState = {
      ...emptyState(),
      preferences: { ...defaultPreferences(), theme: 'devotional' },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v2State));

    const loaded = loadState();
    expect(loaded.preferences.theme).toBe('devotional');
    expect(loaded.profile).toBeNull();
  });

  it('writes only to v2 key on save', () => {
    saveState(emptyState());
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it('does not destructively delete v1 on save (additive only)', () => {
    const v1 = JSON.stringify({
      profile: sampleProfile,
      schedule: [],
      sessions: [],
      onboardingComplete: true,
    });
    localStorage.setItem(LEGACY_KEY, v1);
    saveState(emptyState());
    expect(localStorage.getItem(LEGACY_KEY)).toBe(v1);
  });
});

describe('withPreferences', () => {
  it('returns a new state with the partial prefs merged', () => {
    const s = emptyState();
    const next = withPreferences(s, { voice: 'traditional' });
    expect(next.preferences.voice).toBe('traditional');
    expect(s.preferences.voice).toBe('coach'); // unchanged
  });

  it('preserves untouched preference fields', () => {
    const s = withPreferences(emptyState(), { theme: 'devotional' });
    const next = withPreferences(s, { voice: 'scientific' });
    expect(next.preferences.voice).toBe('scientific');
    expect(next.preferences.theme).toBe('devotional');
  });
});
