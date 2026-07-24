import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnergyArchetype } from '../EnergyArchetype';

const track = vi.fn();
vi.mock('../../lib/analytics', () => ({
  track: (...args: unknown[]) => track(...args),
}));

describe('EnergyArchetype analytics (N9 archetype_started)', () => {
  beforeEach(() => track.mockReset());

  it('fires archetype_started with the launch source when the quiz begins', async () => {
    const user = userEvent.setup();
    render(<EnergyArchetype onComplete={() => {}} source="settings" />);
    await user.click(screen.getByRole('button', { name: /Begin quiz/i }));
    expect(track).toHaveBeenCalledWith('archetype_started', { source: 'settings' });
  });

  it('does not fire on the intro screen before the user begins', () => {
    render(<EnergyArchetype onComplete={() => {}} source="settings" />);
    expect(track).not.toHaveBeenCalled();
  });

  it('defaults source to settings when unspecified', async () => {
    const user = userEvent.setup();
    render(<EnergyArchetype onComplete={() => {}} />);
    await user.click(screen.getByRole('button', { name: /Begin quiz/i }));
    expect(track).toHaveBeenCalledWith('archetype_started', { source: 'settings' });
  });
});
