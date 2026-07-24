import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Calendar } from '../Calendar';
import type { SomaDay } from '../../lib/types';

// Capture analytics without touching PostHog.
const track = vi.fn();
vi.mock('../../lib/analytics', () => ({
  track: (...args: unknown[]) => track(...args),
}));

const TODAY = '2026-07-24';
const fastDay = { date: '2026-07-28', kind: 'ekadashi', title: 'Ekadashi' } as unknown as SomaDay;

function renderCalendar(overrides: Partial<ComponentProps<typeof Calendar>> = {}) {
  const onSelect = vi.fn();
  const onMonthChange = vi.fn();
  render(
    <Calendar
      month={new Date(Date.UTC(2026, 6, 1))}
      todayIso={TODAY}
      selectedIso="2026-07-20"
      scheduleByDate={new Map([[fastDay.date, fastDay]])}
      sessions={[]}
      onSelect={onSelect}
      onMonthChange={onMonthChange}
      {...overrides}
    />,
  );
  return { onSelect, onMonthChange };
}

describe('Calendar analytics (N1 calendar_day_selected)', () => {
  beforeEach(() => track.mockReset());

  it('fires with coarse offset_days and is_fast_day:false for a plain future day', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderCalendar();
    await user.click(screen.getByLabelText('2026-07-26'));
    expect(track).toHaveBeenCalledWith('calendar_day_selected', {
      offset_days: 2,
      is_fast_day: false,
    });
    expect(onSelect).toHaveBeenCalledWith('2026-07-26');
  });

  it('marks is_fast_day:true when the day is a scheduled Soma day', async () => {
    const user = userEvent.setup();
    renderCalendar();
    await user.click(screen.getByLabelText(/^2026-07-28/));
    expect(track).toHaveBeenCalledWith('calendar_day_selected', {
      offset_days: 4,
      is_fast_day: true,
    });
  });

  it('does not fire when the tapped day is today', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderCalendar();
    await user.click(screen.getByLabelText(TODAY));
    expect(track).not.toHaveBeenCalled();
    expect(onSelect).toHaveBeenCalledWith(TODAY); // navigation still happens
  });

  it('dedupes a re-tap on the already-selected day', async () => {
    const user = userEvent.setup();
    renderCalendar({ selectedIso: '2026-07-20' });
    await user.click(screen.getByLabelText('2026-07-20'));
    expect(track).not.toHaveBeenCalled();
  });
});

describe('Calendar analytics (N2 calendar_month_changed)', () => {
  beforeEach(() => track.mockReset());

  it('fires direction:next on the next-month stepper', async () => {
    const user = userEvent.setup();
    const { onMonthChange } = renderCalendar();
    await user.click(screen.getByLabelText('Next month'));
    expect(track).toHaveBeenCalledWith('calendar_month_changed', { direction: 'next' });
    expect(onMonthChange).toHaveBeenCalledOnce();
  });

  it('fires direction:prev on the previous-month stepper', async () => {
    const user = userEvent.setup();
    renderCalendar();
    await user.click(screen.getByLabelText('Previous month'));
    expect(track).toHaveBeenCalledWith('calendar_month_changed', { direction: 'prev' });
  });
});
