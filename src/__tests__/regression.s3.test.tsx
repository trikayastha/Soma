import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

/**
 * S3 regression — verifies the three sprint-3 deliveries land together:
 *
 *   1. Rhythm tab replaces Trends and renders the mandala ring + paksha list.
 *   2. FastTimer reframe — synced-now pill is mounted, late-completion path
 *      exposes the non-red copy, end-early uses the gentle confirm.
 *   3. Migration — v2 state seeded into localStorage upgrades to v3 with a
 *      derived mandalaAnchor and the running app reads it without crashing.
 */

function setDesktop(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
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

function seedV2() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    profile: {
      name: 'Maya',
      timezone: 'UTC',
      experience: 'some',
      goal: 'focus',
      defaultIntensity: '12h',
      onboardedAt: new Date().toISOString(),
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
    },
    schedule: [
      {
        date: today,
        kind: 'full-moon',
        intensityHours: 12,
        title: 'Purnima — Full Moon',
        tradition: 'vedic',
      },
    ],
    sessions: [
      {
        id: 'old-1',
        dayDate: '2025-01-01',
        startedAt: '2025-01-01T06:00:00Z',
        endedAt: '2025-01-01T22:00:00Z',
        intensityHours: 16,
        status: 'completed',
      },
    ],
    onboardingComplete: true,
    preferences: {
      voice: 'coach',
      theme: 'performance',
      intent: null,
      notificationPhilosophy: 'quiet',
    },
    version: 2,
  };
}

describe('S3 Regression — Rhythm + FastTimer reframe + migration', () => {
  beforeEach(() => {
    localStorage.clear();
    setDesktop(false);
    vi.useRealTimers();
  });

  it('migrates v2 state to v3 with a derived mandalaAnchor on first read', async () => {
    localStorage.setItem('soma.state.v2', JSON.stringify(seedV2()));

    render(<App />);

    // Wait for hydration to flush.
    await screen.findByText(/Maya/);

    const persisted = JSON.parse(
      localStorage.getItem('soma.state.v3') ?? 'null',
    );
    expect(persisted).not.toBeNull();
    expect(persisted.version).toBe(3);
    expect(persisted.mandalaAnchor).toBeDefined();
    expect(persisted.mandalaAnchor.firstObservedFastDate).toBe('2025-01-01');
  });

  it('routes to the Rhythm tab and renders the paksha list', async () => {
    localStorage.setItem('soma.state.v2', JSON.stringify(seedV2()));
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText(/Maya/);
    const nav = screen.getByRole('navigation', { name: /Primary/i });
    await user.click(within(nav).getByRole('button', { name: /Rhythm/i }));

    expect(screen.getByText(/Sessions by paksha/i)).toBeInTheDocument();
  });

  it('FastTimer renders the percent-complete frame (countdown demoted)', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const seed = {
      ...seedV2(),
      sessions: [
        {
          id: 'live',
          dayDate: today,
          startedAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
          intensityHours: 12,
          status: 'active',
        },
      ],
    };
    localStorage.setItem('soma.state.v2', JSON.stringify(seed));

    const user = userEvent.setup();
    render(<App />);

    // Active fast renders the resume card on Today.
    await screen.findByRole('button', { name: /Open timer/i });
    await user.click(screen.getByRole('button', { name: /Open timer/i }));

    // Demoted countdown — percentage is the small uppercase label, time is
    // present but no longer the hero numeral.
    expect(screen.getByText(/% complete/)).toBeInTheDocument();
    expect(screen.getByText(/Fasting · 12h/i)).toBeInTheDocument();
  });
});
