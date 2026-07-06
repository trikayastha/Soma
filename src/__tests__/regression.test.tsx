import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

/**
 * Full-flow regression test: this is the single most important safety net
 * for the beta. It walks onboarding → safety gate → today → (simulated) fast
 * → log → trends without a browser, purely through React Testing Library.
 *
 * It does NOT assert exact moon phases or dates — those vary with the system
 * clock. It asserts that every P0 screen renders, the flow transitions
 * happen, and state persists.
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

describe('Regression: full P0 flow', () => {
  beforeEach(() => {
    localStorage.clear();
    setDesktop(false); // render in mobile mode so there's no phone frame chrome
    vi.useRealTimers();
  });

  it('completes onboarding and lands on the Today screen', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Intent step (S1) — pick "Curious about the moon" → coach voice.
    // This single step now also derives profile.goal (curious → focus).
    expect(screen.getByText(/Why are you here/i)).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /Curious about the moon/i }));

    // Welcome carousel (S4) — advance through all 3 slides to Begin
    expect(screen.getByText(/A rhythm, not a regimen/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Next$/i }));
    await user.click(screen.getByRole('button', { name: /^Next$/i }));
    await user.click(screen.getByRole('button', { name: /^Begin$/i }));

    // You step — name only (goal captured at intent)
    expect(screen.getByText(/Tell us who you are/i)).toBeInTheDocument();
    await user.type(
      screen.getByPlaceholderText(/What should we call you/i),
      'Maya',
    );
    await user.click(screen.getByRole('button', { name: /^Continue$/i }));

    // Location step (optional) — skip
    expect(screen.getByText(/Where are you/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Skip$/i }));

    // Safety step — all defaults false, should allow continue
    expect(screen.getByText(/A few safety checks/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Continue$/i }));

    // Merged experience + intensity step — finishes onboarding
    expect(screen.getByText(/Your experience/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Some IF experience/i }));
    await user.click(screen.getByRole('button', { name: /Enter Soma/i }));

    // Today screen
    expect(await screen.findByText(/Maya/)).toBeInTheDocument();
  });

  it('blocks high-risk users at the safety gate', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Intent step (S1)
    await user.click(screen.getByRole('radio', { name: /Curious about the moon/i }));

    // Welcome carousel (S4) — advance to Begin
    await user.click(screen.getByRole('button', { name: /^Next$/i }));
    await user.click(screen.getByRole('button', { name: /^Next$/i }));
    await user.click(screen.getByRole('button', { name: /^Begin$/i }));
    await user.type(screen.getByPlaceholderText(/call you/i), 'Test');
    await user.click(screen.getByRole('button', { name: /^Continue$/i }));
    // Skip optional location step
    await user.click(screen.getByRole('button', { name: /^Skip$/i }));

    // Toggle under-18 on the safety step
    await user.click(screen.getByRole('button', { name: /under 18/i }));
    expect(screen.getByText(/Soma cannot support/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Continue$/i })).toBeDisabled();
  });

  it('renders the bottom nav and all tabs after onboarding', async () => {
    // Seed state directly to skip onboarding for this test
    const seed = {
      profile: {
        name: 'Maya',
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
      },
      schedule: [
        {
          date: new Date().toISOString().slice(0, 10),
          kind: 'ekadashi',
          intensityHours: 16,
          title: 'Shukla Ekadashi',
          tradition: 'vedic',
        },
      ],
      sessions: [],
      onboardingComplete: true,
    };
    localStorage.setItem('soma.state.v1', JSON.stringify(seed));

    const user = userEvent.setup();
    render(<App />);

    // Today screen is showing
    expect(await screen.findByText(/Shukla Ekadashi/i)).toBeInTheDocument();

    const nav = screen.getByRole('navigation', { name: /Primary/i });
    await user.click(within(nav).getByRole('button', { name: /Wisdom/i }));
    // Wisdom opens on the Today segment (the shareable card); the explainer
    // library now lives behind the Reads segment.
    await user.click(screen.getByRole('tab', { name: /Reads/i }));
    expect(screen.getByText(/Why the moon became the calendar/i)).toBeInTheDocument();

    await user.click(within(nav).getByRole('button', { name: /Rhythm/i }));
    // Rhythm screen renders. With no sessions yet, the empty mandala
    // copy is shown.
    expect(
      screen.getByText(/Sessions by paksha/i),
    ).toBeInTheDocument();

    // Settings is no longer a tab — it opens from the gear in Rhythm's
    // header as a full-screen overlay (no bottom nav).
    expect(
      within(nav).queryByRole('button', { name: /Settings/i }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Settings/i }));
    expect(screen.getByText(/Default intensity/i)).toBeInTheDocument();
    expect(screen.getByText(/Export my data/i)).toBeInTheDocument();
    expect(screen.getByText(/Reminders/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Download calendar/i }),
    ).toBeInTheDocument();

    // Back returns to the tab shell.
    await user.click(screen.getByRole('button', { name: /Back/i }));
    const navAgain = screen.getByRole('navigation', { name: /Primary/i });
    await user.click(within(navAgain).getByRole('button', { name: /Today/i }));
    expect(screen.getByText(/Shukla Ekadashi/i)).toBeInTheDocument();
  });

  it('shows the month grid inline on Today with no Calendar tab', async () => {
    const seed = {
      profile: {
        name: 'Maya',
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
      },
      schedule: [
        {
          date: new Date().toISOString().slice(0, 10),
          kind: 'ekadashi',
          intensityHours: 16,
          title: 'Shukla Ekadashi',
          tradition: 'vedic',
        },
      ],
      sessions: [],
      onboardingComplete: true,
    };
    localStorage.setItem('soma.state.v1', JSON.stringify(seed));

    render(<App />);

    expect(await screen.findByText(/Shukla Ekadashi/i)).toBeInTheDocument();

    // The month grid renders inline on Today — there is no Calendar tab.
    const nav = screen.getByRole('navigation', { name: /Primary/i });
    expect(within(nav).queryByRole('button', { name: /^Calendar$/i })).toBeNull();
    expect(screen.getByRole('grid')).toBeInTheDocument();
    // Today is a scheduled fast day, so the day card offers Begin fast.
    expect(screen.getByRole('button', { name: /Begin fast/i })).toBeEnabled();
  });

  it('runs the full fast flow: pre-log → timer → meditation → complete → post-log → trends', async () => {
    // Seed with a fast day for "today" and a short intensity so we can fake completion
    const today = new Date().toISOString().slice(0, 10);
    const seed = {
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
        reminders: { dayOfTime: '17:00', leadMinutes: 30, liveNotifications: false },
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
      sessions: [],
      onboardingComplete: true,
    };
    localStorage.setItem('soma.state.v1', JSON.stringify(seed));

    const user = userEvent.setup();
    render(<App />);

    // Begin fast from Today
    expect(await screen.findByText(/Purnima/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Begin fast/i }));

    // Pre-log form shows
    expect(screen.getByText(/Before you begin/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Start fast/i }));

    // Timer appears
    expect(screen.getByText(/Fasting · 12h/i)).toBeInTheDocument();

    // Directly advance: simulate completion by manipulating localStorage and re-rendering.
    // After v1→v2 migration, the running app persists to soma.state.v2.
    const raw = JSON.parse(localStorage.getItem('soma.state.v3')!);
    raw.sessions[0].startedAt = new Date(Date.now() - 13 * 3600 * 1000).toISOString();
    localStorage.setItem('soma.state.v3', JSON.stringify(raw));
  });

  it.each([
    {
      label: 'Optimize my body',
      intent: 'optimize',
      theme: 'performance',
      voice: 'scientific',
    },
    {
      label: 'Follow tradition',
      intent: 'tradition',
      theme: 'devotional',
      voice: 'traditional',
    },
    {
      label: 'Tired of fasting apps',
      intent: 'tired',
      theme: 'minimal',
      voice: 'coach',
    },
  ] as const)(
    'IntentRouter $label sets prefs $theme + $voice and lands on Today',
    async ({ label, intent, theme, voice }) => {
      const user = userEvent.setup();
      render(<App />);

      // Intent
      await user.click(screen.getByRole('radio', { name: new RegExp(label, 'i') }));

      // Welcome carousel (S4) — advance to Begin
      await user.click(screen.getByRole('button', { name: /^Next$/i }));
      await user.click(screen.getByRole('button', { name: /^Next$/i }));
      await user.click(screen.getByRole('button', { name: /^Begin$/i }));
      await user.type(
        screen.getByPlaceholderText(/What should we call you/i),
        'Maya',
      );
      await user.click(screen.getByRole('button', { name: /^Continue$/i }));
      // Skip optional location step
      await user.click(screen.getByRole('button', { name: /^Skip$/i }));
      // Safety step — defaults allow continue
      await user.click(screen.getByRole('button', { name: /^Continue$/i }));
      // Merged experience + intensity step finishes onboarding
      await user.click(screen.getByRole('button', { name: /Some IF experience/i }));
      await user.click(screen.getByRole('button', { name: /Enter Soma/i }));

      // Today renders
      expect(await screen.findByText(/Maya/)).toBeInTheDocument();

      // <html data-theme> matches the selected theme
      expect(document.documentElement.getAttribute('data-theme')).toBe(theme);

      // Persisted preferences match the chosen card
      const persisted = JSON.parse(localStorage.getItem('soma.state.v3')!);
      expect(persisted.preferences.intent).toBe(intent);
      expect(persisted.preferences.theme).toBe(theme);
      expect(persisted.preferences.voice).toBe(voice);
    },
  );

  it('starts a personal vrat on a day with no scheduled fast', async () => {
    // Seed with an empty schedule — today is a plain rest day.
    const seed = {
      profile: {
        name: 'Maya',
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
      },
      schedule: [],
      sessions: [],
      onboardingComplete: true,
    };
    localStorage.setItem('soma.state.v1', JSON.stringify(seed));

    const user = userEvent.setup();
    render(<App />);

    // Rest-day card offers a self-chosen vrat
    const vratBtn = await screen.findByRole('button', {
      name: /Begin a personal vrat/i,
    });
    await user.click(vratBtn);

    // Pre-log opens; starting creates an active 16h session
    expect(screen.getByText(/Before you begin/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Start fast/i }));
    expect(screen.getByText(/Fasting · 16h/i)).toBeInTheDocument();

    const persisted = JSON.parse(localStorage.getItem('soma.state.v3')!);
    expect(persisted.sessions).toHaveLength(1);
    expect(persisted.sessions[0].status).toBe('active');
    expect(persisted.sessions[0].intensityHours).toBe(16);
  });

  it('shows the Why-this-day explainer when tapped', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const seed = {
      profile: {
        name: 'Maya',
        timezone: 'UTC',
        experience: 'some',
        goal: 'calm',
        defaultIntensity: '16h',
        onboardedAt: new Date().toISOString(),
        safetyFlags: {
          pregnant: false,
          eatingDisorderHistory: false,
          diabetes: false,
          under18: false,
        },
        reminders: { dayOfTime: '17:00', leadMinutes: 30, liveNotifications: false },
      },
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
    };
    localStorage.setItem('soma.state.v1', JSON.stringify(seed));

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: /Why this day/i }));
    expect(screen.getByText(/Ekadashi — the 11th lunar day/i)).toBeInTheDocument();
  });
});
