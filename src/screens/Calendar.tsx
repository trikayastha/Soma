import { useMemo, useState } from 'react';
import { AmbientBackground } from '../components/AmbientBackground';
import { Calendar as CalendarGrid } from '../components/Calendar';
import { useAppState } from '../state/AppStateContext';
import { toISODate } from '../lib/lunar';
import { computeTithi, tithiLabel } from '../lib/tithi';
import type { SomaDay } from '../lib/types';

interface CalendarScreenProps {
  onStartFast: (day: SomaDay) => void;
}

export function CalendarScreen({ onStartFast }: CalendarScreenProps) {
  const { state } = useAppState();
  const todayIso = toISODate(new Date());

  const [selectedIso, setSelectedIso] = useState<string>(todayIso);
  const [month, setMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });

  const scheduleByDate = useMemo(() => {
    const m = new Map<string, SomaDay>();
    for (const d of state.schedule) m.set(d.date, d);
    return m;
  }, [state.schedule]);

  const selectedSomaDay = scheduleByDate.get(selectedIso) ?? null;
  const selectedTithi = useMemo(
    () => computeTithi(new Date(selectedIso + 'T12:00:00Z')),
    [selectedIso],
  );
  const isSelectedToday = selectedIso === todayIso;

  const prettyDate = useMemo(
    () =>
      new Date(selectedIso + 'T00:00:00Z').toLocaleDateString([], {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      }),
    [selectedIso],
  );

  return (
    <div className="relative h-full flex flex-col">
      <AmbientBackground />
      <div className="relative flex-1 min-h-0 flex flex-col animate-fade-in">
        <header className="px-6 pt-6 shrink-0">
          <p className="text-soma-mist text-xs tracking-widest uppercase">Calendar</p>
          <h1 className="display-serif text-3xl text-soma-glow mt-1">Lunar month</h1>
        </header>

        <div className="shrink-0">
          <CalendarGrid
            month={month}
            todayIso={todayIso}
            selectedIso={selectedIso}
            scheduleByDate={scheduleByDate}
            sessions={state.sessions}
            onSelect={setSelectedIso}
            onMonthChange={setMonth}
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-6 pb-8">
          <div className="soma-card p-5 animate-rise">
            <div className="text-xs text-soma-accent uppercase tracking-wider">
              {prettyDate}
            </div>
            <h2 className="display-serif text-2xl text-soma-glow mt-1">
              {selectedSomaDay ? selectedSomaDay.title : tithiLabel(selectedTithi)}
            </h2>
            <p className="text-soma-mist text-xs mt-2">
              Tithi {selectedTithi.index}/30 · {tithiLabel(selectedTithi)}
              {selectedSomaDay
                ? ` · ${selectedSomaDay.intensityHours}-hour fast`
                : ''}
            </p>
            {selectedSomaDay && (
              <button
                type="button"
                className="soma-btn-primary w-full mt-5"
                onClick={() => onStartFast(selectedSomaDay)}
                disabled={!isSelectedToday}
              >
                {isSelectedToday ? 'Begin fast' : 'View on Today'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
