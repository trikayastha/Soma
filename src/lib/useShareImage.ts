import { useCallback, useState } from 'react';
import type { WisdomCardOutput } from './wisdomCard';

/**
 * Web Share + download fallback hook (S4 §T12).
 *
 * Decision tree (R2, R3, R13):
 *   1. If `navigator.canShare?.({ files })` is true → `navigator.share({ files, title, text })`.
 *   2. Else if `navigator.share` exists → `navigator.share({ title, text, url })` (no files).
 *   3. Else → create a hidden `<a download>` and click it.
 *
 * AbortError from the user dismissing the native share sheet is reported as
 * `'cancelled'` — not an error. Other rejections fall through to the
 * download branch so users always end up with a copy of their card.
 */

export type ShareResult = 'shared' | 'downloaded' | 'cancelled';

export interface UseShareImageResult {
  /** Trigger share for the supplied output. Resolves to the path taken. */
  share: (output: WisdomCardOutput) => Promise<ShareResult>;
  /** Lifecycle indicator — `idle | sharing | error`. */
  status: 'idle' | 'sharing' | 'error';
  /** Last user-facing error message, if any. */
  error: string | null;
}

const SHARE_TITLE = 'Soma — moon-paced fasting';
const SHARE_TEXT =
  "A small wisdom from today's lunar day. Fast with the moon — somaa.vercel.app";
/** Canonical link shared when no image can be attached (text-share fallback). */
const SHARE_URL = 'https://somaa.vercel.app';
/** Web Share API rejects PNGs above ~5MB on iOS — guard up front. */
const MAX_FILE_BYTES = 5_000_000;

interface ShareableNavigator {
  canShare?: (data?: ShareData) => boolean;
  share?: (data?: ShareData) => Promise<void>;
}

function getNavigator(): ShareableNavigator | null {
  if (typeof navigator === 'undefined') return null;
  return navigator as unknown as ShareableNavigator;
}

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

async function tryShareFile(
  nav: ShareableNavigator,
  output: WisdomCardOutput,
): Promise<ShareResult | null> {
  if (!nav.share) return null;
  if (output.blob.size > MAX_FILE_BYTES) return null;
  const file = new File([output.blob], output.filename, {
    type: output.blob.type || 'image/png',
  });
  // canShare may not exist (older Safari) — try anyway when share exists.
  let canShare = false;
  try {
    canShare = nav.canShare ? nav.canShare({ files: [file] }) : true;
  } catch {
    canShare = false;
  }
  if (!canShare) return null;
  try {
    await nav.share({ files: [file], title: SHARE_TITLE, text: SHARE_TEXT });
    return 'shared';
  } catch (err) {
    if (isAbortError(err)) return 'cancelled';
    // Other failures fall through to text-share / download.
    return null;
  }
}

async function tryShareText(
  nav: ShareableNavigator,
): Promise<ShareResult | null> {
  if (!nav.share) return null;
  try {
    await nav.share({
      title: SHARE_TITLE,
      text: SHARE_TEXT,
      url: SHARE_URL,
    });
    return 'shared';
  } catch (err) {
    if (isAbortError(err)) return 'cancelled';
    return null;
  }
}

function downloadFile(output: WisdomCardOutput): ShareResult {
  if (typeof document === 'undefined') {
    throw new Error('Download fallback unavailable (no document)');
  }
  const url = URL.createObjectURL(output.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = output.filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return 'downloaded';
}

export function useShareImage(): UseShareImageResult {
  const [status, setStatus] = useState<UseShareImageResult['status']>('idle');
  const [error, setError] = useState<string | null>(null);

  const share = useCallback(
    async (output: WisdomCardOutput): Promise<ShareResult> => {
      setStatus('sharing');
      setError(null);
      try {
        const nav = getNavigator();
        if (nav) {
          const fileResult = await tryShareFile(nav, output);
          if (fileResult) {
            setStatus('idle');
            return fileResult;
          }
          const textResult = await tryShareText(nav);
          if (textResult) {
            setStatus('idle');
            return textResult;
          }
        }
        const result = downloadFile(output);
        setStatus('idle');
        return result;
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : 'Share failed unexpectedly.';
        setError(msg);
        setStatus('error');
        throw err;
      }
    },
    [],
  );

  return { share, status, error };
}
