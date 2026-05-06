import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PALETTE,
  resolvePaletteFromCssVars,
} from '../resolvePalette';

describe('resolvePaletteFromCssVars', () => {
  it('returns defaults when no CSS vars are set on the element', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    try {
      const palette = resolvePaletteFromCssVars(el);
      // Empty CSS vars fall back to the performance-theme defaults.
      expect(palette).toEqual(DEFAULT_PALETTE);
    } finally {
      document.body.removeChild(el);
    }
  });

  it('reads custom CSS vars from the element', () => {
    const el = document.createElement('div');
    el.style.setProperty('--surface', '#abcdef');
    el.style.setProperty('--glow', 'rgb(255, 0, 0)');
    el.style.setProperty('--type-display', '"Custom Font", serif');
    document.body.appendChild(el);
    try {
      const palette = resolvePaletteFromCssVars(el);
      expect(palette.surface).toBe('#abcdef');
      expect(palette.glow).toBe('rgb(255, 0, 0)');
      expect(palette.displayFont).toBe('"Custom Font", serif');
      // Untouched tokens fall back.
      expect(palette.accent).toBe(DEFAULT_PALETTE.accent);
    } finally {
      document.body.removeChild(el);
    }
  });

  it('returns defaults when called with null root', () => {
    const palette = resolvePaletteFromCssVars(null);
    expect(palette).toEqual(DEFAULT_PALETTE);
  });
});
