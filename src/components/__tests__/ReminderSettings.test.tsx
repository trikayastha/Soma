import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppStateProvider } from '../../state/AppStateContext';
import { ReminderSettings } from '../ReminderSettings';
import type { AppState } from '../../lib/types';

function seedProfile(): AppState {
  return {
    profile: {
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
      reminders: { dayOfTime: '17:00', leadMinutes: 30, liveNotifications: false },
    },
    schedule: [],
    sessions: [],
    onboardingComplete: true,
    preferences: {
      voice: 'coach',
      theme: 'performance',
      intent: null,
      notificationPhilosophy: 'quiet',
      archetype: null,
      wisdomCardCount: 0,
    },
    mandalaAnchor: { firstObservedFastDate: null, manualResetDate: null },
    version: 3,
  };
}

function renderRS() {
  localStorage.setItem('soma.state.v3', JSON.stringify(seedProfile()));
  return render(
    <AppStateProvider>
      <ReminderSettings />
    </AppStateProvider>,
  );
}

describe('ReminderSettings philosophy radio', () => {
  beforeEach(() => localStorage.clear());

  it('renders three philosophy radio options', () => {
    renderRS();
    const radios = screen.getAllByRole('radio', { name: /(Quiet|Standard|Detailed)/ });
    expect(radios.length).toBe(3);
  });

  it('pre-selects the persisted philosophy', () => {
    renderRS();
    const quietRadio = screen.getByRole('radio', { name: /Quiet/ });
    expect(quietRadio).toBeChecked();
  });

  it('switches philosophy on click', async () => {
    const user = userEvent.setup();
    renderRS();
    await user.click(screen.getByRole('radio', { name: /Detailed/ }));
    expect(screen.getByRole('radio', { name: /Detailed/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Quiet/ })).not.toBeChecked();
  });

  it('renders the existing time and lead pills alongside the radio', () => {
    renderRS();
    expect(screen.getByText(/Fast begins at/)).toBeInTheDocument();
    expect(screen.getByText(/Remind me ahead by/)).toBeInTheDocument();
  });
});
