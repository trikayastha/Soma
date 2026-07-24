import { initPostHog, posthog } from './posthog';

/**
 * Provider-agnostic analytics wrapper.
 *
 * The rest of the app only ever imports {@link track}, {@link identify}, and
 * {@link initAnalytics} from here — never a vendor SDK directly. Swapping the
 * PostHog backend for anything else is a one-file change.
 *
 * Design constraints:
 *   - Privacy-first: no PII, no cross-site identifiers. We send event names and
 *     coarse, non-identifying props only (kind of fast, onboarding step, etc.).
 *   - Never throws: analytics failures must never break a user flow.
 *   - No-op off the browser.
 */

/** The complete funnel vocabulary. Add new events here so they stay auditable. */
export type AnalyticsEvent =
  | 'app_opened'
  | 'pwa_installed'
  | 'onboarding_step'
  | 'onboarding_complete'
  | 'value_seen'
  | 'intent_selected'
  | 'safety_gate'
  | 'fast_started'
  | 'fast_completed'
  | 'fast_aborted'
  | 'first_fast_intensity_chosen'
  | 'wisdom_card_shared'
  | 'reminder_scheduled'
  | 'notification_philosophy_changed'
  | 'calendar_exported'
  | 'settings_intensity_changed'
  | 'settings_location_set'
  | 'settings_voice_changed'
  | 'settings_theme_changed'
  | 'archetype_completed'
  | 'tithi_sheet_viewed'
  | 'meditation_started'
  | 'meditation_completed'
  | 'mandala_milestone'
  | 'tab_switched'
  | 'wisdom_segment_changed'
  | 'read_filter_changed'
  | 'data_exported'
  | 'calendar_day_selected'
  | 'calendar_month_changed'
  | 'reminder_permission_denied'
  | 'data_reset';

/** String | number | boolean | null — PostHog-safe property values. */
export type AnalyticsProps = Record<string, string | number | boolean | null>;

let injected = false;

/**
 * Mount all analytics scripts exactly once. Safe to call on every app start;
 * subsequent calls and non-browser environments are no-ops.
 */
export function initAnalytics(): void {
  if (injected || typeof window === 'undefined') return;
  injected = true;
  try {
    initPostHog();
  } catch {
    // Never let PostHog init failure interrupt the app.
  }
}

/**
 * Record a funnel event. Silently swallows any failure so instrumentation can
 * be dropped into hot paths without a try/catch at every call site.
 */
export function track(event: AnalyticsEvent, props?: AnalyticsProps): void {
  try {
    posthog.capture(event, props);
  } catch {
    // PostHog failures are silent — never interrupt the user.
  }
}

/**
 * Attach non-PII profile properties to the current PostHog person. Uses
 * PostHog's auto-generated distinct ID so no custom ID generation is needed.
 * Call once after onboarding completes and whenever profile properties change.
 */
export function identify(properties: AnalyticsProps): void {
  try {
    posthog.identify(posthog.get_distinct_id(), properties);
  } catch {
    // Silent — identification is best-effort.
  }
}
