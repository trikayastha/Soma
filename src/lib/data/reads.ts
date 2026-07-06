/**
 * Reads library (S4 expansion).
 *
 * The short, honest, optional explainers that previously lived inlined inside
 * `Wisdom.tsx`. Extracted here as typed data so the Reads segment can filter by
 * kind and cross-link a citation without the screen carrying prose.
 *
 * A `citationId` (when present) must resolve in `lib/citations.ts` — the
 * `reads.test.ts` suite fails fast on a dangling reference.
 */

export type ReadKind = 'Tradition' | 'Science' | 'Practice' | 'Caution';

export interface Read {
  /** Stable key for list rendering + analytics. */
  id: string;
  kind: ReadKind;
  title: string;
  body: string;
  /** Optional citation backing a factual/scientific claim. */
  citationId?: string;
}

/** Filter order for the Reads segment chip row. */
export const READ_KINDS: readonly ReadKind[] = [
  'Tradition',
  'Science',
  'Practice',
  'Caution',
];

export const READS: readonly Read[] = [
  {
    id: 'moon-calendar',
    kind: 'Tradition',
    title: 'Why the moon became the calendar',
    body: 'For most of human history, the moon was the only reliable long-interval clock. Ekadashi and Purnima built rhythm into lives without wristwatches — rhythm is the point, not the moon itself.',
  },
  {
    id: 'full-moon-sleep',
    kind: 'Science',
    title: 'Full moon and sleep — Cajochen 2013',
    body: 'A 2013 study in Current Biology found measurable reductions in sleep efficiency and melatonin around the full moon, independent of light exposure. A rare case of traditional observation matching instrumented evidence.',
    citationId: 'lunar-cajochen-2013',
  },
  {
    id: 'weak-moon-reframe',
    kind: 'Practice',
    title: 'The "weak moon" reframe',
    body: "Newa Buddhist teaching suggests that on certain lunar phases the mind is more reactive — not weaker in a mystical sense, but more in need of support. Fasting + meditation on those days is protective, not punishing.",
  },
  {
    id: 'wellness-not-medicine',
    kind: 'Caution',
    title: 'Soma is wellness, not medicine',
    body: 'We share practices and observations. We do not make medical claims. If a fast feels wrong for your body, end it. Talk to a physician before changing your relationship with food.',
  },
];
