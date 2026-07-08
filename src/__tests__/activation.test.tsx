import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

/**
 * Phase 2 (AARRR activation) behaviours that the main regression flow does not
 * cover: the skippable first pre-fast log, and the rest-day first-visit rescue.
 */

function mockMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
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

function isoOffset(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

describe('Phase 2 activation', () => {
  beforeEach(() => {
    localStorage.clear();
    mockMatchMedia();
    vi.useRealTimers();
  });

  it('lets the first fast skip the pre-log and starts the timer directly', async () => {
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
        ],
        sessions: [],
        onboardingComplete: true,
      }),
    );

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: /Begin fast/i }));
    // Intensity ask (first fast only) → accept default.
    expect(screen.getByText(/How long today/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Continue$/i }));

    // Skip the mood log — nothing should stand between tap and timer.
    expect(screen.getByText(/Before you begin/i)).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: /Skip — start without logging/i }),
    );

    expect(screen.getByText(/Fasting · 16h/i)).toBeInTheDocument();

    const persisted = JSON.parse(localStorage.getItem('soma.state.v3')!);
    expect(persisted.sessions).toHaveLength(1);
    expect(persisted.sessions[0].status).toBe('active');
    expect(persisted.sessions[0].preLog).toBeUndefined();
  });

  it('rescues a rest-day first visit with the next-fast card', async () => {
    localStorage.setItem(
      'soma.state.v1',
      JSON.stringify({
        profile: baseProfile,
        // No fast today; the next one is three days out.
        schedule: [
          {
            date: isoOffset(3),
            kind: 'ekadashi',
            intensityHours: 16,
            title: 'Shukla Ekadashi',
            tradition: 'vedic',
          },
        ],
        sessions: [],
        onboardingComplete: true,
      }),
    );

    render(<App />);

    expect(await screen.findByText(/Your first fast/i)).toBeInTheDocument();
    expect(screen.getByText(/Shukla Ekadashi/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Add my fasts to calendar/i }),
    ).toBeInTheDocument();
  });
});
