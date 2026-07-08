import { describe, it, expect, vi, beforeEach } from 'vitest';

// The wrapper's core contract: analytics failures must never surface to the
// caller. We mock the PostHog module so both init and capture can throw, then
// assert our wrapper swallows everything.
const capture = vi.fn();
const identifyFn = vi.fn();
const getDistinctId = vi.fn(() => 'distinct-1');
const initPostHog = vi.fn();

vi.mock('../posthog', () => ({
  initPostHog: (...args: unknown[]) => initPostHog(...args),
  posthog: {
    capture: (...args: unknown[]) => capture(...args),
    identify: (...args: unknown[]) => identifyFn(...args),
    get_distinct_id: () => getDistinctId(),
  },
}));

describe('analytics wrapper', () => {
  beforeEach(() => {
    capture.mockReset();
    identifyFn.mockReset();
    initPostHog.mockReset();
  });

  it('forwards event name and props to posthog.capture()', async () => {
    const { track } = await import('../analytics');
    track('fast_started', { kind: 'ekadashi', first: true });
    expect(capture).toHaveBeenCalledWith('fast_started', {
      kind: 'ekadashi',
      first: true,
    });
  });

  it('never throws when posthog.capture() throws', async () => {
    capture.mockImplementation(() => {
      throw new Error('network down');
    });
    const { track } = await import('../analytics');
    expect(() => track('app_opened')).not.toThrow();
  });

  it('never throws when initPostHog() throws', async () => {
    initPostHog.mockImplementation(() => {
      throw new Error('init blocked');
    });
    const { initAnalytics } = await import('../analytics');
    expect(() => initAnalytics()).not.toThrow();
  });

  it('never throws when identify fails', async () => {
    identifyFn.mockImplementation(() => {
      throw new Error('identify blocked');
    });
    const { identify } = await import('../analytics');
    expect(() => identify({ goal: 'focus' })).not.toThrow();
  });
});
