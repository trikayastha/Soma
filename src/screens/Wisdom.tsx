import { useMemo } from 'react';
import { AmbientBackground } from '../components/AmbientBackground';
import { WisdomCard } from '../components/WisdomCard';
import { useAppState } from '../state/AppStateContext';
import {
  elongationToPhaseName,
  moonElongation,
  moonIllumination,
  phaseNameToLabel,
  toISODate,
} from '../lib/lunar';
import { computeTithiAtSunrise, tithiLabel } from '../lib/tithi';
import { getWhyCopy } from '../lib/whyThisDay';
import type { SomaDayKind } from '../lib/types';

/**
 * Per-kind one-word benefit + wisdom line. Plain English; no Sanskrit in
 * the body copy. The label used on the card itself comes from the live
 * tithi label (e.g. "Shukla Ekadashi") — these are the prose payload.
 */
const WISDOM_BY_KIND: Record<
  SomaDayKind,
  { benefit: string; line: string }
> = {
  ekadashi: {
    benefit: 'Focus',
    line: 'A short fast steadies the mind for the work that matters tomorrow.',
  },
  'full-moon': {
    benefit: 'Stillness',
    line: 'The brightest night asks for less doing — sit, watch, soften the day.',
  },
  'new-moon': {
    benefit: 'Reset',
    line: 'A quiet night is a clean slate. Match the dark sky, then begin again.',
  },
  chaturthi: {
    benefit: 'Rhythm',
    line: 'A small skipped meal becomes a steady cue — show up the same way next month.',
  },
  pradosh: {
    benefit: 'Surrender',
    line: 'Twilight pauses the day. A short evening fast lets it land before sleep.',
  },
  'sankashti-chaturthi': {
    benefit: 'Clearing',
    line: 'A long fast broken at moonrise marks the end of one rhythm and the start of another.',
  },
  shivaratri: {
    benefit: 'Vigil',
    line: 'A long night of stillness is its own teaching. Keep it short, keep it warm.',
  },
};

/**
 * Wisdom screen (S4 §T14) — a per-tithi shareable lunar card.
 *
 * Renders the live moon math for today (or the active selected day) and a
 * one-word benefit + wisdom line drawn from the per-kind table above.
 * Falls back to a generic phase-only card when the user is not on a
 * scheduled SomaDay.
 */
export function Wisdom() {
  const { state } = useAppState();
  const now = useMemo(() => new Date(), []);
  const todayIso = toISODate(now);

  const noonUtc = useMemo(
    () => new Date(`${todayIso}T12:00:00Z`),
    [todayIso],
  );

  const elongation = useMemo(() => moonElongation(noonUtc), [noonUtc]);
  const illum = useMemo(() => moonIllumination(noonUtc), [noonUtc]);
  const phaseName = elongationToPhaseName(elongation);
  const waxing = elongation < 180;

  const location = state.profile?.location ?? null;
  const tithi = useMemo(
    () => computeTithiAtSunrise(noonUtc, location),
    [noonUtc, location],
  );

  const todaysSomaDay = useMemo(
    () => state.schedule.find((d) => d.date === todayIso) ?? null,
    [state.schedule, todayIso],
  );

  const cardLabel = todaysSomaDay
    ? // SomaDay carries a pretty title (e.g. "Shukla Ekadashi").
      todaysSomaDay.title
    : `${phaseNameToLabel(phaseName)} · ${tithiLabel(tithi)}`;

  const wisdom = todaysSomaDay
    ? WISDOM_BY_KIND[todaysSomaDay.kind]
    : {
        benefit: 'Notice',
        line: 'The moon is a slow hand on a quiet clock. Step outside; look up.',
      };

  return (
    <div className="relative h-full flex flex-col">
      <AmbientBackground />
      <div className="relative flex-1 min-h-0 flex flex-col animate-fade-in">
        <header className="px-6 pt-6 shrink-0">
          <h1 className="display-serif text-3xl text-soma-glow">Wisdom</h1>
          <p className="text-soma-mist text-xs mt-1">
            A small card for today's lunar day. Yours to keep or share.
          </p>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-6 pt-6 pb-8">
          <WisdomCard
            date={now}
            tithiLabel={cardLabel}
            oneWordBenefit={wisdom.benefit}
            wisdomLine={wisdom.line}
            illumination={illum}
            waxing={waxing}
          />

          {todaysSomaDay && (
            <details className="soma-card p-4 mt-4">
              <summary className="cursor-pointer text-soma-moon text-sm">
                Why this day?
              </summary>
              <p className="text-soma-mist text-xs leading-relaxed mt-2">
                {getWhyCopy(todaysSomaDay.kind).plain}
              </p>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
