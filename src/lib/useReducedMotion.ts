import { useEffect, useState } from 'react';

/**
 * `prefers-reduced-motion` matchMedia hook (S4 §T18).
 *
 * Initial value reads synchronously from `matchMedia` so the first paint
 * matches the OS-level preference. Subscribes via `addEventListener` with a
 * legacy `addListener` fallback for iOS Safari ≤13 (R4).
 *
 * SSR-safe: returns `false` when `window` is unavailable.
 */
export function useReducedMotion(): boolean {
  const [prefers, setPrefers] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent): void => setPrefers(e.matches);
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
    // Legacy iOS Safari ≤13: addListener / removeListener.
    type LegacyMQL = MediaQueryList & {
      addListener: (cb: (e: MediaQueryListEvent) => void) => void;
      removeListener: (cb: (e: MediaQueryListEvent) => void) => void;
    };
    const legacy = mq as LegacyMQL;
    legacy.addListener(handler);
    return () => legacy.removeListener(handler);
  }, []);

  return prefers;
}
