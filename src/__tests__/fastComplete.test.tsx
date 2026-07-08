import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppStateProvider } from '../state/AppStateContext';
import { FastComplete } from '../screens/FastComplete';

/**
 * Phase 3 payoff screen: after a credited fast, name the win (mandala ring),
 * the reason to return (patterns), and offer share + a contextual reminder.
 */

function isoOffset(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const baseProfile = {
  name: 'Seeker',
  timezone: 'UTC',
  experience: 'some',
  goal: 'focus',
  defaultIntensity: '16h',
  onboardedAt: new Date().toISOString(),
  safetyFlags: {
    pregnant: false,
    eatingDisorderHistory: false,
    diabetes: false,
    under18: false,
  },
  reminders: { dayOfTime: '17:00', leadMinutes: 30, liveNotifications: false },
};

describe('FastComplete payoff', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('names the win, the next milestone, and the contextual reminder', async () => {
    const today = isoOffset(0);
    localStorage.setItem(
      'soma.state.v1',
      JSON.stringify({
        profile: baseProfile,
        schedule: [
          {
            date: today,
            kind: 'ekadashi',
            intensityHours: 16,
            title: 'Shukla Ekadashi',
            tradition: 'vedic',
          },
          {
            date: isoOffset(3),
            kind: 'ekadashi',
            intensityHours: 16,
            title: 'Krishna Ekadashi',
            tradition: 'vedic',
          },
        ],
        sessions: [
          {
            id: 's1',
            dayDate: today,
            startedAt: new Date(Date.now() - 16 * 3600 * 1000).toISOString(),
            endedAt: new Date().toISOString(),
            intensityHours: 16,
            status: 'completed',
            postLog: { energy: 4, focus: 4, mood: 4, sleep: 3 },
          },
        ],
        onboardingComplete: true,
      }),
    );

    render(
      <AppStateProvider>
        <FastComplete onDone={() => {}} />
      </AppStateProvider>,
    );

    // Win named.
    expect(await screen.findByText(/Fast complete/i)).toBeInTheDocument();
    // One credited fast → two more to unlock patterns.
    expect(
      screen.getByText(/2 more logged fasts and Soma starts showing/i),
    ).toBeInTheDocument();
    // Contextual reminder pointing at the next fast + reliable calendar path.
    expect(screen.getByText(/Krishna Ekadashi/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Add my fasts to calendar/i }),
    ).toBeInTheDocument();
  });
});
