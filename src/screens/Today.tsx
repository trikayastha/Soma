import { useMemo, useState } from 'react';
import { useVoice } from '../i18n/useVoice';
import { MoonPhase } from '../components/MoonPhase';
import { AmbientBackground } from '../components/AmbientBackground';
import { Calendar as CalendarGrid } from '../components/Calendar';
import { PhaseRhythmStrip } from '../components/PhaseRhythmStrip';
import { DayCard } from '../components/DayCard';
import { useAppState } from '../state/AppStateContext';
import { phaseNameToLabel, toISODate } from '../lib/lunar';
import { tithiLabel } from '../lib/tithi';
import { ComputedAtBanner } from '../components/ComputedAtBanner';
import { MandalaChip } from '../components/MandalaChip';
import { SyncedNowPill } from '../components/SyncedNowPill';
import { useLunarDay, useScheduleByDate } from '../lib/useLunarDay';
import type { SomaDay } from '../lib/types';
import { findActiveSession, makePersonalVrat } from '../lib/scheduler';
import { currentMandala } from '../lib/mandala';

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
  const [month, setMonth] = useState<Date>(
    () => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
  );

  const location = state.profile?.location ?? null;
  const { illum, phaseName, waxing, tithi } = useLunarDay(selectedIso, location);
  const scheduleByDate = useScheduleByDate(state.schedule);

  const selectedSomaDay = scheduleByDate.get(selectedIso) ?? null;
  const active = findActiveSession(state.sessions);
  const mandala = useMemo(() => currentMandala(state, now), [state, now]);

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
            <MoonPhase illumination={illum} waxing={waxing} size={200} />
          </div>

          {/* Monthly view lives inline on Today — tapping a date drives the
              day card below; the strip taps back to today. */}
          <div className="mb-4">
            <div style={{ contain: 'layout' }}>
              <PhaseRhythmStrip
                index={tithi.index}
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

          {active && isSelectedToday ? (
            <ActiveCard onResume={onResumeActive} />
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
