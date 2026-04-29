import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearState,
  emptyState,
  loadState,
  saveState,
  withOnboardingComplete,
  withProfile,
  withSchedule,
  withSession,
} from '../storage';
import type { FastSession, SomaDay, UserProfile } from '../types';

const sampleProfile: UserProfile = {
  name: 'Test User',
  timezone: 'UTC',
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

const sampleDay: SomaDay = {
  date: '2025-03-15',
  kind: 'full-moon',
  intensityHours: 16,
  title: 'Purnima — Full Moon',
  tradition: 'vedic',
};

const sampleSession: FastSession = {
  id: 'abc',
  dayDate: '2025-03-15',
  startedAt: '2025-03-15T08:00:00Z',
  intensityHours: 16,
  status: 'active',
};

describe('storage / persistence', () => {
  beforeEach(() => localStorage.clear());

  it('loadState returns emptyState when storage is empty', () => {
    expect(loadState()).toEqual(emptyState());
  });

  it('roundtrips state through save + load', () => {
    const initial = withProfile(emptyState(), sampleProfile);
    const next = withSchedule(initial, [sampleDay]);
    saveState(next);
    const loaded = loadState();
    expect(loaded.profile?.name).toBe('Test User');
    expect(loaded.schedule).toHaveLength(1);
    expect(loaded.schedule[0].date).toBe('2025-03-15');
  });

  it('loadState falls back to emptyState on corrupt JSON', () => {
    localStorage.setItem('soma.state.v1', '{not json');
    expect(loadState()).toEqual(emptyState());
  });

  it('clearState removes persisted data', () => {
    saveState(withProfile(emptyState(), sampleProfile));
    clearState();
    expect(loadState()).toEqual(emptyState());
  });
});

describe('storage / immutable updates', () => {
  it('withProfile does not mutate the input', () => {
    const s = emptyState();
    const next = withProfile(s, sampleProfile);
    expect(s.profile).toBeNull();
    expect(next.profile?.name).toBe('Test User');
  });

  it('withSession adds a new session', () => {
    const s = emptyState();
    const next = withSession(s, sampleSession);
    expect(next.sessions).toHaveLength(1);
  });

  it('withSession replaces an existing session by id', () => {
    const s = withSession(emptyState(), sampleSession);
    const updated = withSession(s, { ...sampleSession, status: 'completed' });
    expect(updated.sessions).toHaveLength(1);
    expect(updated.sessions[0].status).toBe('completed');
  });

  it('withOnboardingComplete flips the flag', () => {
    const s = emptyState();
    expect(withOnboardingComplete(s, true).onboardingComplete).toBe(true);
    expect(s.onboardingComplete).toBe(false);
  });
});
