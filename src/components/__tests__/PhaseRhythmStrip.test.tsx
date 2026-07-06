import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhaseRhythmStrip } from '../PhaseRhythmStrip';

describe('PhaseRhythmStrip', () => {
  it('exposes the tithi index via aria-valuenow', () => {
    render(<PhaseRhythmStrip index={11} illumination={0.5} waxing />);
    const slider = screen.getByRole('slider', { name: /lunar phase/i });
    expect(slider).toHaveAttribute('aria-valuemin', '1');
    expect(slider).toHaveAttribute('aria-valuemax', '30');
    expect(slider).toHaveAttribute('aria-valuenow', '11');
  });

  it('clamps out-of-range indices', () => {
    const { rerender } = render(
      <PhaseRhythmStrip index={0} illumination={0} waxing />,
    );
    expect(
      screen.getByRole('slider', { name: /lunar phase/i }),
    ).toHaveAttribute('aria-valuenow', '1');
    rerender(<PhaseRhythmStrip index={99} illumination={0} waxing />);
    expect(
      screen.getByRole('slider', { name: /lunar phase/i }),
    ).toHaveAttribute('aria-valuenow', '30');
  });

  it('positions the moon marker at the correct offset for index 1, 15, 30', () => {
    const positions: Record<number, number> = {};
    for (const idx of [1, 15, 30]) {
      const { unmount } = render(
        <PhaseRhythmStrip index={idx} illumination={0.5} waxing />,
      );
      const marker = screen.getByTestId('phase-strip-marker');
      positions[idx] = parseFloat(marker.style.left);
      unmount();
    }
    expect(positions[1]).toBeCloseTo(0, 5);
    // 15 → (15-1)/29 * 100 ≈ 48.28%
    expect(positions[15]).toBeGreaterThan(47);
    expect(positions[15]).toBeLessThan(50);
    expect(positions[30]).toBeCloseTo(100, 5);
  });

  it('renders the lunar photograph as the marker', () => {
    render(<PhaseRhythmStrip index={15} illumination={0.98} waxing />);
    const marker = screen.getByTestId('phase-strip-marker');
    expect(marker.querySelector('image')).not.toBeNull();
  });

  it('fires onTap when the strip is clicked', async () => {
    const user = userEvent.setup();
    const onTap = vi.fn();
    render(
      <PhaseRhythmStrip index={5} illumination={0.3} waxing onTap={onTap} />,
    );
    await user.click(screen.getByRole('button', { name: /jump to today/i }));
    expect(onTap).toHaveBeenCalledTimes(1);
  });
});
