// Vercel serverless function: POST /api/subscribe
//
// Captures a "notify me when Soma leaves beta" email. Provider-agnostic and
// configured entirely through environment variables so no secret ever lives in
// the repo. It tries providers in order and 501s if none are configured:
//
//   1. Resend audience   — set RESEND_API_KEY (RESEND_AUDIENCE_ID optional;
//                          defaults to your first audience)
//   2. Generic webhook    — set SUBSCRIBE_WEBHOOK_URL (Zapier / Make / Sheet)
//
// Everything is best-effort and privacy-minimal: we store only the email plus
// a coarse source tag. No tracking cookies, no third-party identifiers.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readBody(req) {
  // Vercel parses JSON bodies automatically, but guard for string/undefined.
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

// Resolve which audience (contact list) to add to. Prefer an explicit env
// var; otherwise fall back to the account's first audience so the API key
// alone is enough to get started.
async function resolveAudienceId(key) {
  const explicit = process.env.RESEND_AUDIENCE_ID;
  if (explicit) return explicit;
  const res = await fetch('https://api.resend.com/audiences', {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`Resend audiences responded ${res.status}`);
  const json = await res.json();
  const first = json && json.data && json.data[0];
  return first ? first.id : null;
}

async function addToResend(email) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const audience = await resolveAudienceId(key);
  if (!audience) {
    throw new Error('No Resend audience found — create one in Resend first.');
  }
  const res = await fetch(
    `https://api.resend.com/audiences/${audience}/contacts`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, unsubscribed: false }),
    },
  );
  // 201 created, or 409/422 when the contact already exists — both are "ok"
  // from the user's point of view (they're on the list).
  if (res.ok || res.status === 409 || res.status === 422) return true;
  throw new Error(`Resend responded ${res.status}`);
}

async function postToWebhook(email, source) {
  const url = process.env.SUBSCRIBE_WEBHOOK_URL;
  if (!url) return false;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, source, at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const body = readBody(req);
  const email = String(body.email || '').trim().toLowerCase();
  // Honeypot: real users never fill a hidden field. Pretend success so bots
  // don't learn they were caught.
  if (body.company) return res.status(200).json({ ok: true });

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return res
      .status(400)
      .json({ ok: false, error: 'Please enter a valid email address.' });
  }

  const source = String(body.source || 'landing').slice(0, 40);

  try {
    const stored = (await addToResend(email)) || (await postToWebhook(email, source));
    if (!stored) {
      return res.status(501).json({
        ok: false,
        error: 'Email capture is not configured yet.',
      });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    // Never leak provider details or keys to the client.
    console.error('subscribe failed:', err && err.message);
    return res
      .status(502)
      .json({ ok: false, error: 'Something went wrong. Please try again.' });
  }
}
