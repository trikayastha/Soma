import { useEffect, useState, type ReactNode } from 'react';

interface PhoneFrameProps {
  children: ReactNode;
}

/**
 * Mobile-first shell.
 *
 * The app is a mobile web app at every viewport. On large screens we simply
 * center the same mobile-sized viewport — no skeuomorphic phone chrome. This
 * keeps hit targets, typography, and layout identical across devices and
 * makes the demo feel like the native mobile app the PRD describes.
 */
export function PhoneFrame({ children }: PhoneFrameProps) {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-[100dvh] w-full bg-[#05060A] flex items-stretch justify-center">
      <div className="w-full max-w-[430px] min-h-[100dvh] bg-soma-ink flex flex-col relative lg:my-4 lg:min-h-[calc(100dvh-32px)] lg:rounded-[40px] lg:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.05)] lg:overflow-hidden">
        <MobileStatusBar now={now} />
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}

function MobileStatusBar({ now }: { now: Date }) {
  const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return (
    <div
      className="shrink-0 h-9 flex items-center justify-between px-5 text-soma-moon text-[11px] font-semibold tracking-wide"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      aria-hidden="true"
    >
      <span>{time}</span>
      <span className="tracking-[0.3em] text-soma-mist">SOMA</span>
      <span className="flex items-center gap-1">
        <SignalIcon />
        <WifiIcon />
        <BatteryIcon />
      </span>
    </div>
  );
}

function SignalIcon() {
  return (
    <svg width="14" height="9" viewBox="0 0 16 10" fill="currentColor">
      <rect x="0" y="6" width="2" height="4" rx="0.5" />
      <rect x="4" y="4" width="2" height="6" rx="0.5" />
      <rect x="8" y="2" width="2" height="8" rx="0.5" />
      <rect x="12" y="0" width="2" height="10" rx="0.5" />
    </svg>
  );
}
function WifiIcon() {
  return (
    <svg width="12" height="9" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 3.5 A9 9 0 0 1 13 3.5" />
      <path d="M3 5.5 A6 6 0 0 1 11 5.5" />
      <circle cx="7" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}
function BatteryIcon() {
  return (
    <svg width="20" height="10" viewBox="0 0 22 11" fill="none">
      <rect x="0.5" y="0.5" width="18" height="10" rx="2" stroke="currentColor" />
      <rect x="2" y="2" width="15" height="7" rx="1" fill="currentColor" />
      <rect x="19.5" y="3.5" width="1.5" height="4" rx="0.5" fill="currentColor" />
    </svg>
  );
}
