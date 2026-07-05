import { useEffect, useMemo, useState } from 'react';
import { resolvePaletteFromCssVars } from '../themes/resolvePalette';
import {
  renderWisdomCardCanvas,
  type WisdomCardConfig,
  type WisdomCardOutput,
} from '../lib/wisdomCard';
import { useShareImage } from '../lib/useShareImage';
import { useAppState } from '../state/AppStateContext';

interface WisdomCardProps {
  /** Date the card represents. */
  date: Date;
  /** Pretty tithi label, e.g. "Shukla Ekadashi". */
  tithiLabel: string;
  /** One-word benefit (uppercased on render). */
  oneWordBenefit: string;
  /** Wisdom line — short, ≤120 chars. */
  wisdomLine: string;
  /** 0..1 illuminated fraction. */
  illumination: number;
  /** Whether the moon is waxing. */
  waxing: boolean;
}

/**
 * Live preview + share affordance for the 1080×1080 wisdom card (S4 §T13).
 *
 * We render the PNG to a hidden canvas via `renderWisdomCardCanvas` and show
 * the resulting data URL as a square preview. Pressing Share routes through
 * `useShareImage` (Web Share → text share → download).
 *
 * The share counter in `state.preferences.wisdomCardCount` increments on
 * every successful path (`'shared'` or `'downloaded'`) — not on cancel.
 */
export function WisdomCard({
  date,
  tithiLabel,
  oneWordBenefit,
  wisdomLine,
  illumination,
  waxing,
}: WisdomCardProps) {
  const { state, setPreferences } = useAppState();
  const { share, status, error } = useShareImage();
  const [output, setOutput] = useState<WisdomCardOutput | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Resolve the active theme palette once per mount and re-render the card
  // whenever the user's voice/theme/archetype changes.
  const palette = useMemo(
    () =>
      typeof document !== 'undefined'
        ? resolvePaletteFromCssVars(document.documentElement)
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.preferences.theme, state.preferences.voice],
  );

  const config: WisdomCardConfig | null = useMemo(() => {
    if (!palette) return null;
    return {
      date,
      tithiLabel,
      oneWordBenefit,
      wisdomLine,
      illumination,
      waxing,
      palette,
      voice: state.preferences.voice,
      theme: state.preferences.theme,
    };
  }, [
    palette,
    date,
    tithiLabel,
    oneWordBenefit,
    wisdomLine,
    illumination,
    waxing,
    state.preferences.voice,
    state.preferences.theme,
  ]);

  useEffect(() => {
    if (!config) return;
    let cancelled = false;
    setRenderError(null);
    renderWisdomCardCanvas(config)
      .then((out) => {
        if (!cancelled) setOutput(out);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setRenderError(
          err instanceof Error ? err.message : 'Could not render card.',
        );
      });
    return () => {
      cancelled = true;
    };
  }, [config]);

  async function onShare() {
    if (!output) return;
    try {
      const result = await share(output);
      if (result === 'shared' || result === 'downloaded') {
        setPreferences({
          wisdomCardCount: (state.preferences.wisdomCardCount ?? 0) + 1,
        });
      }
    } catch {
      // Errors surface via `error` from the hook; nothing else to do here.
    }
  }

  return (
    <section
      className="soma-card p-5"
      aria-labelledby="wisdom-card-heading"
    >
      <div className="text-[10px] uppercase tracking-wider text-soma-mist">
        Today's wisdom
      </div>
      <h2
        id="wisdom-card-heading"
        className="display-serif text-2xl text-soma-glow mt-1"
      >
        {tithiLabel}
      </h2>

      <div className="mt-4 aspect-square w-full rounded-2xl overflow-hidden bg-soma-night/60 flex items-center justify-center">
        {output ? (
          <img
            src={output.dataUrl}
            alt={`Wisdom card for ${tithiLabel}`}
            className="w-full h-full object-contain"
          />
        ) : renderError ? (
          <p className="text-soma-mist text-xs px-4 text-center">
            {renderError}
          </p>
        ) : (
          <div
            className="text-soma-mist text-xs"
            role="status"
            aria-live="polite"
          >
            Preparing card…
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onShare}
        disabled={!output || status === 'sharing'}
        className="soma-btn-primary w-full mt-5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'sharing' ? 'Sharing…' : 'Share'}
      </button>
      {error && (
        <p className="text-soma-crimson text-xs mt-2" role="alert">
          {error}
        </p>
      )}
      <p className="text-[11px] text-soma-mist mt-3 leading-relaxed">
        Saves to your camera roll on iOS, downloads on desktop. Soma never
        uploads your card.
      </p>
    </section>
  );
}
