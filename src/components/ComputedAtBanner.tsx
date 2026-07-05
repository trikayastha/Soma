import type { Location, TithiAccuracy } from '../lib/types';

interface ComputedAtBannerProps {
  accuracy: TithiAccuracy;
  /** Sunrise instant in UTC; only used when `accuracy === 'sunrise'`. */
  sunriseAt?: Date | null;
  location?: Location | null;
  /** Optional click target for the "set your location" prompt. */
  onSetLocation?: () => void;
}

/**
 * Small inline pill that surfaces *how* a day's tithi was computed:
 *
 *  - `sunrise`           green dot · "Computed at sunrise · <city> (HH:mm tz)"
 *  - `approximate`       amber dot · "Set your location for sunrise-accurate timing"
 *  - `polar-fallback`    gray dot  · "Polar region — using UTC noon fallback"
 *
 * Renders inline (not a modal). Honors `prefers-reduced-motion` by virtue
 * of having no animation. Always includes a textual explanation alongside
 * the dot for accessibility.
 */
export function ComputedAtBanner({
  accuracy,
  sunriseAt,
  location,
  onSetLocation,
}: ComputedAtBannerProps) {
  if (accuracy === 'sunrise') {
    const time = sunriseAt
      ? formatLocalTime(sunriseAt, location?.tz)
      : '';
    const tzAbbr = location?.tz ? guessTzAbbr(location.tz) : '';
    return (
      <div
        className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-[11px] text-soma-mist"
        aria-label={`Computed at sunrise in ${location?.label ?? 'your location'}`}
      >
        <span
          className="h-1.5 w-1.5 rounded-full bg-emerald-400"
          aria-hidden="true"
        />
        <span>
          Computed at sunrise · {location?.label ?? '—'}
          {time ? ` (${time}${tzAbbr ? ' ' + tzAbbr : ''})` : ''} · source: astronomy-engine
        </span>
      </div>
    );
  }

  if (accuracy === 'polar-fallback') {
    return (
      <div
        className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/15 px-3 py-1 text-[11px] text-soma-mist"
        aria-label="Polar region; using UTC noon fallback"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-soma-mist" aria-hidden="true" />
        <span>Polar region — using UTC noon fallback</span>
      </div>
    );
  }

  // approximate
  return (
    <button
      type="button"
      onClick={onSetLocation}
      className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-[11px] text-soma-mist hover:text-soma-glow"
      aria-label="Set your location for sunrise-accurate timing"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
      <span>Set your location for sunrise-accurate timing →</span>
    </button>
  );
}

/** HH:mm in the location's IANA timezone, falling back to UTC. */
function formatLocalTime(d: Date, tz?: string): string {
  try {
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: tz,
    });
  } catch {
    return d.toISOString().slice(11, 16);
  }
}

/** Best-effort TZ abbreviation (e.g. NPT, IST). Returns '' on failure. */
function guessTzAbbr(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat([], {
      timeZone: tz,
      timeZoneName: 'short',
    }).formatToParts(new Date());
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
  } catch {
    return '';
  }
}
