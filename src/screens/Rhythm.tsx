import { useMemo } from 'react';
import { AmbientBackground } from '../components/AmbientBackground';
import { MandalaRing } from '../components/MandalaRing';
import { DeltaCard } from '../components/DeltaCard';
import { PaksaSessionList } from '../components/PaksaSessionList';
import { MandalaSeasonStrip } from '../components/MandalaSeasonStrip';
import { WeekGlance } from '../components/WeekGlance';
import { useAppState } from '../state/AppStateContext';
import { useVoice } from '../i18n/useVoice';
import { mandalaHistory } from '../lib/mandala';
import { computeDeltas } from '../lib/delta';

interface RhythmProps {
  onOpenSettings: () => void;
}

export function Rhythm({ onOpenSettings }: RhythmProps) {
  const { state } = useAppState();
  const { t } = useVoice();
  const today = new Date();

  const mandalas = useMemo(() => mandalaHistory(state, today), [state, today]);
  const current = mandalas.length > 0 ? mandalas[mandalas.length - 1] : null;
  const deltas = useMemo(() => computeDeltas(state), [state]);

  return (
    <div className="relative h-full flex flex-col">
      <AmbientBackground />
      <div className="relative flex-1 min-h-0 flex flex-col animate-fade-in">
        <header className="px-6 pt-6 shrink-0 flex items-start justify-between">
          <div>
            <h1 className="display-serif text-3xl text-soma-glow">
              {t('rhythm.title')}
            </h1>
            <p className="text-soma-mist text-xs mt-1">{t('rhythm.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Settings"
            className="mt-1 -mr-2 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-soma-mist hover:text-soma-moon transition-colors duration-200"
          >
            <GearIcon />
          </button>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-6 pt-4 pb-8 space-y-4">
          <WeekGlance sessions={state.sessions} today={today} />

          {current ? (
            <section className="soma-card p-5 flex flex-col items-center">
              <MandalaRing mandala={current} today={today} />
              <p className="text-soma-mist text-xs mt-3 text-center">
                {current.observed.length} of {current.expected.length} fasts ·{' '}
                {Math.round(current.completionRate * 100)}%
              </p>
            </section>
          ) : (
            <section className="soma-card p-5">
              <p className="text-soma-mist text-sm">{t('mandala.empty.title')}</p>
            </section>
          )}

          <DeltaCard deltas={deltas} />

          <PaksaSessionList
            sessions={state.sessions}
            schedule={state.schedule}
          />

          {mandalas.length > 0 && <MandalaSeasonStrip mandalas={mandalas} />}
        </div>
      </div>
    </div>
  );
}

function GearIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c0 .66.39 1.26 1 1.51H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}
