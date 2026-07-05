import type { Archetype } from './types';

/**
 * Energy Archetype (S4)
 * ---------------------
 * 3-question quiz → Wind / Fire / Earth dominant. Plain-English surrogate
 * for the Vata/Pitta/Kapha triad with no Sanskrit required.
 *
 * Scoring: each option carries a `weights` record summed across the 3
 * answers. Tie-break is deterministic and follows {@link ARCHETYPE_TIEBREAK}
 * order: Wind > Fire > Earth.
 */

/** Tie-break order applied when multiple archetypes share max score. */
export const ARCHETYPE_TIEBREAK: readonly Archetype[] = [
  'wind',
  'fire',
  'earth',
] as const;

export interface ArchetypeOption {
  id: string;
  label: string;
  weights: Record<Archetype, number>;
}

export type ArchetypeQuestionId = 'stress' | 'body' | 'thrive';

export interface ArchetypeQuestion {
  id: ArchetypeQuestionId;
  prompt: string;
  options: readonly ArchetypeOption[];
}

export type ArchetypeAnswers = Record<ArchetypeQuestionId, string>;

export interface ArchetypeResult {
  archetype: Archetype;
  scores: Record<Archetype, number>;
  /** True when ≥2 archetypes tied for max (still resolved deterministically). */
  tied: boolean;
  answers: ArchetypeAnswers;
}

/**
 * Authored question catalog. Keep prompts plain-English (no Sanskrit) and
 * weights summing to 4 per option so total scores live in 0..12.
 */
export const ARCHETYPE_QUESTIONS: readonly ArchetypeQuestion[] = [
  {
    id: 'stress',
    prompt: "When you're stressed, you usually...",
    options: [
      {
        id: 'scattered',
        label: "Feel scattered, restless, can't settle",
        weights: { wind: 3, fire: 1, earth: 0 },
      },
      {
        id: 'irritable',
        label: 'Get irritable, sharp, intense',
        weights: { wind: 1, fire: 3, earth: 0 },
      },
      {
        id: 'heavy',
        label: 'Withdraw, feel heavy, shut down',
        weights: { wind: 0, fire: 1, earth: 3 },
      },
    ],
  },
  {
    id: 'body',
    prompt: 'Your default body state is...',
    options: [
      {
        id: 'cool-dry',
        label: 'Cool, dry, light',
        weights: { wind: 3, fire: 0, earth: 1 },
      },
      {
        id: 'warm-energized',
        label: 'Warm, energized, sometimes overheated',
        weights: { wind: 1, fire: 3, earth: 0 },
      },
      {
        id: 'grounded-slow',
        label: 'Grounded, slow, steady',
        weights: { wind: 0, fire: 1, earth: 3 },
      },
    ],
  },
  {
    id: 'thrive',
    prompt: 'You feel your best when...',
    options: [
      {
        id: 'in-motion',
        label: 'In motion — variety, novelty, travel',
        weights: { wind: 3, fire: 2, earth: 0 },
      },
      {
        id: 'in-flow',
        label: 'In flow — focused, challenged, productive',
        weights: { wind: 1, fire: 3, earth: 1 },
      },
      {
        id: 'in-routine',
        label: 'In routine — slow mornings, deep rest',
        weights: { wind: 0, fire: 1, earth: 3 },
      },
    ],
  },
];

/** Look up an option by question + option id. Returns null on unknown ids. */
export function findOption(
  questionId: ArchetypeQuestionId,
  optionId: string,
): ArchetypeOption | null {
  const q = ARCHETYPE_QUESTIONS.find((x) => x.id === questionId);
  if (!q) return null;
  return q.options.find((o) => o.id === optionId) ?? null;
}

/**
 * Score a complete answer set into an {@link ArchetypeResult}.
 *
 * Validation: throws if any answer references an unknown option. Callers
 * must ensure all 3 questions are answered.
 */
export function scoreArchetype(answers: ArchetypeAnswers): ArchetypeResult {
  const scores: Record<Archetype, number> = { wind: 0, fire: 0, earth: 0 };
  for (const q of ARCHETYPE_QUESTIONS) {
    const optId = answers[q.id];
    const opt = findOption(q.id, optId);
    if (!opt) {
      throw new Error(
        `scoreArchetype: unknown option "${optId}" for question "${q.id}"`,
      );
    }
    scores.wind += opt.weights.wind;
    scores.fire += opt.weights.fire;
    scores.earth += opt.weights.earth;
  }
  const max = Math.max(scores.wind, scores.fire, scores.earth);
  let archetype: Archetype = 'wind';
  for (const candidate of ARCHETYPE_TIEBREAK) {
    if (scores[candidate] === max) {
      archetype = candidate;
      break;
    }
  }
  const tieCount =
    (scores.wind === max ? 1 : 0) +
    (scores.fire === max ? 1 : 0) +
    (scores.earth === max ? 1 : 0);
  return { archetype, scores, tied: tieCount > 1, answers };
}

/** Human-readable label per archetype, used in result cards + Settings. */
export const ARCHETYPE_LABEL: Record<Archetype, string> = {
  wind: 'Wind',
  fire: 'Fire',
  earth: 'Earth',
};

/** One-sentence description per archetype, shown on the result card. */
export const ARCHETYPE_DESCRIPTION: Record<Archetype, string> = {
  wind: 'Mobile, light, quick. Soma will offer grounding cues on rising tithis.',
  fire: 'Sharp, focused, intense. Soma will offer cooling cues on peak tithis.',
  earth: 'Steady, slow, grounded. Soma will offer activating cues on still tithis.',
};
