import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeekGlance } from '../WeekGlance';
import { toISODate } from '../../lib/lunar';
import type { FastSession } from '../../lib/types';

const DAY_MS = 86_400_000;
const TODAY = new Date('2026-07-06T12:00:00Z');

function session(overrides: Partial<FastSession>): FastSession {
  return {
    id: Math.random().toString(36).slice(2),
    dayDate: toISODate(TODAY),
    startedAt: TODAY.toISOString(),
    intensityHours: 16,
    status: 'completed',
    ...overrides,
  };
}

describe('WeekGlance', () => {
  it('shows zero hours with no sessions', () => {
    render(<WeekGlance sessions={[]} today={TODAY} />);
    expect(
      screen.getByLabelText(/Last 7 days: 0 fasts, 0 hours fasted/i),
    ).toBeInTheDocument();
  });

  it('sums actual hours from ended sessions inside the window', () => {
    const start = new Date(TODAY.getTime() - 2 * DAY_MS);
    const sessions = [
      session({
        dayDate: toISODate(start),
        startedAt: start.toISOString(),
        endedAt: new Date(start.getTime() + 14 * 3_600_000).toISOString(),
      }),
    ];
    render(<WeekGlance sessions={sessions} today={TODAY} />);
    expect(
      screen.getByLabelText(/Last 7 days: 1 fast, 14 hours fasted/i),
    ).toBeInTheDocument();
  });

  it('falls back to planned hours when a session has no end time, and ignores sessions outside the window or aborted', () => {
    const outside = new Date(TODAY.getTime() - 10 * DAY_MS);
    const sessions = [
      // Completed, no endedAt → counts as planned 16h.
      session({ status: 'late-completed' }),
      // Outside the 7-day window → ignored.
      session({
        dayDate: toISODate(outside),
        startedAt: outside.toISOString(),
      }),
      // Aborted → ignored.
      session({
        dayDate: toISODate(new Date(TODAY.getTime() - DAY_MS)),
        status: 'aborted',
      }),
    ];
    render(<WeekGlance sessions={sessions} today={TODAY} />);
    expect(
      screen.getByLabelText(/Last 7 days: 1 fast, 16 hours fasted/i),
    ).toBeInTheDocument();
  });
});
