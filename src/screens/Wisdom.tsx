import { useMemo, useState } from 'react';
import { AmbientBackground } from '../components/AmbientBackground';
import { WisdomCard } from '../components/WisdomCard';
import { WhyThisDay } from '../components/WhyThisDay';
import { DeltaCard } from '../components/DeltaCard';
import { ReceiptChip } from '../components/ReceiptChip';
import { SegmentedControl, type Segment } from '../components/SegmentedControl';
import { useAppState } from '../state/AppStateContext';
import { track } from '../lib/analytics';
import {
  elongationToPhaseName,
  moonElongation,
  moonIllumination,
  phaseNameToLabel,
  toISODate,
} from '../lib/lunar';
import { computeTithiAtSunrise, tithiLabel } from '../lib/tithi';
import { resolveWisdom } from '../lib/wisdomContent';
import { computeDeltas } from '../lib/delta';
import { READS, READ_KINDS, type ReadKind } from '../lib/data/reads';

type WisdomSegment = 'today' | 'reads' | 'you';

const SEGMENTS: readonly Segment<WisdomSegment>[] = [
  { id: 'today', label: 'Today' },
  { id: 'reads', label: 'Reads' },
  { id: 'you', label: 'You' },
];

/**
 * Wisdom screen (S4 §T14, expanded) — three segments behind one tab:
 *
 * - **Today**: the live per-tithi shareable card + a compact "Why this day".
 * - **Reads**: the filterable, citation-linked explainer library.
 * - **You**: personal deltas surfaced from logged fasts.
 *
 * The card's benefit + wisdom line + citations come from `resolveWisdom`,
 * which draws on the 30-tithi `tithiMeta` seed rather than a per-screen table.
 */
export function Wisdom() {
  const { state } = useAppState();
  const [segment, setSegment] = useState<WisdomSegment>('today');

  // Engagement + retention: which Wisdom segment users open. "you" is the
  // personal-deltas payoff, so this doubles as the deltas-viewed signal.
  function handleSegment(next: WisdomSegment) {
    if (next === segment) return;
    track('wisdom_segment_changed', { segment: next });
    setSegment(next);
  }

  const now = useMemo(() => new Date(), []);
  const todayIso = toISODate(now);
  const noonUtc = useMemo(() => new Date(`${todayIso}T12:00:00Z`), [todayIso]);

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
    ? todaysSomaDay.title
    : `${phaseNameToLabel(phaseName)} · ${tithiLabel(tithi)}`;

  const wisdom = useMemo(
    () => resolveWisdom(tithi.index, todaysSomaDay?.kind ?? null),
    [tithi.index, todaysSomaDay],
  );

  return (
    <div className="relative h-full flex flex-col">
      <AmbientBackground />
      <div className="relative flex-1 min-h-0 flex flex-col animate-fade-in">
        <header className="px-6 pt-6 shrink-0">
          <h1 className="display-serif text-3xl text-soma-glow">Wisdom</h1>
          <p className="text-soma-mist text-xs mt-1">
            A card for today, short reads, and the patterns in your own practice.
          </p>
          <div className="mt-4">
            <SegmentedControl
              segments={SEGMENTS}
              active={segment}
              onChange={handleSegment}
              ariaLabel="Wisdom sections"
            />
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-6 pt-6 pb-8">
          {segment === 'today' && (
            <div role="tabpanel" aria-label="Today">
              {/* The moon itself lives on the Today tab — Wisdom leads with
                  the prose. The rendered share card (which carries its own
                  moon art) sits collapsed below so the screens don't repeat
                  each other. */}
              <section className="soma-card p-5" aria-label="Today's wisdom">
                <div className="text-[10px] uppercase tracking-wider text-soma-accent">
                  {wisdom.benefit}
                </div>
                <h2 className="display-serif text-2xl text-soma-glow mt-1">
                  {cardLabel}
                </h2>
                <p className="text-soma-moon text-sm leading-relaxed mt-3">
                  {wisdom.line}
                </p>
              </section>

              <details
                className="soma-card p-4 mt-4"
                onToggle={(e) => {
                  if (e.currentTarget.open) {
                    track('content_expanded', { section: 'wisdom_card_preview' });
                  }
                }}
              >
                <summary className="cursor-pointer text-soma-moon text-sm">
                  Preview &amp; share today's card
                </summary>
                <div className="mt-3">
                  <WisdomCard
                    date={now}
                    tithiLabel={cardLabel}
                    oneWordBenefit={wisdom.benefit}
                    wisdomLine={wisdom.line}
                    illumination={illum}
                    waxing={waxing}
                    source="wisdom_today"
                  />
                </div>
              </details>

              {todaysSomaDay && (
                <WhyThisDay
                  kind={todaysSomaDay.kind}
                  archetype={state.preferences.archetype}
                  citationIds={wisdom.citationIds}
                  variant="compact"
                />
              )}
            </div>
          )}

          {segment === 'reads' && <ReadsSegment />}

          {segment === 'you' && (
            <div role="tabpanel" aria-label="You">
              <DeltaCard deltas={computeDeltas(state)} />
              <p className="text-[11px] text-soma-mist mt-4 leading-relaxed">
                Patterns appear once you have at least three logged fasts in a
                context. Everything here stays on your device.
              </p>
              {state.preferences.wisdomCardCount > 0 && (
                <p className="text-[11px] text-soma-mist mt-2">
                  You've kept or shared {state.preferences.wisdomCardCount}{' '}
                  {state.preferences.wisdomCardCount === 1 ? 'card' : 'cards'}.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Filterable, citation-linked explainer library. */
function ReadsSegment() {
  const [filter, setFilter] = useState<ReadKind | 'all'>('all');
  const visible = READS.filter((r) => filter === 'all' || r.kind === filter);

  // Reads-depth signal: which topics users filter to inside the library.
  function handleFilter(next: ReadKind | 'all') {
    if (next === filter) return;
    track('read_filter_changed', { filter: next });
    setFilter(next);
  }

  return (
    <div role="tabpanel" aria-label="Reads">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filter reads by kind"
      >
        <FilterChip
          label="All"
          active={filter === 'all'}
          onClick={() => handleFilter('all')}
        />
        {READ_KINDS.map((k) => (
          <FilterChip
            key={k}
            label={k}
            active={filter === k}
            onClick={() => handleFilter(k)}
          />
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {visible.map((a) => (
          <article key={a.id} className="soma-card p-4">
            <div className="text-[10px] uppercase tracking-wider text-soma-accent">
              {a.kind}
            </div>
            <h3 className="text-soma-moon text-sm font-medium mt-1">
              {a.title}
              {a.citationId && <ReceiptChip citationId={a.citationId} />}
            </h3>
            <p className="text-soma-mist text-xs leading-relaxed mt-2">
              {a.body}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-[36px] rounded-full px-3 text-[11px] font-medium tracking-wide border transition-colors duration-200 ${
        active
          ? 'bg-soma-glow/10 text-soma-glow border-soma-glow/30'
          : 'text-soma-mist border-white/10 hover:text-soma-moon'
      }`}
    >
      {label}
    </button>
  );
}
