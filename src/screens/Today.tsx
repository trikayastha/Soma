import { useMemo, useState } from 'react';
import { useVoice } from '../i18n/useVoice';
import { MoonPhase } from '../components/MoonPhase';
import { AmbientBackground } from '../components/AmbientBackground';
import { Calendar as CalendarGrid } from '../components/Calendar';
import { PhaseRhythmStrip } from '../components/PhaseRhythmStrip';
import { DayCard } from '../components/DayCard';
import { useAppState } from '../state/AppStateContext';
import { phaseNameToLabel, toISODate } from '../lib/lunar';
import { describeTithi } from '../lib/describeTithi';
import { TithiSheet } from '../components/TithiSheet';
import { ComputedAtBanner } from '../components/ComputedAtBanner';
import { MandalaChip } from '../components/MandalaChip';
import { SyncedNowPill } from '../components/SyncedNowPill';
import { useLunarDay, useScheduleByDate } from '../lib/useLunarDay';
import type { SomaDay } from '../lib/types';
import { findActiveSession, makePersonalVrat } from '../lib/scheduler';
import { currentMandala } from '../lib/mandala';
import { downloadIcs } from '../lib/reminders';
import { track } from '../lib/analytics';

interface TodayProps {
  onStartFast: (day: SomaDay) => void;
  onResumeActive: () => void;
}

export function Today({ onStartFast, onResumeActive }: TodayProps) {
  const { state } = useAppState();
  const { t } = useVoice();
  const now = new Date();
  const todayIso = toISODate(now);

  const [selectedIso, setSelectedIso] = useState<string>(todayIso);
  const [tithiSheetOpen, setTithiSheetOpen] = useState(false);
  const [month, setMonth] = useState<Date>(
    () => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
  );

  const location = state.profile?.location ?? null;
  const { illum, phaseName, waxing, tithi } = useLunarDay(selectedIso, location);
  const tithiText = describeTithi(tithi.index);
  const scheduleByDate = useScheduleByDate(state.schedule);

  const selectedSomaDay = scheduleByDate.get(selectedIso) ?? null;
  const todaysSomaDay = scheduleByDate.get(todayIso) ?? null;
  const active = findActiveSession(state.sessions);
  const mandala = useMemo(() => currentMandala(state, now), [state, now]);

  // First-visit rest-day rescue: a brand-new user landing on a non-fast day
  // would otherwise see a dead CTA. Surface the next scheduled fast + a
  // one-tap calendar export so the visit converts into a retention hook.
  const isNewUser = state.sessions.length === 0;
  const nextFast = useMemo(() => {
    const upcoming = state.schedule
      .filter((d) => d.date > todayIso)
      .sort((a, b) => a.date.localeCompare(b.date));
    return upcoming[0] ?? null;
  }, [state.schedule, todayIso]);
  const showNextFastCard =
    isNewUser &&
    selectedIso === todayIso &&
    !todaysSomaDay &&
    !active &&
    !!nextFast;

  function handleAddToCalendar() {
    if (!state.profile) return;
    downloadIcs(state.profile, state.schedule);
    track('calendar_exported', { source: 'rest_day_first_visit' });
  }

  // A vrat can begin on any day — rest days synthesize a one-off custom
  // SomaDay at the user's default intensity.
  const vratHours = parseInt(state.profile?.defaultIntensity ?? '16h', 10);

  function startSelectedDay() {
    onStartFast(selectedSomaDay ?? makePersonalVrat(selectedIso, vratHours));
  }

  const isSelectedToday = selectedIso === todayIso;

  const greeting = useMemo(() => {
    const h = now.getHours();
    if (h < 5) return t('today.greeting.lateNight');
    if (h < 12) return t('today.greeting.morning');
    if (h < 17) return t('today.greeting.afternoon');
    if (h < 21) return t('today.greeting.evening');
    return t('today.greeting.night');
  }, [now.getHours(), t]);

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
          {/* Layer-0 tithi line — plain English anchored to the full/new
              moon; the Sanskrit and tradition detail live in TithiSheet. */}
          <button
            type="button"
            onClick={() => { setTithiSheetOpen(true); track('tithi_sheet_viewed', { tithi_index: tithi.index }); }}
            className="text-left text-[11px] mt-0.5 text-soma-mist hover:text-soma-moon transition-colors"
            aria-label="About this lunar day"
          >
            {tithiText.landmark} · {tithiText.practice}
            <span aria-hidden="true"> ›</span>
          </button>
          <div className="mt-2">
            <ComputedAtBanner
              accuracy={tithi.accuracy}
              sunriseAt={tithi.anchor === 'sunrise' ? tithi.anchorAt : null}
              location={location}
            />
          </div>
          {mandala && (
            <div className="mt-2">
              <MandalaChip mandala={mandala} today={now} />
            </div>
          )}
          {selectedSomaDay && isSelectedToday && (
            <div className="mt-2">
              <SyncedNowPill kind={selectedSomaDay.kind} />
            </div>
          )}
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-6 pt-3 pb-8">
          <div className="flex justify-center my-4">
            <MoonPhase
              illumination={illum}
              waxing={waxing}
              size={200}
              tithiIndex={tithi.index}
            />
          </div>

          {/* Monthly view lives inline on Today — tapping a date drives the
              day card below; the strip taps back to today. */}
          <div className="mb-4">
            <div style={{ contain: 'layout' }}>
              <PhaseRhythmStrip
                index={tithi.index}
                illumination={illum}
                waxing={waxing}
                onTap={() => setSelectedIso(todayIso)}
              />
            </div>
            <div className="-mx-6">
              <CalendarGrid
                month={month}
                todayIso={todayIso}
                selectedIso={selectedIso}
                scheduleByDate={scheduleByDate}
                sessions={state.sessions}
                onSelect={setSelectedIso}
                onMonthChange={setMonth}
                location={location}
              />
            </div>
          </div>

          {showNextFastCard && nextFast && (
            <NextFastCard
              day={nextFast}
              days={daysUntil(todayIso, nextFast.date)}
              onAddToCalendar={handleAddToCalendar}
            />
          )}

          {active && isSelectedToday ? (
            <ActiveCard />
          ) : (
            <DayCard
              iso={selectedIso}
              todayIso={todayIso}
              day={selectedSomaDay}
              location={location}
              archetype={state.preferences.archetype}
              tz={location?.tz ?? state.profile?.timezone}
              vratHours={vratHours}
              onStart={startSelectedDay}
            />
          )}
        </div>

        {/* Elevated primary action — the day's main tap stays visible
            without scrolling to the day card. */}
        {active ? (
          <div className="shrink-0 px-6 pt-2 pb-3">
            <button
              className="soma-btn-primary w-full"
              onClick={onResumeActive}
            >
              Fast in progress · Open timer
            </button>
          </div>
        ) : todaysSomaDay ? (
          <div className="shrink-0 px-6 pt-2 pb-3">
            <button
              className="soma-btn-primary w-full"
              onClick={() => onStartFast(todaysSomaDay)}
            >
              Begin today's fast · {todaysSomaDay.intensityHours}h
            </button>
          </div>
        ) : null}
      </div>

      <TithiSheet
        index={tithi.index}
        open={tithiSheetOpen}
        onClose={() => setTithiSheetOpen(false)}
      />
    </div>
  );
}

