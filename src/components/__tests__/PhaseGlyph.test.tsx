import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { PhaseGlyph } from '../PhaseGlyph';

describe('PhaseGlyph', () => {
  it('renders an aria-labelled svg', () => {
    const { getByRole } = render(
      <PhaseGlyph illumination={0.5} waxing={true} />,
    );
    const svg = getByRole('img');
    expect(svg).toHaveAttribute('aria-label');
    expect(svg.getAttribute('aria-label')).toMatch(/50% illuminated/i);
    expect(svg.getAttribute('aria-label')).toMatch(/waxing/i);
  });

  it('uses the supplied size', () => {
    const { container } = render(
      <PhaseGlyph illumination={0.5} waxing={true} size={48} />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('height', '48');
  });

  it('emits a half-disc path for crescents (illum < 0.5)', () => {
    const { container } = render(
      <PhaseGlyph illumination={0.2} waxing={true} />,
    );
    const path = container.querySelector('path');
    expect(path).not.toBeNull();
  });

  it('omits the half-disc path for gibbous (illum >= 0.5)', () => {
    const { container } = render(
      <PhaseGlyph illumination={0.8} waxing={true} />,
    );
    const path = container.querySelector('path');
    expect(path).toBeNull();
  });

  it('renders only the lit disc at full moon (illum = 1)', () => {
    const { container } = render(
      <PhaseGlyph illumination={1} waxing={true} />,
    );
    expect(container.querySelector('circle')).not.toBeNull();
    expect(container.querySelector('ellipse')).toBeNull();
  });
});
