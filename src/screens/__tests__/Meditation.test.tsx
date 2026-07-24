import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { Meditation } from '../Meditation';

// jsdom has no AudioContext; Meditation.startAudio() guards on its absence, so
// no stub is needed. This test only exercises the completion timer + callback.

describe('Meditation completion (N4 meditation_completed)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('fires onComplete once with the full duration when the timer runs out', () => {
    const onComplete = vi.fn();
    render(<Meditation onExit={() => {}} durationSeconds={3} onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('button', { name: 'Begin' }));

    // Advance past the full 3-second session (interval ticks once per second).
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete).toHaveBeenCalledWith(3);
  });

  it('does not fire onComplete before the session ends', () => {
    const onComplete = vi.fn();
    render(<Meditation onExit={() => {}} durationSeconds={10} onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('button', { name: 'Begin' }));
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onComplete).not.toHaveBeenCalled();
  });
});
