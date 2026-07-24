import { useState } from 'react';
import { archetypeNudge, getWhyCopy } from '../lib/whyThisDay';
import { ReceiptChip } from './ReceiptChip';
import { useVoice } from '../i18n/useVoice';
import { track } from '../lib/analytics';
import type { Archetype, SomaDayKind } from '../lib/types';

/** Fire content_expanded only when a <details> transitions to open. */
function trackDetailsOpen(
  e: React.SyntheticEvent<HTMLDetailsElement>,
  section: 'why_this_day' | 'tithi_tradition' | 'tithi_science',
) {
  if (e.currentTarget.open) track('content_expanded', { section });
}

interface WhyThisDayProps {
  kind: SomaDayKind;
  archetype: Archetype | null;
  /** Citation IDs backing the day's claims — rendered as inline chips. */
  citationIds?: readonly string[];
  /**
   * `full` (default) is the collapsible panel used inside the Today day card.
   * `compact` renders the same content inside a `<details>` for the Wisdom card.
   */
  variant?: 'full' | 'compact';
}

/**
 * Single "Why this day?" explainer consumed by both the Today day card and the
 * Wisdom screen (consolidation audit F2 — previously two divergent copies).
 *
 * Leads with the plain summary, then Tradition + Science disclosures. The
 * detail matching the active voice is opened by default (scientific → Science,
 * traditional → Tradition, coach → neither). Citation chips sit beside the
 * summary so every claim is one tap from a source.
 */
export function WhyThisDay({
  kind,
  archetype,
  citationIds,
  variant = 'full',
}: WhyThisDayProps) {
  const { voice } = useVoice();
  const why = getWhyCopy(kind);
  const nudge = archetypeNudge(kind, archetype);

  const body = (
    <div className="mt-3 animate-fade-in">
      <h3 className="text-soma-glow text-sm font-semibold">
        {why.heading}
        {citationIds?.map((id) => (
          <ReceiptChip key={id} citationId={id} location="why_this_day" />
        ))}
      </h3>
      <p className="text-soma-mist text-xs leading-relaxed mt-2">{why.plain}</p>
      <details
        className="mt-3 group"
        open={voice === 'traditional'}
        onToggle={(e) => trackDetailsOpen(e, 'tithi_tradition')}
      >
        <summary className="list-none cursor-pointer text-xs text-soma-accent min-h-[44px] flex items-center justify-between border-t border-white/5 pt-3">
          <span className="uppercase tracking-wider">Tradition</span>
          <ChevronIcon size={12} />
        </summary>
        <p className="text-soma-mist text-xs leading-relaxed mt-2">
          {why.tradition}
        </p>
      </details>
      <details
        className="mt-1 group"
        open={voice === 'scientific'}
        onToggle={(e) => trackDetailsOpen(e, 'tithi_science')}
      >
        <summary className="list-none cursor-pointer text-xs text-soma-accent min-h-[44px] flex items-center justify-between border-t border-white/5 pt-3">
          <span className="uppercase tracking-wider">Science</span>
          <ChevronIcon size={12} />
        </summary>
        <p className="text-soma-mist text-xs leading-relaxed mt-2">
          {why.science}
        </p>
      </details>
      {nudge && (
        <p className="text-soma-glow/80 text-xs leading-relaxed mt-3 italic border-t border-white/5 pt-3">
          {nudge}
        </p>
      )}
    </div>
  );

  if (variant === 'compact') {
    return (
      <details
        className="soma-card p-4 mt-4"
        onToggle={(e) => trackDetailsOpen(e, 'why_this_day')}
      >
        <summary className="cursor-pointer text-soma-moon text-sm min-h-[44px] flex items-center">
          Why this day?
        </summary>
        {body}
      </details>
    );
  }

  return <FullPanel>{body}</FullPanel>;
}

/** Toggle wrapper for the Today day-card variant. */
function FullPanel({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => {
          if (!open) track('content_expanded', { section: 'why_this_day' });
          setOpen((v) => !v);
        }}
        className="mt-4 flex items-center justify-between w-full text-left text-soma-moon text-sm border-t border-white/10 pt-4 min-h-[44px] hover:text-soma-glow transition-colors duration-200"
        aria-expanded={open}
      >
        <span>Why this day?</span>
        <ChevronIcon open={open} />
      </button>
      {open && children}
    </>
  );
}

export function ChevronIcon({
  open = false,
  size = 14,
}: {
  open?: boolean;
  size?: number;
}) {
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
