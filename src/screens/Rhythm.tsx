import { useMemo } from 'react';
import { AmbientBackground } from '../components/AmbientBackground';
import { MandalaRing } from '../components/MandalaRing';
import { DeltaCard } from '../components/DeltaCard';
import { PaksaSessionList } from '../components/PaksaSessionList';
import { MandalaSeasonStrip } from '../components/MandalaSeasonStrip';
import { useAppState } from '../state/AppStateContext';
import { useVoice } from '../i18n/useVoice';
import { mandalaHistory } from '../lib/mandala';
import { computeDeltas } from '../lib/delta';

export function Rhythm() {
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
        <header className="px-6 pt-6 shrink-0">
          <h1 className="display-serif text-3xl text-soma-glow">
            {t('rhythm.title')}
          </h1>
          <p className="text-soma-mist text-xs mt-1">{t('rhythm.subtitle')}</p>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-6 pt-4 pb-8 space-y-4">
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
