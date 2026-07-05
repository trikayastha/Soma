import { useEffect, useId, useRef, useState } from 'react';

interface ResetSomaDialogProps {
  /** Whether the dialog overlay is visible. */
  open: boolean;
  /** Fired when the user dismisses the dialog. */
  onCancel: () => void;
  /** Fired when the user types RESET and confirms. */
  onConfirm: () => void;
}

/**
 * Two-step "Reset Soma" confirmation dialog (S4 §T24).
 *
 * Step 1 explains the consequences plainly. Step 2 requires the user to
 * type the literal word `RESET` (case-insensitive) into a text gate before
 * the destructive button enables. Esc dismisses, focus is trapped to the
 * dialog while it is open, and focus is restored to the trigger on close.
 *
 * Note: keep the typed-gate copy in plain English — never localised. The
 * exact word is part of the safety contract and should not vary.
 */
export function ResetSomaDialog({
  open,
  onCancel,
  onConfirm,
}: ResetSomaDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [gate, setGate] = useState('');
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  // Reset internal state every time the dialog opens fresh.
  useEffect(() => {
    if (open) {
      setStep(1);
      setGate('');
      previouslyFocused.current = (document.activeElement as HTMLElement) ?? null;
    } else if (previouslyFocused.current) {
      // Restore focus on close.
      previouslyFocused.current.focus?.();
      previouslyFocused.current = null;
    }
  }, [open]);

  // Esc-to-close + simple focus trap.
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

  // Focus the input when step 2 mounts.
  useEffect(() => {
    if (open && step === 2) {
      // Defer to allow the input to mount.
      const id = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
  }, [open, step]);

  if (!open) return null;

  const gateOk = gate.trim().toUpperCase() === 'RESET';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => {
        // Click outside the panel cancels.
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        className="soma-card w-full max-w-md p-5 border-soma-crimson/30"
      >
        <h2
          id={titleId}
          className="display-serif text-2xl text-soma-crimson"
        >
          Reset Soma?
        </h2>
        {step === 1 ? (
          <>
            <p
              id={descId}
              className="text-soma-moon text-sm leading-relaxed mt-3"
            >
              This wipes your profile, schedule, completed fasts, mandalas,
              and preferences from this device. It cannot be undone. Export
              your data first if you want a copy.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                className="soma-btn-ghost flex-1"
                onClick={onCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 py-3 rounded-full border border-soma-crimson/40 text-soma-crimson text-sm"
                onClick={() => setStep(2)}
              >
                Continue
              </button>
            </div>
          </>
        ) : (
          <>
            <p
              id={descId}
              className="text-soma-moon text-sm leading-relaxed mt-3"
            >
              Type <span className="font-mono text-soma-crimson">RESET</span>{' '}
              to confirm. There is no recovery after this.
            </p>
            <input
              ref={inputRef}
              value={gate}
              onChange={(e) => setGate(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-label="Type RESET to confirm"
              className="mt-4 w-full bg-transparent border-b border-soma-crimson/40 text-soma-moon py-2 text-sm outline-none focus:border-soma-crimson"
            />
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                className="soma-btn-ghost flex-1"
                onClick={onCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 py-3 rounded-full border border-soma-crimson text-soma-crimson text-sm bg-soma-crimson/10 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={onConfirm}
                disabled={!gateOk}
              >
                Reset everything
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
