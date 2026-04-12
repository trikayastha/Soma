import type { SomaDayKind } from './types';

export interface WhyCopy {
  heading: string;
  plain: string;
  tradition: string;
  science: string;
}

const COPY: Record<SomaDayKind, WhyCopy> = {
  ekadashi: {
    heading: 'Ekadashi — the 11th lunar day',
    plain:
      "Observed for more than a thousand years on the 11th day after each new and full moon. It's the most widely practiced lunar fast in the Vedic tradition — a day to rest digestion and steady the mind.",
    tradition:
      "In Sanatan Dharma, Ekadashi falls twice per lunar month. Grandparents across South Asia still observe it, shifting to water, fruit, or a single meal. Newa Buddhist teaching frames adjacent phases as 'weak-moon' days when the mind is more reactive and benefits from ritual stabilization.",
    science:
      'Aligning longer fasts with a predictable 14-day rhythm trains metabolic flexibility and creates a repeating cue for meditation and reflection — two interventions with independent evidence for improved focus and reduced stress reactivity.',
  },
  'full-moon': {
    heading: 'Purnima — the full moon',
    plain:
      "The brightest night of the lunar month. Traditionally a day for extended meditation and lighter eating — the body is said to be more sensitive and the mind more restless.",
    tradition:
      "Purnima is a major observance across Vedic and Buddhist lineages. Newa Buddhist practice marks it with puja and fasting, framing the full moon as a mirror that amplifies whatever state the mind is already in.",
    science:
      'A 2013 study by Cajochen et al. in Current Biology documented measurable reductions in sleep quality and melatonin around the full moon — a rare piece of modern evidence for a traditional observation.',
  },
  'new-moon': {
    heading: 'Amavasya — the new moon',
    plain:
      "A quiet, inward day. Traditionally reserved for reflection, ancestor honoring, and a lighter fast. The moon is dark; the practice is to match that stillness internally.",
    tradition:
      "Amavasya is observed across South Asian lineages as a reset point. Chandrayana Vrat — the graduated lunar fast — reaches its minimum here, sometimes water-only, before rebuilding with the waxing moon.",
    science:
      'Using the darkest night as a natural marker for a reset builds a predictable cadence — the same behavioral mechanism behind any habit that uses an external cue to reduce willpower cost.',
  },
  chaturthi: {
    heading: 'Chaturthi — the 4th lunar day',
    plain:
      "A minor fast day observed in several Vedic and Newa Buddhist lineages, typically with a single evening meal.",
    tradition:
      "Less widely observed than Ekadashi, Chaturthi appears in specific festival cycles and family practices across Nepal and North India.",
    science:
      'Included for users who want additional structure. Optional in Soma — never prescribed by default.',
  },
};

export function getWhyCopy(kind: SomaDayKind): WhyCopy {
  return COPY[kind];
}
