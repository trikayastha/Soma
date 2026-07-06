import type { ReactNode } from 'react';

export type TabId =
  | 'today'
  | 'wisdom'
  | 'rhythm';

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  // Rhythm sits far right — it's the "you" tab (personal history, and
  // Settings nests behind the gear in its header).
  const tabs: Array<{ id: TabId; label: string; icon: ReactNode }> = [
    { id: 'today', label: 'Today', icon: <MoonIcon /> },
    { id: 'wisdom', label: 'Wisdom', icon: <WisdomIcon /> },
    { id: 'rhythm', label: 'Rhythm', icon: <RhythmIcon /> },
  ];

  return (
    <nav
      className="shrink-0 bg-soma-night/95 backdrop-blur-md border-t border-white/5 pt-2"
      aria-label="Primary"
      style={{ paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <ul className="flex items-center justify-around">
        {tabs.map((t) => {
          const on = active === t.id;
          return (
            <li key={t.id}>
              <button
                onClick={() => onChange(t.id)}
                aria-current={on ? 'page' : undefined}
                aria-label={t.label}
                className={`flex flex-col items-center gap-1 px-2 py-2 min-h-[44px] min-w-[44px] rounded-xl transition-colors duration-200 ${
                  on ? 'text-soma-glow' : 'text-soma-mist hover:text-soma-moon'
                }`}
              >
                <span className="w-6 h-6">{t.icon}</span>
                <span className="text-[10px] font-medium tracking-wide">{t.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function MoonIcon() {
  // Canonical waning-crescent glyph (Lucide "moon").
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}
function RhythmIcon() {
  // Concentric rings — evokes a 40-day mandala.
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}
function WisdomIcon() {
  // Crescent moon framed by a soft halo — reads as "share-worthy moment".
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 3.5a8.5 8.5 0 1 0 4.5 11.5A6.5 6.5 0 0 1 16 3.5Z" />
      <circle cx="12" cy="12" r="10.5" opacity="0.25" />
    </svg>
  );
}
