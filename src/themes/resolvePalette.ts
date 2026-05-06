/**
 * Theme palette resolver (S4 §T09).
 *
 * Reads CSS custom properties from a live element so the canvas-based
 * WisdomCard renderer can use the same palette as the rest of the UI.
 *
 * Always provides hard-coded fallbacks per token — Webkit returns an empty
 * string for `getComputedStyle().getPropertyValue('--x')` during the first
 * paint of the document (R6).
 */

export interface ResolvedPalette {
  surface: string;
  surfaceElev: string;
  ink: string;
  moon: string;
  glow: string;
  mist: string;
  accent: string;
  moonTint: string;
  /** CSS font-family stack for display copy (matches the active theme). */
  displayFont: string;
  /** CSS font-family stack for body copy. */
  bodyFont: string;
}

/** Hard-coded performance-theme defaults — used when CSS vars are empty. */
export const DEFAULT_PALETTE: ResolvedPalette = {
  surface: '#0b1020',
  surfaceElev: '#11182e',
  ink: '#0a0d18',
  moon: '#e8e4d2',
  glow: '#f4efd9',
  mist: '#8ea3c4',
  accent: '#7dd3fc',
  moonTint: '#bae6fd',
  displayFont: '"Inter", system-ui, sans-serif',
  bodyFont: '"Inter", system-ui, sans-serif',
};

/**
 * Resolve theme tokens from CSS custom properties on `root` (defaults to
 * `<html>`). Falls back to the performance-theme defaults for any token that
 * the platform reports as empty.
 */
export function resolvePaletteFromCssVars(
  root: HTMLElement | null = typeof document !== 'undefined'
    ? document.documentElement
    : null,
): ResolvedPalette {
  if (!root || typeof window === 'undefined' || !window.getComputedStyle) {
    return DEFAULT_PALETTE;
  }
  const cs = window.getComputedStyle(root);
  const read = (name: string, fallback: string): string => {
    const raw = cs.getPropertyValue(name).trim();
    return raw.length > 0 ? raw : fallback;
  };
  return {
    surface: read('--surface', DEFAULT_PALETTE.surface),
    surfaceElev: read('--surface-elev', DEFAULT_PALETTE.surfaceElev),
    ink: read('--ink', DEFAULT_PALETTE.ink),
    moon: read('--moon', DEFAULT_PALETTE.moon),
    glow: read('--glow', DEFAULT_PALETTE.glow),
    mist: read('--mist', DEFAULT_PALETTE.mist),
    accent: read('--accent', DEFAULT_PALETTE.accent),
    moonTint: read('--moon-tint', DEFAULT_PALETTE.moonTint),
    displayFont: read('--type-display', DEFAULT_PALETTE.displayFont),
    bodyFont: read('--type-body', DEFAULT_PALETTE.bodyFont),
  };
}
