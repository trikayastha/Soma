import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComputedAtBanner } from '../ComputedAtBanner';
import type { Location } from '../../lib/types';

const KATHMANDU: Location = {
  lat: 27.7172,
  lon: 85.324,
  label: 'Kathmandu',
  slug: 'kathmandu',
  tz: 'Asia/Kathmandu',
  countryCode: 'NP',
};

describe('ComputedAtBanner', () => {
  it('renders the sunrise mode with city + source attribution', () => {
    render(
      <ComputedAtBanner
        accuracy="sunrise"
        sunriseAt={new Date('2026-04-28T00:55:00Z')}
        location={KATHMANDU}
      />,
    );
    expect(screen.getByText(/Computed at sunrise/i)).toBeInTheDocument();
    expect(screen.getByText(/Kathmandu/i)).toBeInTheDocument();
    expect(screen.getByText(/astronomy-engine/i)).toBeInTheDocument();
  });

  it('renders the approximate prompt with a clickable affordance', () => {
    render(<ComputedAtBanner accuracy="approximate" />);
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent(/Set your location/i);
  });

  it('renders the polar-fallback message', () => {
    render(<ComputedAtBanner accuracy="polar-fallback" />);
    expect(screen.getByText(/Polar region/i)).toBeInTheDocument();
  });
});
