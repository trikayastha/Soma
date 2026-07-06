import { useState } from 'react';
import { ekadashiNameForDate } from '../lib/ekadashiNames';
import { paranaWindow } from '../lib/parana';
import { useLunarDay } from '../lib/useLunarDay';
import { archetypeNudge, getWhyCopy } from '../lib/whyThisDay';
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
  const [whyOpen, setWhyOpen] = useState(false);

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

  const why = getWhyCopy(day.kind);
  const nudge = archetypeNudge(day.kind, archetype);
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

      <button
        onClick={() => setWhyOpen((v) => !v)}
        className="mt-4 flex items-center justify-between w-full text-left text-soma-moon text-sm border-t border-white/10 pt-4 min-h-[44px] hover:text-soma-glow transition-colors duration-200"
        aria-expanded={whyOpen}
      >
        <span>Why this day?</span>
        <ChevronIcon open={whyOpen} />
      </button>
      {whyOpen && (
        <div className="mt-3 animate-fade-in">
          <h3 className="text-soma-glow text-sm font-semibold">{why.heading}</h3>
          <p className="text-soma-mist text-xs leading-relaxed mt-2">{why.plain}</p>
          <details className="mt-3 group">
            <summary className="list-none cursor-pointer text-xs text-soma-accent min-h-[44px] flex items-center justify-between border-t border-white/5 pt-3">
              <span className="uppercase tracking-wider">Tradition</span>
              <ChevronIcon size={12} />
            </summary>
            <p className="text-soma-mist text-xs leading-relaxed mt-2">{why.tradition}</p>
          </details>
          <details className="mt-1 group">
            <summary className="list-none cursor-pointer text-xs text-soma-accent min-h-[44px] flex items-center justify-between border-t border-white/5 pt-3">
              <span className="uppercase tracking-wider">Science</span>
              <ChevronIcon size={12} />
            </summary>
            <p className="text-soma-mist text-xs leading-relaxed mt-2">{why.science}</p>
          </details>
          {nudge && (
            <p className="text-soma-glow/80 text-xs leading-relaxed mt-3 italic border-t border-white/5 pt-3">
              {nudge}
            </p>
          )}
        </div>
      )}

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

export function ChevronIcon({ open = false, size = 14 }: { open?: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <path d="M3 5l4 4 4-4" />
    </svg>
  );
}
