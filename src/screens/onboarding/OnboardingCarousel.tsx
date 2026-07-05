import { useRef, useState } from 'react';
import { CAROUSEL_SLIDES } from './carouselSlides';
import { useReducedMotion } from '../../lib/useReducedMotion';

interface OnboardingCarouselProps {
  /** Called once the user advances past the final slide. */
  onComplete: () => void;
}

/**
 * 3-slide swipe carousel for first-run onboarding (S4 §T15).
 *
 * Behaviour:
 * - Touch swipe (left/right) and Next/Back buttons advance slides.
 * - The final slide replaces the Next button with "Begin" which fires
 *   `onComplete()`.
 * - Respects `prefers-reduced-motion` by replacing slide transitions with an
 *   instant cut (full reduced-motion handling lands with `useReducedMotion`
 *   in PR 3 — for now we feature-detect inline to keep the build green).
 */
export function OnboardingCarousel({ onComplete }: OnboardingCarouselProps) {
  const [index, setIndex] = useState(0);
  const total = CAROUSEL_SLIDES.length;
  const touchStartX = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();

  function advance() {
    if (index + 1 < total) {
      setIndex(index + 1);
    } else {
      onComplete();
    }
  }
  function retreat() {
    if (index > 0) setIndex(index - 1);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }
  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStartX.current;
    if (start === null) return;
    const end = e.changedTouches[0]?.clientX ?? start;
    const dx = end - start;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) advance();
    else retreat();
  }

  const slide = CAROUSEL_SLIDES[index];
  const isLast = index === total - 1;

  return (
    <div
      className="flex-1 flex flex-col"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="flex gap-1.5 mb-8"
        aria-label="Carousel progress"
        role="tablist"
      >
        {CAROUSEL_SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Slide ${i + 1} of ${total}: ${s.title}`}
            onClick={() => setIndex(i)}
            className={`h-[3px] flex-1 rounded-full ${
              reduceMotion ? '' : 'transition-colors duration-300'
            } ${i <= index ? 'bg-soma-glow' : 'bg-white/20'}`}
          />
        ))}
      </div>

      <div className={reduceMotion ? '' : 'animate-fade-in'} key={slide.id}>
        <h2 className="display-serif text-3xl text-soma-glow leading-tight">
          {slide.title}
        </h2>
        <p
          className="mt-4 text-soma-mist text-sm leading-relaxed"
          style={{ textWrap: 'balance' }}
        >
          {slide.body}
        </p>
      </div>

      <div className="mt-auto flex gap-3 pt-6">
        {index > 0 && (
          <button className="soma-btn-ghost flex-1" onClick={retreat}>
            Back
          </button>
        )}
        <button className="soma-btn-primary flex-1" onClick={advance}>
          {isLast ? 'Begin' : 'Next'}
        </button>
      </div>
    </div>
  );
}
