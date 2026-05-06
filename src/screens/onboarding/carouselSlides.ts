/**
 * Static catalogue for the 3-slide onboarding carousel (S4 §T16).
 *
 * Each slide is a self-contained micro-narrative — image-light, copy-led —
 * that introduces Soma's premise before the more granular onboarding steps
 * (`you`, `experience`, `safety`, `intensity`).
 *
 * The carousel is purely informational. It cannot fail and never collects
 * user input — we keep everything inside this list so future copy edits do
 * not require touching `OnboardingCarousel.tsx`.
 */

export interface CarouselSlide {
  /** Stable identifier — used for keys and analytics. */
  id: 'rhythm' | 'practice' | 'commitment';
  /** Slide title. Display-serif, large. */
  title: string;
  /** Body copy. Plain English, ~2-3 short sentences. */
  body: string;
}

export const CAROUSEL_SLIDES: readonly CarouselSlide[] = [
  {
    id: 'rhythm',
    title: 'A rhythm, not a regimen',
    body: 'Soma follows the moon. You fast on a small handful of lunar days each month — chosen by tradition, not by your willpower.',
  },
  {
    id: 'practice',
    title: 'The fast is a practice',
    body: "Each fast pairs with a 10-minute meditation. The food pause is the cue; the inward turn is the point.",
  },
  {
    id: 'commitment',
    title: 'Small, repeated, kept',
    body: "Show up for the next lunar day on your schedule. The mandala you build over 40 days is the proof — to yourself, no one else.",
  },
] as const;
