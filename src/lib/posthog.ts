import posthog from 'posthog-js';

export function initPostHog(): void {
  if (typeof window === 'undefined') return;
  posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string, {
    // Same-origin reverse proxy (see vercel.json rewrites). Falls back to /ingest
    // so analytics survive ad-blockers without a custom domain.
    api_host: (import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string) || '/ingest',
    ui_host: 'https://us.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false,
  });
}

export { posthog };
