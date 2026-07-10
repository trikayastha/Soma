/**
 * Font loading helpers (S4 §T10).
 *
 * The WisdomCard canvas renderer must wait for the active display font to
 * be available before drawing tithi labels — otherwise Manjari silently
 * falls back to the system font, producing a shareable PNG that looks
 * nothing like the in-app preview.
 *
 * `document.fonts.load()` returns a Promise that resolves when the requested
 * font face is ready. We race it against a short timeout (300ms) so the
 * renderer never hangs on a slow or failed font fetch.
 */

const FONT_LOAD_TIMEOUT_MS = 300;

/**
 * Wait for `family` (a CSS font-family string) at the given size to be ready,
 * up to FONT_LOAD_TIMEOUT_MS. Resolves true if loaded, false on timeout.
 */
export async function ensureFontLoaded(
  family: string,
  sizePx = 56,
): Promise<boolean> {
  if (typeof document === 'undefined' || !document.fonts) return false;
  const spec = `${sizePx}px ${family}`;
  try {
    const loaded = document.fonts.load(spec);
    const winner = await Promise.race([
      loaded.then(() => 'loaded' as const),
      new Promise<'timeout'>((resolve) =>
        setTimeout(() => resolve('timeout'), FONT_LOAD_TIMEOUT_MS),
      ),
    ]);
    if (winner === 'timeout') return false;
    return document.fonts.check(spec);
  } catch {
    return false;
  }
}