function ActiveCard() {
  return (
    <div className="soma-card p-5 animate-rise">
      <div className="text-xs text-soma-accent uppercase tracking-wider">Fast in progress</div>
      <h2 className="display-serif text-2xl text-soma-glow mt-1">You're fasting</h2>
      <p className="text-soma-mist text-xs mt-2">
        Your progress and the paired meditation are one tap below.
      </p>
    </div>
  );
}

/** Whole-day difference between two ISO dates (UTC midnight anchored). */
function daysUntil(fromIso: string, toIso: string): number {
  return Math.round(
    (new Date(toIso + 'T00:00:00Z').getTime() -
      new Date(fromIso + 'T00:00:00Z').getTime()) /
      86_400_000,
  );
}

function NextFastCard({
  day,
  days,
  onAddToCalendar,
}: {
  day: SomaDay;
  days: number;
  onAddToCalendar: () => void;
}) {
  const when = days === 1 ? 'tomorrow' : `in ${days} days`;
  return (
    <div className="soma-card p-5 animate-rise mb-4 border-soma-glow/30 bg-soma-glow/5">
      <div className="text-xs text-soma-accent uppercase tracking-wider">
        Your first fast
      </div>
      <h2 className="display-serif text-2xl text-soma-glow mt-1">{day.title}</h2>
      <p className="text-soma-mist text-xs mt-2">
        {when.charAt(0).toUpperCase() + when.slice(1)} · a {day.intensityHours}-hour
        lunar fast
      </p>
      <p className="text-soma-moon text-sm mt-3 leading-relaxed">
        Today is a rest day — the rhythm isn't every day. Lock in your next fast
        so it doesn't slip past.
      </p>
      <button className="soma-btn-primary w-full mt-4" onClick={onAddToCalendar}>
        Add my fasts to calendar
      </button>
      <p className="text-[11px] text-soma-mist text-center mt-2">
        Downloads a .ics for Apple, Google, or Outlook — the reliable reminder.
      </p>
    </div>
  );
}
