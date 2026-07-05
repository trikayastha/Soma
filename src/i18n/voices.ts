import type { Voice } from '../lib/types';

/**
 * Registry of voice ids → presentation metadata used in Settings UI.
 * Keep aligned with the {@link Voice} union in `lib/types.ts`.
 */
export interface VoiceMeta {
  id: Voice;
  label: string;
  sub: string;
}

export const VOICES: readonly VoiceMeta[] = [
  { id: 'coach', label: 'Coach', sub: 'Plain, warm, encouraging' },
  {
    id: 'scientific',
    label: 'Scientific',
    sub: 'Mechanism-first, evidence-leaning',
  },
  {
    id: 'traditional',
    label: 'Traditional',
    sub: 'Lineage vocabulary, devotional tone',
  },
] as const;

export const VOICE_IDS: readonly Voice[] = VOICES.map((v) => v.id);
