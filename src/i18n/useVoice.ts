import { useCallback } from 'react';
import { useAppState } from '../state/AppStateContext';
import type { Voice } from '../lib/types';
import { t as tRaw, tFormat as tFormatRaw, type CopyKey } from './copy';

export interface UseVoiceResult {
  voice: Voice;
  /** Look up `key` against the active voice. */
  t: (key: CopyKey) => string;
  /** Look up `key` against the active voice and substitute `{token}` placeholders. */
  tFormat: (
    key: CopyKey,
    tokens: Readonly<Record<string, string | number>>,
  ) => string;
}

/**
 * Hook returning the active voice and pre-bound `t` / `tFormat` helpers.
 * Re-renders consumers when the user changes voice in Settings.
 */
export function useVoice(): UseVoiceResult {
  const { state } = useAppState();
  const voice = state.preferences.voice;

  const t = useCallback((key: CopyKey) => tRaw(key, voice), [voice]);
  const tFormat = useCallback(
    (key: CopyKey, tokens: Readonly<Record<string, string | number>>) =>
      tFormatRaw(key, voice, tokens),
    [voice],
  );

  return { voice, t, tFormat };
}
