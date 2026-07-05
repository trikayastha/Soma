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
  | 'settings.data.label'
  // Mandala / Rhythm / Notification / Late completion (S3, ~22 keys)
  | 'mandala.chip.template'
  | 'mandala.empty.title'
  | 'mandala.reset.cta'
  | 'mandala.reset.confirm'
  | 'rhythm.title'
  | 'rhythm.subtitle'
  | 'rhythm.deltas.empty'
  | 'fast.synced.primary'
  | 'fast.lateComplete.title'
  | 'fast.lateComplete.body'
  | 'fast.lateComplete.cta'
  | 'fast.endEarly.confirm.gentle'
  | 'notif.philosophy.title'
  | 'notif.philosophy.framing'
  | 'notif.philosophy.quiet'
  | 'notif.philosophy.standard'
  | 'notif.philosophy.detailed'
  | 'notif.ekadashi.morning'
  | 'notif.prefast'
  | 'notif.parana'
  | 'notif.pradosh.evening'
  | 'notif.sankashti'
  | 'notif.shivaratri'
  | 'notif.tithi.sunrise'
  | 'notif.reflection';

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

  // Mandala / Rhythm / Notification / Late completion (S3)
  'mandala.chip.template': {
    coach: 'Mandala {n} · {days} of 40 days · {observed} of {expected} fasts',
    scientific: 'Cycle {n} · day {days}/40 · {observed}/{expected} sessions',
    traditional: 'Mandala {n} · {days} dinas of 40 · {observed} vrats of {expected}',
  },
  'mandala.empty.title': {
    coach: 'Your first mandala starts with your first fast.',
    scientific: 'No cycle yet — log a session to seed cycle 1.',
    traditional: 'The mandala awaits your first vrat.',
  },
  'mandala.reset.cta': {
    coach: 'Reset rhythm',
    scientific: 'Reset cycle anchor',
    traditional: 'Begin a new mandala',
  },
  'mandala.reset.confirm': {
    coach: 'Start a new mandala from today? Past cycles stay in your history.',
    scientific: 'Re-anchor cycle 1 to today? Prior cycles are preserved.',
    traditional: 'Begin a fresh mandala from this day? Past mandalas remain in record.',
  },
  'rhythm.title': {
    coach: 'Your rhythm',
    scientific: 'Cycle data',
    traditional: 'Your sadhana',
  },
  'rhythm.subtitle': {
    coach: 'Forty-day mandalas. Patterns from your own data.',
    scientific: '40-day cycles · personal-delta analytics',
    traditional: 'Forty-dina mandalas · the rhythm of your sadhana',
  },
  'rhythm.deltas.empty': {
    coach: 'Log a few more pre/post fasts to see your patterns.',
    scientific: 'Insufficient sample size — log ≥3 paired sessions per context.',
    traditional: 'Continue the practice. Patterns reveal themselves with time.',
  },
  'fast.synced.primary': {
    coach: "You're synced with {n} people.",
    scientific: 'Approximately {n} observers in this window.',
    traditional: '{n} sadhakas observe with you.',
  },
  'fast.lateComplete.title': {
    coach: 'Logged · late completion',
    scientific: 'Session logged · late completion',
    traditional: 'Vrat honoured · completed late',
  },
  'fast.lateComplete.body': {
    coach: "Bodies aren't clocks. The rhythm holds.",
    scientific: 'Late completion is non-punitive. Counts toward cycle.',
    traditional: 'The body keeps its own time. The vrat is honoured.',
  },
  'fast.lateComplete.cta': {
    coach: 'Continue',
    scientific: 'Continue',
    traditional: 'Continue',
  },
  'fast.endEarly.confirm.gentle': {
    coach: "End fast now? Your body knows. We'll log it either way.",
    scientific: 'End the protocol now? Session will be logged as ended early.',
    traditional: 'End this vrat now? It will be recorded as ended.',
  },
  'notif.philosophy.title': {
    coach: 'How often should we ping you?',
    scientific: 'Notification frequency',
    traditional: 'Choose the cadence of reminders',
  },
  'notif.philosophy.framing': {
    coach: 'Soma is the slow app. Choose how often we should ping you.',
    scientific: 'Notification volume per month, dependent on selected tier.',
    traditional: 'The bell sounds gently. Choose how often it should ring.',
  },
  'notif.philosophy.quiet': {
    coach: 'Quiet · ~3 a month',
    scientific: 'Quiet · ~3/month',
    traditional: 'Maun · ~3 reminders a month',
  },
  'notif.philosophy.standard': {
    coach: 'Standard · ~7-8 a month',
    scientific: 'Standard · ~7-8/month',
    traditional: 'Madhyama · ~7-8 reminders a month',
  },
  'notif.philosophy.detailed': {
    coach: 'Detailed · ~15-19 a month',
    scientific: 'Detailed · ~15-19/month',
    traditional: 'Vistara · ~15-19 reminders a month',
  },
  'notif.ekadashi.morning': {
    coach: 'Ekadashi today. {phrase}.',
    scientific: 'Ekadashi today. {phrase}.',
    traditional: 'Ekadashi tithi. {phrase}.',
  },
  'notif.prefast': {
    coach: 'Fast begins in {minutes} minutes.',
    scientific: 'Fasting window opens in {minutes} min.',
    traditional: 'Vrat begins in {minutes} minutes.',
  },
  'notif.parana': {
    coach: 'Break fast between {start} and {end}.',
    scientific: 'Parana window: {start}–{end}.',
    traditional: 'Parana between {start} and {end}.',
  },
  'notif.pradosh.evening': {
    coach: 'Pradosh begins this evening.',
    scientific: 'Pradosh observance window opens this evening.',
    traditional: 'Pradosh kaal arrives this evening.',
  },
  'notif.sankashti': {
    coach: 'Sankashti Chaturthi tonight.',
    scientific: 'Sankashti Chaturthi observance tonight.',
    traditional: 'Sankashti Chaturthi this night.',
  },
  'notif.shivaratri': {
    coach: 'Shivaratri tonight.',
    scientific: 'Shivaratri observance tonight.',
    traditional: 'Shivaratri this night.',
  },
  'notif.tithi.sunrise': {
    coach: 'Sunrise · {tithi} begins.',
    scientific: 'Sunrise tithi handoff: {tithi}.',
    traditional: 'Suryodaya · {tithi} arises.',
  },
  'notif.reflection': {
    coach: 'Take a minute to log how this day landed.',
    scientific: 'Evening reflection: log how this day landed.',
    traditional: 'A moment to reflect on how this day moved through you.',
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
