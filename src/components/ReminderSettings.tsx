import { useEffect, useRef, useState } from 'react';
import { useAppState } from '../state/AppStateContext';
import {
  downloadIcs,
  getPermissionState,
  requestPermission,
  type PermissionState,
} from '../lib/reminders';
import type { NotificationPhilosophy, RemindersPrefs } from '../lib/types';
import { useVoice } from '../i18n/useVoice';
import { track } from '../lib/analytics';

const TIME_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '06:00', label: '6 AM' },
  { value: '12:00', label: '12 PM' },
  { value: '17:00', label: '5 PM' },
  { value: '20:00', label: '8 PM' },
];

const LEAD_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
];

export function ReminderSettings() {
  const { state, setProfile, setNotificationPhilosophy } = useAppState();
  const { t } = useVoice();
  const profile = state.profile;
  const philosophy = state.preferences.notificationPhilosophy;
  const [permission, setPermission] = useState<PermissionState>(() => getPermissionState());
  const [downloadedAt, setDownloadedAt] = useState<Date | null>(null);
  const timePillRef = useRef<HTMLButtonElement>(null);
  const leadPillRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setPermission(getPermissionState());
    // Scroll each selected pill into view so users immediately see the active
    // option even when it lives beyond the right edge of the scroll container.
    for (const ref of [timePillRef, leadPillRef]) {
      const el = ref.current;
      if (el && typeof el.scrollIntoView === 'function') {
        try {
          el.scrollIntoView({ inline: 'center', block: 'nearest' });
        } catch {
          // ignore
        }
      }
    }
  }, []);

  if (!profile) return null;
  const prefs = profile.reminders;

  function update(partial: Partial<RemindersPrefs>) {
    if (!profile) return;
    setProfile({ ...profile, reminders: { ...profile.reminders, ...partial } });
  }

  async function handleToggleLive() {
    if (!profile) return;
    if (prefs.liveNotifications) {
      update({ liveNotifications: false });
      return;
    }
    const res = await requestPermission();
    setPermission(res);
    if (res === 'granted') {
      update({ liveNotifications: true });
      track('reminder_scheduled', { channel: 'push', source: 'settings' });
      try {
        new Notification('Soma', { body: "Live reminders are on. We'll ping you on fast days." });
      } catch {
        // ignore
      }
    }
  }

  function handleDownload() {
    if (!profile) return;
    downloadIcs(profile, state.schedule);
    track('calendar_exported', {
      source: 'settings',
      event_count: state.schedule.length,
    });
    setDownloadedAt(new Date());
  }

  const denied = permission === 'denied';
  const unsupported = permission === 'unsupported';

  return (
    <section className="soma-card p-5 mt-4">
      <div className="text-[10px] uppercase tracking-wider text-soma-mist">Reminders</div>
      <p className="text-soma-moon text-sm mt-1">
        Never miss a Soma day. Pick what you want.
      </p>

      <fieldset className="mt-4">
        <legend className="text-[10px] uppercase tracking-wider text-soma-accent">
          {t('notif.philosophy.title')}
        </legend>
        <p className="text-[11px] text-soma-mist mt-1 leading-relaxed">
          {t('notif.philosophy.framing')}
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {(
            [
              { id: 'quiet', labelKey: 'notif.philosophy.quiet' },
              { id: 'standard', labelKey: 'notif.philosophy.standard' },
              { id: 'detailed', labelKey: 'notif.philosophy.detailed' },
            ] as const
          ).map((opt) => {
            const selected = philosophy === opt.id;
            return (
              <label
                key={opt.id}
                className={`soma-card cursor-pointer px-4 py-3 transition-colors ${
                  selected ? 'border-soma-glow/60 bg-soma-glow/5' : ''
                }`}
              >
                <input
                  type="radio"
                  name="notif-philosophy"
                  value={opt.id}
                  checked={selected}
                  onChange={() => {
                    setNotificationPhilosophy(opt.id as NotificationPhilosophy);
                    track('notification_philosophy_changed', {
                      philosophy: opt.id,
                    });
                  }}
                  className="sr-only"
                />
                <div className="text-soma-moon text-sm font-medium">
                  {t(opt.labelKey)}
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-wider text-soma-mist">
          Fast begins at
        </div>
        <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
          {TIME_OPTIONS.map((opt) => {
            const on = prefs.dayOfTime === opt.value;
            return (
              <button
                key={opt.value}
                ref={on ? timePillRef : undefined}
                onClick={() => update({ dayOfTime: opt.value })}
                className={`shrink-0 px-4 py-2 rounded-full text-sm border min-h-[44px] transition-colors duration-200 ${
                  on
                    ? 'bg-soma-glow text-soma-ink border-soma-glow'
                    : 'border-white/15 text-soma-moon hover:border-white/30'
                }`}
                aria-pressed={on}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-wider text-soma-mist">
          Remind me ahead by
        </div>
        <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
          {LEAD_OPTIONS.map((opt) => {
            const on = prefs.leadMinutes === opt.value;
            return (
              <button
                key={opt.value}
                ref={on ? leadPillRef : undefined}
                onClick={() => update({ leadMinutes: opt.value })}
                className={`shrink-0 px-4 py-2 rounded-full text-sm border min-h-[44px] transition-colors duration-200 ${
                  on
                    ? 'bg-soma-glow text-soma-ink border-soma-glow'
                    : 'border-white/15 text-soma-moon hover:border-white/30'
                }`}
                aria-pressed={on}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-white/5">
        <div className="text-[10px] uppercase tracking-wider text-soma-accent">
          Calendar & alarm
        </div>
        <p className="text-soma-mist text-xs mt-1 leading-relaxed">
          Download a .ics file with every upcoming Soma day, including an alarm at the
          chosen time. Import into Apple Calendar, Google Calendar, or Outlook.
        </p>
        <button className="soma-btn-primary w-full mt-3" onClick={handleDownload}>
          Download calendar (.ics)
        </button>
        {downloadedAt && (
          <p className="text-[11px] text-soma-sage text-center mt-2">
            Downloaded {state.schedule.length} events. Open the file to import.
          </p>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-white/5">
        <div className="text-[10px] uppercase tracking-wider text-soma-accent">
          Live notifications
        </div>
        <p className="text-soma-mist text-xs mt-1 leading-relaxed">
          When Soma is open, receive a browser notification at your chosen time. Only
          fires while Soma is running — the calendar file is the reliable path.
        </p>
        <button
          onClick={handleToggleLive}
          disabled={denied || unsupported}
          className="mt-3 flex items-center justify-between w-full px-4 py-3 rounded-2xl border border-white/10 min-h-[52px] disabled:opacity-50"
          aria-pressed={prefs.liveNotifications}
        >
          <span className="text-soma-moon text-sm">
            {unsupported
              ? 'Not supported in this browser'
              : denied
              ? 'Blocked — enable in browser settings'
              : prefs.liveNotifications
              ? 'Live notifications on'
              : 'Enable live notifications'}
          </span>
          <span
            className={`w-10 h-6 rounded-full relative transition-colors ${
              prefs.liveNotifications ? 'bg-soma-sage' : 'bg-white/15'
            }`}
            aria-hidden="true"
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                prefs.liveNotifications ? 'left-[calc(100%-22px)]' : 'left-0.5'
              }`}
            />
          </span>
        </button>
      </div>

      <p className="text-[10px] text-soma-mist leading-relaxed mt-4">
        Nothing is sent off your device. Calendar files are generated locally; live
        notifications stay in your browser.
      </p>
    </section>
  );
}
