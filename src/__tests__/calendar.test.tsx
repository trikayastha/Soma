import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Calendar } from '../components/Calendar';
import type { SomaDay } from '../lib/types';

const APRIL_2025 = new Date(Date.UTC(2025, 3, 1));

function noopMonth() {}

describe('Calendar', () => {
  it('renders a 6-row grid with weekday headers', () => {
    render(
      <Calendar
        month={APRIL_2025}
        todayIso="2025-04-12"
        selectedIso="2025-04-12"
        scheduleByDate={new Map()}
        sessions={[]}
        onSelect={() => {}}
        onMonthChange={noopMonth}
      />,
    );
    // 42 grid cells
    expect(screen.getAllByRole('gridcell')).toHaveLength(42);
    // Month label
    expect(screen.getByText(/April 2025/i)).toBeInTheDocument();
  });

  it('marks the selected day with aria-selected and fires onSelect', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <Calendar
        month={APRIL_2025}
        todayIso="2025-04-12"
        selectedIso="2025-04-12"
        scheduleByDate={new Map()}
        sessions={[]}
        onSelect={onSelect}
        onMonthChange={noopMonth}
      />,
    );
    const selected = screen
      .getAllByRole('gridcell')
      .find((c) => c.getAttribute('aria-selected') === 'true');
    expect(selected).toBeDefined();

    const target = screen.getByLabelText(/2025-04-15/);
    await user.click(target);
    expect(onSelect).toHaveBeenCalledWith('2025-04-15');
  });

  it('highlights Soma days from the schedule', () => {
    const ekadashi: SomaDay = {
      date: '2025-04-08',
      kind: 'ekadashi',
      intensityHours: 16,
      title: 'Shukla Ekadashi',
      tradition: 'vedic',
    };
    render(
      <Calendar
        month={APRIL_2025}
        todayIso="2025-04-12"
        selectedIso="2025-04-12"
        scheduleByDate={new Map([[ekadashi.date, ekadashi]])}
        sessions={[]}
        onSelect={() => {}}
        onMonthChange={noopMonth}
      />,
    );
    const cell = screen.getByLabelText(/2025-04-08 — Shukla Ekadashi/);
    expect(cell).toBeInTheDocument();
  });

  it('steps month forward and backward', async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn();
    render(
      <Calendar
        month={APRIL_2025}
        todayIso="2025-04-12"
        selectedIso="2025-04-12"
        scheduleByDate={new Map()}
        sessions={[]}
        onSelect={() => {}}
        onMonthChange={onMonthChange}
      />,
    );
    await user.click(screen.getByLabelText('Next month'));
    await user.click(screen.getByLabelText('Previous month'));
    expect(onMonthChange).toHaveBeenCalledTimes(2);
    const firstCallArg = onMonthChange.mock.calls[0][0] as Date;
    expect(firstCallArg.getUTCMonth()).toBe(4); // May
  });
});
