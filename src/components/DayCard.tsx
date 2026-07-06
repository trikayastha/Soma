import { ekadashiNameForDate } from '../lib/ekadashiNames';
import { paranaWindow } from '../lib/parana';
import { useLunarDay } from '../lib/useLunarDay';
import { getTithiMeta } from '../lib/tithiMeta';
import { WhyThisDay } from './WhyThisDay';
import type { Archetype, Location, SomaDay } from '../lib/types';

interface DayCardProps {
  iso: string;
  todayIso: string;
  /** The scheduled Soma day for this date, or null for a regular rest day. */
  day: SomaDay | null;
  location: Location | null;
  archetype: Archetype | null;
  tz?: string;
  /** Hours used for a self-chosen vrat on a rest day (user's default intensity). */
  vratHours: number;
  onStart: () => void;
}

/**
 * The single day card shown below the moon. Renders the scheduled-fast
 * variant (kicker + serif title + parana + "Why this day?" explainer +
 * "Begin fast" CTA) when a Soma day exists, otherwise the rest-day variant.
 */
export function DayCard({
  iso,
  todayIso,
  day,
  location,
  archetype,
  tz,
  vratHours,
  onStart,
}: DayCardProps) {
  const { illum, phaseLabel, tithi, noonUtc } = useLunarDay(iso, location);

  const isToday = iso === todayIso;
  const daysFromToday = Math.round(
    (new Date(iso + 'T00:00:00Z').getTime() -
      new Date(todayIso + 'T00:00:00Z').getTime()) /
      86_400_000,
  );

  if (!day) {
    return (
      <RegularDayCard
        iso={iso}
        phaseLabel={phaseLabel}
        illum={illum}
        daysFromToday={daysFromToday}
        isToday={isToday}
        vratHours={vratHours}
        onStart={onStart}
      />
    );
  }

  const when = formatWhen(isToday, daysFromToday, day.date);
  const isPast = daysFromToday < 0;
  const ekadashiTitle =
    day.kind === 'ekadashi' && location
      ? ekadashiNameForDate(noonUtc, tithi.paksha, location)
      : null;
  const parana =
    day.kind === 'ekadashi' ? paranaWindow(noonUtc, location) : null;
  const headline = ekadashiTitle ? `${ekadashiTitle} Ekadashi` : day.title;

  return (
    <div className="soma-card p-5 animate-rise">
      <div className="text-xs text-soma-accent uppercase tracking-wider">{when}</div>
      <h2 className="display-serif text-2xl text-soma-glow mt-1">{headline}</h2>
      <p className="text-soma-mist text-xs mt-2">
        {day.intensityHours}-hour fast · paired with a 10-minute meditation
      </p>
      {parana && (
        <p className="text-soma-mist text-[11px] mt-2">
          Parana: break fast between {formatTimeRange(parana, tz)}
        </p>
      )}

      <WhyThisDay
        kind={day.kind}
        archetype={archetype}
        citationIds={getTithiMeta(tithi.index).citationIds}
        variant="full"
      />

      <button
        className="soma-btn-primary w-full mt-5"
        onClick={onStart}
        disabled={!isToday}
      >
        {isToday
          ? 'Begin fast'
          : isPast
          ? 'This day has passed'
          : `Begins ${when.toLowerCase()}`}
      </button>
      {!isToday && !isPast && (
        <p className="text-[11px] text-soma-mist text-center mt-2">
          Notifications will remind you.
        </p>
      )}
    </div>
  );
}

function RegularDayCard({
  iso,
  phaseLabel,
  illum,
  daysFromToday,
  isToday,
  vratHours,
  onStart,
}: {
  iso: string;
  phaseLabel: string;
  illum: number;
  daysFromToday: number;
  isToday: boolean;
  vratHours: number;
  onStart: () => void;
}) {
  const when = formatWhen(isToday, daysFromToday, iso);
  return (
    <div className="soma-card p-5 animate-rise">
      <div className="text-xs text-soma-accent uppercase tracking-wider">{when}</div>
      <h2 className="display-serif text-2xl text-soma-glow mt-1">{phaseLabel}</h2>
      <p className="text-soma-mist text-xs mt-2">
        {Math.round(illum * 100)}% illuminated · no scheduled fast on this day
      </p>
      <p className="text-soma-mist text-xs leading-relaxed mt-4">
        Rest days matter. The rhythm is the practice — not every day has to be a fast day.
      </p>
      {isToday && (
        <>
          <button className="soma-btn-ghost w-full mt-5" onClick={onStart}>
            Begin a personal vrat
          </button>
          <p className="text-[11px] text-soma-mist text-center mt-2">
            {vratHours}-hour fast on your own terms. It counts in your history.
          </p>
        </>
      )}
    </div>
  );
}

function formatTimeRange(
  range: { earliest: Date; latest: Date },
  tz?: string,
): string {
  const fmt: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: tz,
  };
  try {
    return `${range.earliest.toLocaleTimeString([], fmt)} – ${range.latest.toLocaleTimeString([], fmt)}`;
  } catch {
    return `${range.earliest.toISOString().slice(11, 16)} – ${range.latest.toISOString().slice(11, 16)} UTC`;
  }
}

function formatWhen(isToday: boolean, daysFromToday: number, iso: string): string {
  if (isToday) return 'Today';
  const pretty = new Date(iso + 'T00:00:00Z').toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  if (daysFromToday === 1) return `Tomorrow · ${pretty}`;
  if (daysFromToday === -1) return `Yesterday · ${pretty}`;
  if (daysFromToday > 0) return `In ${daysFromToday} days · ${pretty}`;
  return `${Math.abs(daysFromToday)} days ago · ${pretty}`;
}
