import { useEffect, useRef, useState } from 'react';
import { getCitation } from '../lib/citations';
import { useVoice } from '../i18n/useVoice';

interface ReceiptChipProps {
  citationId: string;
  /** Optional override for the visible chip label (defaults to a bookmark icon). */
  label?: string;
}

const HEADER_BY_VOICE: Record<string, string> = {
  coach: "Why we're saying this",
  scientific: 'Reference',
  traditional: 'Source',
};

/**
 * Inline citation chip — renders as a small superscript bookmark icon next
 * to the cited claim. Tapping the chip opens an accessible overlay
 * containing the citation title, a one-line summary, and an outbound
 * "Read source" link.
 *
 * The overlay closes on Escape, on click outside, and returns focus to
 * the trigger when dismissed. Honors `prefers-reduced-motion`.
 */
export function ReceiptChip({ citationId, label }: ReceiptChipProps) {
  const citation = getCitation(citationId);
  const { voice } = useVoice();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    function onClick(e: MouseEvent) {
      const target = e.target as Node;
      if (overlayRef.current && !overlayRef.current.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  useEffect(() => {
    if (!open && triggerRef.current) {
      triggerRef.current.focus();
    }
  }, [open]);

  if (!citation) return null;

  const header = HEADER_BY_VOICE[voice] ?? 'Source';

  return (
    <span className="relative inline-block align-baseline">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Citation: ${citation.title}`}
        className="ml-0.5 inline-flex items-center justify-center align-baseline text-soma-accent hover:text-soma-glow focus:outline-none focus:ring-2 focus:ring-soma-accent rounded text-[10px] font-semibold"
      >
        <sup className="leading-none">{label ?? '◊'}</sup>
      </button>
      {open && (
        <div
          ref={overlayRef}
          role="dialog"
          aria-modal="false"
          aria-label={header}
          className="absolute z-50 left-0 mt-1 w-64 rounded-xl bg-soma-ink/95 border border-white/15 p-4 shadow-xl text-left"
        >
          <div className="text-[10px] uppercase tracking-wider text-soma-accent">
            {header}
          </div>
          <div className="text-soma-glow text-sm font-medium mt-1">
            {citation.title}
          </div>
          <p className="text-soma-mist text-xs leading-relaxed mt-2">
            {citation.summary}
          </p>
          <a
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 text-xs text-soma-accent hover:text-soma-glow"
          >
            Read source →
          </a>
        </div>
      )}
    </span>
  );
}
