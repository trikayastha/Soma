import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhaseRhythmStrip } from '../PhaseRhythmStrip';

describe('PhaseRhythmStrip', () => {
  it('exposes the tithi index via aria-valuenow', () => {
    render(<PhaseRhythmStrip index={11} />);
    const slider = screen.getByRole('slider', { name: /lunar phase/i });
    expect(slider).toHaveAttribute('aria-valuemin', '1');
    expect(slider).toHaveAttribute('aria-valuemax', '30');
    expect(slider).toHaveAttribute('aria-valuenow', '11');
  });

  it('clamps out-of-range indices', () => {
    const { rerender } = render(<PhaseRhythmStrip index={0} />);
    expect(
      screen.getByRole('slider', { name: /lunar phase/i }),
    ).toHaveAttribute('aria-valuenow', '1');
    rerender(<PhaseRhythmStrip index={99} />);
    expect(
      screen.getByRole('slider', { name: /lunar phase/i }),
    ).toHaveAttribute('aria-valuenow', '30');
  });

  it('positions the marker at the correct cx for index 1, 15, 30', () => {
    const positions: Record<number, number> = {};
    for (const idx of [1, 15, 30]) {
      const { container, unmount } = render(<PhaseRhythmStrip index={idx} />);
      const circle = container.querySelector('circle');
      positions[idx] = Number(circle?.getAttribute('cx'));
      unmount();
    }
    expect(positions[1]).toBeCloseTo(0, 5);
    // 15 → (15-1)/29 * 320 ≈ 154.48
    expect(positions[15]).toBeGreaterThan(150);
    expect(positions[15]).toBeLessThan(160);
    expect(positions[30]).toBeCloseTo(320, 5);
  });

  it('fires onTap when the strip is clicked', async () => {
    const user = userEvent.setup();
    const onTap = vi.fn();
    render(<PhaseRhythmStrip index={5} onTap={onTap} />);
    await user.click(screen.getByRole('button', { name: /jump to today/i }));
    expect(onTap).toHaveBeenCalledTimes(1);
  });
});
