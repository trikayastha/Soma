import posthog from 'posthog-js';

export function initPostHog(): void {
  if (typeof window === 'undefined') return;
  posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string, {
    api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string,
    person_profiles: 'identified_only',
    capture_pageview: false,
  });
}

export { posthog };
