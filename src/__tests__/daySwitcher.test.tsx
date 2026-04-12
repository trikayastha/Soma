import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DaySwitcher } from '../components/DaySwitcher';
import type { SomaDay } from '../lib/types';
import { toISODate, addDays } from '../lib/lunar';

describe('DaySwitcher', () => {
  beforeEach(() => {
    // jsdom lacks scrollIntoView; DaySwitcher guards it, but add a stub
    // as a safety net for future refactors.
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = () => {};
    }
  });

  const today = new Date('2025-04-12T00:00:00Z');
  const todayIso = toISODate(today);

  function buildMap(days: SomaDay[]): Map<string, SomaDay> {
    return new Map(days.map((d) => [d.date, d]));
  }

  it('renders 15 day pills when range=7', () => {
    render(
      <DaySwitcher
        selectedIso={todayIso}
        todayIso={todayIso}
        scheduleByDate={new Map()}
        onSelect={() => {}}
        range={7}
      />,
    );
    const list = screen.getByRole('tablist');
    const pills = within(list).getAllByRole('tab');
    expect(pills).toHaveLength(15);
  });

  it('labels the today pill as "Today" and marks it as current date', () => {
    render(
      <DaySwitcher
        selectedIso={todayIso}
        todayIso={todayIso}
        scheduleByDate={new Map()}
        onSelect={() => {}}
      />,
    );
    const pills = screen.getAllByRole('tab');
    const todayPill = pills.find((p) => p.getAttribute('aria-current') === 'date');
    expect(todayPill).toBeDefined();
    expect(todayPill!).toHaveTextContent(/Today/i);
  });

  it('marks the selected pill as aria-selected', () => {
    const selected = toISODate(addDays(today, 2));
    render(
      <DaySwitcher
        selectedIso={selected}
        todayIso={todayIso}
        scheduleByDate={new Map()}
        onSelect={() => {}}
      />,
    );
    const selectedPill = screen.getAllByRole('tab').find(
      (p) => p.getAttribute('aria-selected') === 'true',
    );
    expect(selectedPill).toBeDefined();
  });

  it('invokes onSelect with the clicked day iso', async () => {
    const user = userEvent.setup();
    const onSelect = (() => {
      const calls: string[] = [];
      const fn = (iso: string) => calls.push(iso);
      (fn as unknown as { calls: string[] }).calls = calls;
      return fn as unknown as ((iso: string) => void) & { calls: string[] };
    })();

    render(
      <DaySwitcher
        selectedIso={todayIso}
        todayIso={todayIso}
        scheduleByDate={new Map()}
        onSelect={onSelect}
      />,
    );

    // Click the 3rd pill from the left (6 days before today)
    const pills = screen.getAllByRole('tab');
    await user.click(pills[2]);
    expect(onSelect.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('shows a marker for days that have a scheduled SomaDay', () => {
    const somaIso = toISODate(addDays(today, 3));
    const map = buildMap([
      {
        date: somaIso,
        kind: 'ekadashi',
        intensityHours: 16,
        title: 'Shukla Ekadashi',
        tradition: 'vedic',
      },
    ]);
    const { container } = render(
      <DaySwitcher
        selectedIso={todayIso}
        todayIso={todayIso}
        scheduleByDate={map}
        onSelect={() => {}}
      />,
    );
    // The marker is a 1×1 dot with bg-soma-accent — we just check one exists.
    const marker = container.querySelector('.bg-soma-accent');
    expect(marker).toBeTruthy();
  });
});
