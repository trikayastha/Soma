import { useEffect, useId, useRef } from 'react';

interface ConfirmDialogProps {
  /** Whether the dialog overlay is visible. */
  open: boolean;
  /** Title rendered at the top of the dialog. */
  title: string;
  /** Body copy explaining what's about to happen. */
  body: string;
  /** Label for the confirming button. */
  confirmLabel: string;
  /** Label for the dismiss button. */
  cancelLabel?: string;
  /** Variant — `gentle` (default) is non-destructive; `destructive` styles in crimson. */
  variant?: 'gentle' | 'destructive';
  /** Fired when the user confirms. */
  onConfirm: () => void;
  /** Fired when the user dismisses (Esc, backdrop click, cancel button). */
  onCancel: () => void;
}

/**
 * Lightweight, accessible replacement for `window.confirm()` (S4 §T24).
 *
 * Esc closes, backdrop click closes, focus trap keeps Tab inside the panel,
 * and focus is restored to the previously focused element on close.
 *
 * Designed for non-destructive flows (e.g. "End fast early?"). For
 * truly destructive operations (wipe-all-state) prefer
 * {@link ResetSomaDialog}, which adds a typed-RESET gate.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  variant = 'gentle',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const bodyId = useId();

  // Capture the trigger so focus returns to it on close.
  useEffect(() => {
    if (open) {
      previouslyFocused.current = (document.activeElement as HTMLElement) ?? null;
      // Move focus into the dialog on open.
      const id = window.setTimeout(() => confirmRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    } else if (previouslyFocused.current) {
      previouslyFocused.current.focus?.();
      previouslyFocused.current = null;
    }
  }, [open]);

  // Esc-to-close + Tab focus trap.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key !== 'Tab') return;
      const root = dialogRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmClass =
    variant === 'destructive'
      ? 'flex-1 py-3 rounded-full border border-soma-crimson text-soma-crimson text-sm bg-soma-crimson/10'
      : 'soma-btn-primary flex-1';

  const accentClass =
    variant === 'destructive' ? 'text-soma-crimson' : 'text-soma-glow';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div ref={dialogRef} className="soma-card w-full max-w-md p-5">
        <h2 id={titleId} className={`display-serif text-2xl ${accentClass}`}>
          {title}
        </h2>
        <p id={bodyId} className="text-soma-moon text-sm leading-relaxed mt-3">
          {body}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="soma-btn-ghost flex-1"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            ref={confirmRef}
            className={confirmClass}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
