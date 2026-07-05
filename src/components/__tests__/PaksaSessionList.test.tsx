import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PaksaSessionList } from '../PaksaSessionList';
import type { FastSession, SomaDay } from '../../lib/types';

function session(overrides: Partial<FastSession> = {}): FastSession {
  return {
    id: 's1',
    dayDate: '2026-01-05',
    intensityHours: 16,
    plannedStart: '2026-01-05T06:00:00Z',
    plannedEnd: '2026-01-05T22:00:00Z',
    startedAt: '2026-01-05T06:00:00Z',
    completedAt: '2026-01-05T22:00:00Z',
    status: 'completed',
    preLog: null,
    postLog: null,
    ...overrides,
  } as FastSession;
}

function day(overrides: Partial<SomaDay> = {}): SomaDay {
  return {
    date: '2026-01-05',
    kind: 'ekadashi',
    intensityHours: 16,
    title: 'Shukla Ekadashi',
    tradition: 'vedic',
    tithi: { index: 11, paksha: 'shukla' } as SomaDay['tithi'],
    ...overrides,
  } as SomaDay;
}

describe('PaksaSessionList', () => {
  it('renders empty messages for both columns when no sessions', () => {
    render(<PaksaSessionList sessions={[]} schedule={[]} />);
    expect(screen.getByText('Shukla')).toBeInTheDocument();
    expect(screen.getByText('Krishna')).toBeInTheDocument();
    expect(screen.getAllByText(/No sessions yet/i)).toHaveLength(2);
  });

  it('routes a shukla-paksha session to the Shukla column', () => {
    const s = session({ id: 'a', dayDate: '2026-01-05' });
    const d = day({ date: '2026-01-05', tithi: { index: 11, paksha: 'shukla' } as SomaDay['tithi'] });
    render(<PaksaSessionList sessions={[s]} schedule={[d]} />);
    expect(screen.getByText('2026-01-05')).toBeInTheDocument();
  });

  it('only counts completed and late-completed sessions', () => {
    const aborted = session({ id: 'a', dayDate: '2026-01-05', status: 'aborted' });
    const lc = session({ id: 'b', dayDate: '2026-01-19', status: 'late-completed' });
    const sched = [
      day({ date: '2026-01-05', tithi: { index: 11, paksha: 'shukla' } as SomaDay['tithi'] }),
      day({ date: '2026-01-19', tithi: { index: 11, paksha: 'krishna' } as SomaDay['tithi'] }),
    ];
    render(<PaksaSessionList sessions={[aborted, lc]} schedule={sched} />);
    expect(screen.getByText('2026-01-19')).toBeInTheDocument();
    expect(screen.queryByText('2026-01-05')).toBeNull();
  });
});
