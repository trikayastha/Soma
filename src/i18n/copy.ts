import type { Voice } from '../lib/types';

/**
 * Voice-keyed copy catalog.
 *
 * Every key has a value for all three voices. Use {@link t} to look up a
 * key against the active voice. Tokens like `{hours}` or `{percent}` are
 * substituted by callers (or via {@link tFormat}).
 *
 * Adding a new key:
 *   1. Add to `CopyKey` union below.
 *   2. Add an entry to `COPY` with all three voices populated.
 *   3. Run `npm test` — `copy.test.ts` will fail-fast on any missing voice.
 */

export interface CopyEntry {
  scientific: string;
  traditional: string;
  coach: string;
}

export type CopyKey =
  // Today greetings (5)
  | 'today.greeting.morning'
  | 'today.greeting.afternoon'
  | 'today.greeting.evening'
  | 'today.greeting.night'
  | 'today.greeting.lateNight'
  // Today selected day (3)
  | 'today.whyThisDay.toggle'
  | 'today.fast.subtitle'
  | 'today.regular.body'
  // FastTimer (8)
  | 'fast.timer.label'
  | 'fast.start.cta'
  | 'fast.complete.cta'
  | 'fast.meditation.cta'
  | 'fast.endEarly.cta'
  | 'fast.endEarly.confirm'
  | 'fast.progress.label'
  | 'fast.active.title'
  // Onboarding step titles (5)
  | 'onboarding.welcome.title'
  | 'onboarding.you.title'
  | 'onboarding.exp.title'
  | 'onboarding.safety.title'
  | 'onboarding.intensity.title'
  // Settings sections (4)
  | 'settings.title'
  | 'settings.profile.label'
  | 'settings.intensity.label'
  | 'settings.data.label';

export type CopyCatalog = Record<CopyKey, CopyEntry>;

export const COPY: CopyCatalog = {
  // Today greetings (5)
  'today.greeting.morning': {
    coach: 'Good morning',
    scientific: 'Morning window',
    traditional: 'Suprabhatam',
  },
  'today.greeting.afternoon': {
    coach: 'Good afternoon',
    scientific: 'Afternoon window',
    traditional: 'Madhyahna namaskar',
  },
  'today.greeting.evening': {
    coach: 'Good evening',
    scientific: 'Evening window',
    traditional: 'Sandhya namaskar',
  },
  'today.greeting.night': {
    coach: 'Quiet night',
    scientific: 'Night phase',
    traditional: 'Shubh ratri',
  },
  'today.greeting.lateNight': {
    coach: 'Peace of the night',
    scientific: 'Late night phase',
    traditional: 'Nishakaal shanti',
  },

  // Today selected day (3)
  'today.whyThisDay.toggle': {
    coach: 'Why this day?',
    scientific: 'Mechanism & evidence',
    traditional: 'Significance of this tithi',
  },
  'today.fast.subtitle': {
    coach: '{hours}-hour fast · paired with a 10-minute meditation',
    scientific:
      '{hours}h time-restricted eating · 10-min focused-attention practice',
    traditional: '{hours}-ghanta upavasa · with dhyana for ten minutes',
  },
  'today.regular.body': {
    coach:
      'Rest days matter. The rhythm is the practice — not every day has to be a fast day.',
    scientific:
      'Recovery is part of the protocol. Periodicity outperforms intensity.',
    traditional:
      'Days between vrats are also sacred — the rhythm itself is the sadhana.',
  },

  // FastTimer (8)
  'fast.timer.label': {
    coach: 'Fasting · {hours}h',
    scientific: 'TRE active · {hours}h window',
    traditional: 'Upavasa · {hours} ghanta',
  },
  'fast.start.cta': {
    coach: 'Begin fast',
    scientific: 'Begin protocol',
    traditional: 'Begin vrat',
  },
  'fast.complete.cta': {
    coach: 'Complete fast',
    scientific: 'Mark protocol complete',
    traditional: 'Complete vrat',
  },
  'fast.meditation.cta': {
    coach: 'Begin 10-minute meditation',
    scientific: 'Start 10-min focused-attention session',
    traditional: 'Begin dhyana — ten minutes',
  },
  'fast.endEarly.cta': {
    coach: 'End fast early',
    scientific: 'Abort protocol',
    traditional: 'End vrat early',
  },
  'fast.endEarly.confirm': {
    coach: 'End this fast early? It will be marked as aborted.',
    scientific: 'Abort the protocol? The session will be flagged incomplete.',
    traditional:
      'End this vrat before its time? It will be recorded as broken.',
  },
  'fast.progress.label': {
    coach: '{percent}% complete',
    scientific: '{percent}% of window elapsed',
    traditional: '{percent}% of vrat observed',
  },
  'fast.active.title': {
    coach: "You're fasting",
    scientific: 'Protocol active',
    traditional: 'Vrat in progress',
  },

  // Onboarding step titles (5)
  'onboarding.welcome.title': {
    coach: 'Moon for Mental Performance',
    scientific: 'A circalunar protocol for cognition',
    traditional: 'Chandra-anushasana — practice with the moon',
  },
  'onboarding.you.title': {
    coach: 'Tell us who you are',
    scientific: 'Profile setup',
    traditional: 'Introduce yourself, sadhaka',
  },
  'onboarding.exp.title': {
    coach: 'Your experience',
    scientific: 'Baseline assessment',
    traditional: 'Your sadhana so far',
  },
  'onboarding.safety.title': {
    coach: 'A few safety checks',
    scientific: 'Contraindication screen',
    traditional: 'Care for the body first',
  },
  'onboarding.intensity.title': {
    coach: 'Pick your intensity',
    scientific: 'Choose fasting window',
    traditional: 'Choose the depth of your vrat',
  },

  // Settings sections (4)
  'settings.title': {
    coach: 'Settings',
    scientific: 'Configuration',
    traditional: 'Preferences',
  },
  'settings.profile.label': {
    coach: 'Profile',
    scientific: 'Profile',
    traditional: 'About you',
  },
  'settings.intensity.label': {
    coach: 'Default intensity',
    scientific: 'Default window length',
    traditional: 'Default vrat depth',
  },
  'settings.data.label': {
    coach: 'Data',
    scientific: 'Data',
    traditional: 'Your records',
  },
};

export const COPY_KEYS: readonly CopyKey[] = Object.keys(COPY) as CopyKey[];

/** Return the copy string for `key` rendered in `voice`. */
export function t(key: CopyKey, voice: Voice): string {
  return COPY[key][voice];
}

/**
 * Look up `key` in `voice`, then substitute `{token}` placeholders.
 * Unknown tokens are left untouched. Numeric tokens are coerced via String().
 */
export function tFormat(
  key: CopyKey,
  voice: Voice,
  tokens: Readonly<Record<string, string | number>>,
): string {
  const raw = t(key, voice);
  return raw.replace(/\{(\w+)\}/g, (full, name: string) =>
    name in tokens ? String(tokens[name]) : full,
  );
}
