import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ResetSomaDialog } from './ResetSomaDialog';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional callback fired after a hard reset is confirmed. */
  onReset?: () => void;
}

interface ErrorBoundaryState {
  error: Error | null;
  resetOpen: boolean;
}

/**
 * Top-level error boundary (S4 §T23).
 *
 * Catches unhandled render errors thrown by descendants and renders a calm
 * fallback UI rather than the white-screen-of-death. Offers a "Reset Soma"
 * escape hatch that opens the same destructive {@link ResetSomaDialog}
 * used in Settings, plus a soft "Try again" button that re-mounts the tree.
 *
 * Per React docs (R11), `getDerivedStateFromError` only swallows real
 * `Error` instances — Suspense uses thrown promises which must continue
 * to bubble.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null, resetOpen: false };

  static getDerivedStateFromError(error: unknown): Partial<ErrorBoundaryState> | null {
    // Only catch real Errors — let Suspense thrown-promises bubble.
    if (error instanceof Error) return { error };
    return null;
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Production: silent. Development would log here, but we obey the
    // no-console-in-source rule across the codebase.
  }

  private handleRetry = () => {
    this.setState({ error: null, resetOpen: false });
  };

  private handleOpenReset = () => {
    this.setState({ resetOpen: true });
  };

  private handleCancelReset = () => {
    this.setState({ resetOpen: false });
  };

  private handleConfirmReset = () => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.clear();
      }
    } catch {
      /* storage unavailable — silently continue */
    }
    this.props.onReset?.();
    // Hard reload so the AppStateProvider re-hydrates from empty state.
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        role="alert"
        aria-live="assertive"
        className="h-full flex flex-col items-center justify-center px-6 text-center bg-soma-night text-soma-moon"
      >
        <div className="max-w-sm">
          <h1 className="display-serif text-2xl text-soma-glow">
            Something slipped.
          </h1>
          <p className="text-soma-mist text-sm leading-relaxed mt-3">
            The moon is still rising. Soma hit an unexpected error and stepped
            back to keep your data safe.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              className="soma-btn-primary w-full"
              onClick={this.handleRetry}
            >
              Try again
            </button>
            <button
              type="button"
              className="soma-btn-ghost w-full"
              onClick={this.handleOpenReset}
            >
              Reset Soma
            </button>
          </div>
        </div>

        <ResetSomaDialog
          open={this.state.resetOpen}
          onCancel={this.handleCancelReset}
          onConfirm={this.handleConfirmReset}
        />
      </div>
    );
  }
}
