import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SyncedNowPill } from '../components/SyncedNowPill';

describe('SyncedNowPill', () => {
  it('renders nothing for non-observance kinds', () => {
    const { container } = render(
      <SyncedNowPill kind="chaturthi" now={new Date('2026-04-29T13:30:00Z')} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when kind is null', () => {
    const { container } = render(
      <SyncedNowPill kind={null} now={new Date('2026-04-29T13:30:00Z')} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a numeric synced-now count for ekadashi', () => {
    render(
      <SyncedNowPill kind="ekadashi" now={new Date('2026-04-29T13:30:00Z')} />,
    );
    const pill = screen.getByRole('status');
    expect(pill.textContent).toMatch(/synced now/i);
    expect(pill.textContent).toMatch(/[\d,]+/);
  });

  it('exposes an a11y label with the count', () => {
    render(
      <SyncedNowPill kind="full-moon" now={new Date('2026-04-29T13:30:00Z')} />,
    );
    const pill = screen.getByRole('status');
    expect(pill.getAttribute('aria-label')).toMatch(/people observing today/i);
  });

  it('produces the same DOM for the same minute', () => {
    const a = render(
      <SyncedNowPill kind="ekadashi" now={new Date('2026-04-29T13:30:00Z')} />,
    );
    const aText = a.getByRole('status').textContent;
    a.unmount();
    const b = render(
      <SyncedNowPill kind="ekadashi" now={new Date('2026-04-29T13:30:00Z')} />,
    );
    expect(b.getByRole('status').textContent).toBe(aText);
  });
});
