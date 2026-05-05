import { useMemo, useState } from 'react';
import { MoonPhase } from '../components/MoonPhase';
import { AmbientBackground } from '../components/AmbientBackground';
import { DaySwitcher } from '../components/DaySwitcher';
import { useAppState } from '../state/AppStateContext';
import {
  elongationToPhaseName,
  moonElongation,
  moonIllumination,
  phaseNameToLabel,
  toISODate,
} from '../lib/lunar';
import { computeTithiAtSunrise, tithiLabel } from '../lib/tithi';
import { ekadashiNameForDate } from '../lib/ekadashiNames';
import { paranaWindow } from '../lib/parana';
import { ComputedAtBanner } from '../components/ComputedAtBanner';
import { getWhyCopy } from '../lib/whyThisDay';
import type { SomaDay } from '../lib/types';
import { findActiveSession } from '../lib/scheduler';

interface TodayProps {
  onStartFast: (day: SomaDay) => void;
  onResumeActive: () => void;
}

export function Today({ onStartFast, onResumeActive }: TodayProps) {
  const { state } = useAppState();
  const now = new Date();
  const todayIso = toISODate(now);

  const [selectedIso, setSelectedIso] = useState<string>(todayIso);

  // The date used for moon math is noon UTC of the selected day —
  // this gives a stable, timezone-agnostic midday reading.
  const selectedDateNoonUtc = useMemo(
    () => new Date(selectedIso + 'T12:00:00Z'),
    [selectedIso],
  );

  const elongation = useMemo(
    () => moonElongation(selectedDateNoonUtc),
    [selectedDateNoonUtc],
  );
  const illum = useMemo(
    () => moonIllumination(selectedDateNoonUtc),
    [selectedDateNoonUtc],
  );
  const phaseName = elongationToPhaseName(elongation);
  const waxing = elongation < 180;
  const location = state.profile?.location ?? null;
  const tithi = useMemo(
    () => computeTithiAtSunrise(selectedDateNoonUtc, location),
    [selectedDateNoonUtc, location],
  );

  const scheduleByDate = useMemo(() => {
    const m = new Map<string, SomaDay>();
    for (const d of state.schedule) m.set(d.date, d);
    return m;
  }, [state.schedule]);

  const selectedSomaDay = scheduleByDate.get(selectedIso) ?? null;
  const active = findActiveSession(state.sessions);
  const [whyOpen, setWhyOpen] = useState(false);

  const isSelectedToday = selectedIso === todayIso;
  const daysFromToday = Math.round(
    (new Date(selectedIso + 'T00:00:00Z').getTime() -
      new Date(todayIso + 'T00:00:00Z').getTime()) /
      86_400_000,
  );

  const greeting = useMemo(() => {
    const h = now.getHours();
    if (h < 5) return 'Peace of the night';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    if (h < 21) return 'Good evening';
    return 'Quiet night';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative h-full flex flex-col">
      <AmbientBackground />
      <div className="relative flex-1 min-h-0 flex flex-col animate-fade-in">
        <header className="px-6 pt-6 shrink-0">
          <p className="text-soma-mist text-xs tracking-widest uppercase">
            {greeting}
            {state.profile?.name ? `, ${state.profile.name}` : ''}
          </p>
          <h1 className="display-serif text-3xl text-soma-glow mt-1">
            {phaseNameToLabel(phaseName)}
          </h1>
          <p className="text-soma-mist text-xs mt-1">
            {Math.round(illum * 100)}% illuminated · {waxing ? 'waxing' : 'waning'}
          </p>
          <p className="text-soma-mist text-[11px] mt-0.5">
            Tithi {tithi.index} · {tithiLabel(tithi)}
          </p>
          <div className="mt-2">
            <ComputedAtBanner
              accuracy={tithi.accuracy}
              sunriseAt={tithi.anchor === 'sunrise' ? tithi.anchorAt : null}
              location={location}
            />
          </div>
        </header>

        <div className="shrink-0 mt-4 px-0">
          <DaySwitcher
            selectedIso={selectedIso}
            todayIso={todayIso}
            scheduleByDate={scheduleByDate}
            onSelect={setSelectedIso}
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-6 pt-3 pb-8">
          <div className="flex justify-center my-4">
            <MoonPhase illumination={illum} waxing={waxing} size={200} />
          </div>

          {active && isSelectedToday ? (
            <ActiveCard onResume={onResumeActive} />
          ) : selectedSomaDay ? (
            <SelectedDayCard
              day={selectedSomaDay}
              isToday={isSelectedToday}
              daysFromToday={daysFromToday}
              whyOpen={whyOpen}
              toggleWhy={() => setWhyOpen((v) => !v)}
              onStart={() => onStartFast(selectedSomaDay)}
              ekadashiTitle={
                selectedSomaDay.kind === 'ekadashi' && location
                  ? ekadashiNameForDate(
                      selectedDateNoonUtc,
                      tithi.paksha,
                      location,
                    )
                  : null
              }
              parana={
                selectedSomaDay.kind === 'ekadashi'
                  ? paranaWindow(selectedDateNoonUtc, location)
                  : null
              }
              tz={location?.tz ?? state.profile?.timezone}
            />
          ) : (
            <RegularDayCard
              iso={selectedIso}
              phaseLabel={phaseNameToLabel(phaseName)}
              illum={illum}
              daysFromToday={daysFromToday}
              isToday={isSelectedToday}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ActiveCard({ onResume }: { onResume: () => void }) {
  return (
    <div className="soma-card p-5 animate-rise">
      <div className="text-xs text-soma-accent uppercase tracking-wider">Fast in progress</div>
      <h2 className="display-serif text-2xl text-soma-glow mt-1">You're fasting</h2>
      <p className="text-soma-mist text-xs mt-2">
        Open the timer to see your progress and the paired meditation.
      </p>
      <button className="soma-btn-primary w-full mt-4" onClick={onResume}>
        Open timer
      </button>
    </div>
  );
}

function SelectedDayCard({
  day,
  isToday,
  daysFromToday,
  whyOpen,
  toggleWhy,
  onStart,
  ekadashiTitle,
  parana,
  tz,
}: {
  day: SomaDay;
  isToday: boolean;
  daysFromToday: number;
  whyOpen: boolean;
  toggleWhy: () => void;
  onStart: () => void;
  ekadashiTitle?: string | null;
  parana?: { earliest: Date; latest: Date; paranaDay: Date } | null;
  tz?: string;
}) {
  const why = getWhyCopy(day.kind);
  const when = formatWhen(isToday, daysFromToday, day.date);
  const isPast = daysFromToday < 0;
  const headline = ekadashiTitle
    ? `${ekadashiTitle} Ekadashi`
    : day.title;

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
        onClick={toggleWhy}
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
}: {
  iso: string;
  phaseLabel: string;
  illum: number;
  daysFromToday: number;
  isToday: boolean;
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

function ChevronIcon({ open = false, size = 14 }: { open?: boolean; size?: number }) {
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
