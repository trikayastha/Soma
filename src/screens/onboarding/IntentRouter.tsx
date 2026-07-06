import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useAppState } from '../../state/AppStateContext';
import type { Intent, Theme, Voice } from '../../lib/types';

interface IntentCard {
  intent: Intent;
  label: string;
  sub: string;
  theme: Theme;
  voice: Voice;
}

/**
 * Mapping from user-stated intent → starting theme + voice. Documented in
 * the master spec section F. Users can change either later in Settings.
 */
const CARDS: readonly IntentCard[] = [
  {
    intent: 'optimize',
    label: 'Optimize my body',
    sub: 'Fasting, sleep, energy data',
    theme: 'performance',
    voice: 'scientific',
  },
  {
    intent: 'tradition',
    label: 'Follow tradition',
    sub: 'Ekadashi, panchanga, dharma',
    theme: 'devotional',
    voice: 'traditional',
  },
  {
    intent: 'tired',
    label: 'Tired of fasting apps',
    sub: 'Less choice, more rhythm',
    theme: 'minimal',
    voice: 'coach',
  },
  {
    intent: 'curious',
    label: 'Curious about the moon',
    sub: 'Lunar wellness for everyone',
    theme: 'performance',
    voice: 'coach',
  },
] as const;

interface IntentRouterProps {
  onSelected: (intent: Intent) => void;
}

/**
 * 4-card 2×2 radiogroup. Selecting a card persists `intent`, `theme`,
 * `voice` to preferences and calls `onSelected(intent)` so the parent flow
 * can advance and derive the matching profile goal. Full keyboard support:
 * ←↑→↓ navigate, Enter/Space activates.
 */
export function IntentRouter({ onSelected }: IntentRouterProps) {
  const { setPreferences } = useAppState();
  const [focusIdx, setFocusIdx] = useState(0);
  const headingId = useId();
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Move keyboard focus when arrow-key navigation changes focusIdx.
  useEffect(() => {
    const el = buttonRefs.current[focusIdx];
    if (el) el.focus();
  }, [focusIdx]);

  const cards = useMemo(() => CARDS, []);

  function activate(idx: number) {
    const card = cards[idx];
    setPreferences({
      intent: card.intent,
      theme: card.theme,
      voice: card.voice,
    });
    onSelected(card.intent);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, idx: number) {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown': {
        e.preventDefault();
        setFocusIdx((idx + 1) % cards.length);
        break;
      }
      case 'ArrowLeft':
      case 'ArrowUp': {
        e.preventDefault();
        setFocusIdx((idx - 1 + cards.length) % cards.length);
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        activate(idx);
        break;
      }
      default:
        break;
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <h2
        id={headingId}
        className="display-serif text-3xl text-soma-glow"
      >
        Why are you here?
      </h2>
      <p className="text-soma-mist text-sm mt-2">
        Pick the answer that fits today. You can change it anytime.
      </p>

      <div
        className="mt-8 grid grid-cols-2 gap-3"
        role="radiogroup"
        aria-labelledby={headingId}
      >
        {cards.map((card, idx) => {
          const focused = focusIdx === idx;
          return (
            <button
              key={card.intent}
              ref={(el) => {
                buttonRefs.current[idx] = el;
              }}
              type="button"
              role="radio"
              aria-checked={false}
              tabIndex={focused ? 0 : -1}
              onFocus={() => setFocusIdx(idx)}
              onKeyDown={(e) => onKeyDown(e, idx)}
              onClick={() => activate(idx)}
              data-intent={card.intent}
              className="soma-card text-left p-4 transition-colors hover:border-soma-glow/50 focus:border-soma-glow/70 min-h-[112px]"
            >
              <div className="text-soma-moon text-sm font-medium leading-tight">
                {card.label}
              </div>
              <div className="text-soma-mist text-xs mt-1.5 leading-snug">
                {card.sub}
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-soma-mist mt-6 text-center">
        You can change this anytime in Settings.
      </p>
    </div>
  );
}
