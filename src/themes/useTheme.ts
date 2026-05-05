import { useEffect } from 'react';
import { useAppState } from '../state/AppStateContext';
import type { Theme } from '../lib/types';

export interface UseThemeResult {
  theme: Theme;
}

/**
 * Mounts the active theme onto `<html data-theme="...">` so that the
 * CSS variable cascade in `themes.css` resolves correctly. Re-runs when
 * the user changes theme in Settings or the Intent Router.
 *
 * Note: this is CSR-only. If we add SSR later we'll need to hydrate the
 * attribute server-side to avoid a flash of unthemed content (see H10).
 */
export function useTheme(): UseThemeResult {
  const { state } = useAppState();
  const theme = state.preferences.theme;

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
  }, [theme]);

  return { theme };
}
