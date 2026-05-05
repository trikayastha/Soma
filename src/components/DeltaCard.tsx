import { useState } from 'react';
import type { PersonalDelta } from '../lib/types';
import { useVoice } from '../i18n/useVoice';

interface DeltaCardProps {
  deltas: PersonalDelta[];
  /** Maximum cards visible before "Show all". Defaults to 4. */
  initialLimit?: number;
}

/**
 * Voice-aware personal-delta panel. Renders the empty-state copy when no
 * deltas pass the confidence gate. When deltas exist, shows up to
 * `initialLimit` of them with sign-aware phrasing and a Show-all expander.
 */
export function DeltaCard({ deltas, initialLimit = 4 }: DeltaCardProps) {
  const { t } = useVoice();
  const [expanded, setExpanded] = useState(false);

  if (deltas.length === 0) {
    return (
      <section className="soma-card p-5">
        <div className="text-[10px] uppercase tracking-wider text-soma-mist">
          Personal patterns
        </div>
        <p className="text-soma-mist text-sm mt-3 leading-relaxed">
          {t('rhythm.deltas.empty')}
        </p>
      </section>
    );
  }

  const visible = expanded ? deltas : deltas.slice(0, initialLimit);
  const canExpand = deltas.length > initialLimit;

  return (
    <section className="soma-card p-5">
      <div className="text-[10px] uppercase tracking-wider text-soma-mist">
        Personal patterns
      </div>
      <ul className="mt-3 space-y-3">
        {visible.map((d) => (
          <li key={d.key} className="border-b border-white/5 pb-3 last:border-0">
            <p className="text-soma-glow text-sm">{phraseFor(d)}</p>
            <p className="text-soma-mist text-[11px] mt-1 tabular-nums">
              n = {d.n} sessions · SE = {d.se.toFixed(2)}
            </p>
          </li>
        ))}
      </ul>
      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-soma-accent mt-2 underline underline-offset-4"
        >
          {expanded ? 'Show less' : `Show all (${deltas.length})`}
        </button>
      )}
    </section>
  );
}

/** Sign-aware human phrase — falls back to a neutral template per metric. */
function phraseFor(d: PersonalDelta): string {
  const sign = d.delta >= 0 ? '+' : '−';
  const abs = Math.abs(d.delta).toFixed(1);
  const ctxLabel = contextLabel(d.context);
  switch (d.metric) {
    case 'focus':
      return `Your focus rises ${sign}${abs} on ${ctxLabel}`;
    case 'energy':
      return `Your energy shifts ${sign}${abs} on ${ctxLabel}`;
    case 'mood':
      return `Your mood moves ${sign}${abs} on ${ctxLabel}`;
    case 'sleep':
      return `Your sleep shifts ${sign}${abs} on ${ctxLabel}`;
  }
}

function contextLabel(c: PersonalDelta['context']): string {
  switch (c) {
    case 'shukla-ekadashi':
      return 'Shukla Ekadashi';
    case 'krishna-ekadashi':
      return 'Krishna Ekadashi';
    case 'purnima':
      return 'Purnima';
    case 'amavasya':
      return 'Amavasya';
    case 'pradosh':
      return 'Pradosh';
    case 'sankashti':
      return 'Sankashti Chaturthi';
    case 'shivaratri':
      return 'Shivaratri';
  }
}
