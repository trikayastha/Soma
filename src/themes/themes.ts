import type { Theme } from '../lib/types';

/**
 * Theme registry — UI-facing labels and short descriptions used in
 * Settings. The actual color tokens live in `themes.css` under
 * `[data-theme="..."]` selectors and are surfaced through Tailwind's
 * theme.extend.colors using `var(--token)` references.
 */
export interface ThemeMeta {
  id: Theme;
  label: string;
  sub: string;
}

export const THEMES: readonly ThemeMeta[] = [
  {
    id: 'performance',
    label: 'Performance',
    sub: 'Cool ink, data-forward, modern type',
  },
  {
    id: 'devotional',
    label: 'Devotional',
    sub: 'Warm ink, gold accent, serif type',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    sub: 'Mono palette, low chrome',
  },
] as const;

export const THEME_IDS: readonly Theme[] = THEMES.map((t) => t.id);

/** Names of every CSS variable a theme is expected to define. */
export const THEME_TOKENS = [
  '--surface',
  '--surface-elev',
  '--ink',
  '--moon',
  '--glow',
  '--mist',
  '--accent',
  '--moon-tint',
  '--crimson',
  '--type-display',
  '--type-body',
  '--data-emphasis',
] as const;

export type ThemeToken = (typeof THEME_TOKENS)[number];
