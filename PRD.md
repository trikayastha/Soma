# Soma — Product Requirements Document (PRD)

*Author: Senior PM*
*Date: 2026-04-12*
*Status: Draft v1 — pre-build, pending Gate 1 validation*
*Source inputs: `context.md`, `business_analysis.md`*

---

## 0. Document Purpose

This PRD translates the Soma product context and business feasibility analysis into a buildable specification. It defines the MVP (web-first), the mobile app target, and a phased feature roadmap aligned to the 5 validation gates from `business_analysis.md` §12.

**Reading order:** §1–3 (positioning) → §4 (success metrics) → §5 (MVP web scope) → §6 (mobile scope) → §7 (phased roadmap) → §8+ (technical, risks, open questions).

---

## 1. Product Vision & Positioning

**Vision:** *Soma turns 1,000+ years of Himalayan lunar practice into a simple, science-backed protocol for the modern mind.*

**Tagline:** *Moon for Mental Performance.*

**One-sentence product:** A lunar-cycle fasting and meditation app that schedules your fasts to the moon, pairs them with breath/meditation, and measures the impact on your sleep, focus, and HRV.

**Positioning statement:**
> For optimization-minded adults who have plateaued on intermittent fasting, Soma is a lunar-aligned fasting and meditation app that provides authentic, science-backed mental performance practice — unlike generic IF trackers or astrology-tinged moon apps, Soma is built by Nepali founders with direct lineage to the source tradition.

**What Soma is not:**
- Not a weight-loss app.
- Not an astrology app.
- Not a religious practice app.
- Not a Calm/Headspace meditation library.

---

## 2. Target Users

### Primary persona — "The Optimized Skeptic" (launch persona)
- 28–45, urban US/EU, $80k+ income.
- Already uses Apple Health, Whoop, Oura, or similar.
- Has tried 16:8 IF; it worked, then plateaued.
- Reads Huberman, Attia, listens to Rich Roll.
- **Buying trigger:** "Show me proof. Then I'll fast on your schedule."

### Secondary persona — "The Lunar-Curious Wellness Native"
- 25–40, predominantly female.
- Familiar with Mindy Pelz, cycle-syncing, Ayurveda-adjacent.
- **Buying trigger:** structure + community.

### Anti-personas (explicitly excluded from MVP)
- Hardcore spiritual practitioners.
- Pure weight-loss IF users.
- Astrology-only audiences.

---

## 3. Problem Statements (Job-to-be-Done)

| # | Job | User pain today |
|---|---|---|
| J1 | "Help me fast on a meaningful schedule without thinking about it" | IF apps are arbitrary; willpower runs out |
| J2 | "Make my self-care feel meaningful, not transactional" | Calm/Headspace feel like content libraries, not practice |
| J3 | "Let me prove to myself this actually works on my body" | No app correlates fasting with cognitive/biometric outcomes |
| J4 | "Let me belong to a small tribe doing this together" | Solo fasting is isolating; cohort apps are gimmicky |
| J5 | "Teach me the depth without making me learn Sanskrit" | Authentic sources are inaccessible; pop versions are shallow |

MVP must address **J1, J3, and J5 fully**, and **J4 partially** (cohort fasts as a beta feature). J2 is delivered through tone, design, and content — not a discrete feature.

---

## 4. Success Metrics

### North Star Metric (NSM)
**Lunar-Cycle Adherence Rate (LCAR):** % of users who complete ≥4 of 6 prescribed lunar fasts in a 30-day window.
- Target by Gate 2 (Month 6): **≥40%** of beta users.

### Supporting metrics

| Metric | Target | Phase |
|---|---|---|
| Waitlist signups | 500+ | Gate 1 (M3) |
| Onboarding completion | ≥70% | MVP |
| First fast completion (D7) | ≥60% | MVP |
| D30 retention | ≥45% | Gate 2 (M6) |
| D90 retention | ≥30% | Gate 3 (M9) |
| Subjective focus delta (self-report) | +1 point on 5-pt scale, p<0.05 | Gate 2 |
| HRV delta (Apple Health users) | Measurable signal in 60+ days | Gate 3 |
| Organic CAC | <$30 | Gate 3 |
| Free → Paid conversion | ≥6% | Gate 4 (M12) |
| MRR | $5–10k | Gate 4 |

### Counter-metrics (watch-for, not optimize-for)
- Fasting protocol violation rate (unsafe sessions).
- User-reported adverse events (fatigue, dizziness, ED concerns).
- Support tickets per 100 active users.

---

## 5. MVP — Web App Scope (Months 0–4)

**Why web first:** Faster iteration, no App Store review cycle, easier to A/B onboarding, easier to ship to a 50–200 person closed beta. Web MVP exists *only* to validate adherence before we invest in mobile.

**Platform:** Responsive web app (mobile-first responsive, not native). Installable as a PWA so beta users can add it to their home screen and receive push notifications.

**Tech assumptions:** Next.js App Router on Vercel, Postgres for state, web push for notifications, Apple Health import via CSV upload (no native HealthKit on web).

### 5.1 MVP Feature List (must-have)

| # | Feature | Description | Priority |
|---|---|---|---|
| F1 | **Lunar calendar engine** | Computes Ekadashi, full moon, new moon, and intermediate days for the user's timezone. Pulls from a verified astronomical library (e.g., `astronomy-engine`). | P0 |
| F2 | **Today screen** | "Tomorrow is a Soma Day. 24h fast starts at sunset. Tap to begin." Shows current lunar phase visually. | P0 |
| F3 | **Fast scheduler** | User picks intensity (12h / 16h / 24h). System schedules the next 4 weeks of lunar-aligned fasts. | P0 |
| F4 | **Fast timer** | Active fast countdown, water-only reminder, gentle nudges. Pause/end with reason logging. | P0 |
| F5 | **Pre-fast & post-fast logging** | Subjective scales (1–5): energy, focus, mood, sleep quality. Free-text optional. | P0 |
| F6 | **Why-this-day explainer** | Each fast has a one-tap "Why this day?" expandable card with the Newa/Vedic source explained in plain English. | P0 |
| F7 | **10-minute paired meditation** | One audio session per fast day. MVP ships with 6 sessions (one per lunar fast type). | P0 |
| F8 | **Onboarding flow** | 4 screens: who you are, your goals, fasting experience, intensity selection. <90 seconds. | P0 |
| F9 | **Email + web push notifications** | Pre-fast reminder (12h before), fast start, mid-fast encouragement, fast complete. | P0 |
| F10 | **Safety gates** | Hard exclusions for pregnancy, eating disorder history, diabetes (without physician sign-off), under 18. Blocking modal during onboarding. | P0 |
| F11 | **Apple Health CSV import** | Manual weekly import to capture HRV, sleep, RHR for the post-fast correlation view. | P1 |
| F12 | **Personal trends view** | 7/30 day chart of subjective scores + (if imported) HRV/sleep. "Your focus on Soma days vs. non-Soma days." | P1 |
| F13 | **Founder weekly video** | Embedded 3–5 min video published every Sunday from the Nepali founder. | P1 |
| F14 | **Beta cohort fast** | Opt-in shared fast on the next Ekadashi. Shows "247 people are fasting with you." | P1 |
| F15 | **Account, auth, data export** | Email magic link, GDPR-compliant data export & delete. | P0 |

### 5.2 MVP Explicitly Out of Scope

- Native iOS / Android apps.
- Live HealthKit / Whoop / Oura API integration (CSV only).
- Chandrayana graduated mode.
- Paid subscription / billing.
- Cohort chat / messaging.
- Custom meditation generation.
- AI-generated coaching.
- Multi-language (English only at launch).

### 5.3 MVP User Flows

**Flow 1 — First-run:**
1. Landing page → email signup → magic link.
2. Onboarding (4 screens, ~90s).
3. Safety gate modal (if any flag).
4. Today screen with first scheduled fast.

**Flow 2 — Fast day:**
1. Push/email notification 12h before.
2. Open app → Today screen → "Begin Fast."
3. Pre-fast logging (15s).
4. Timer view.
5. Optional paired meditation.
6. Fast complete → post-fast logging → trend update.

**Flow 3 — Skip / shift fast:**
1. Today screen → "Shift fast."
2. Pick ±1 day with explainer ("Tradition vs. life").
3. Confirm and reschedule.

### 5.4 MVP Acceptance Criteria

- A new user can complete onboarding and start their first fast in <3 minutes.
- 50 users can run a 30-day closed beta without manual intervention from the team.
- All P0 features work on iOS Safari and Chrome (mobile + desktop).
- Data export produces a JSON file accepted by basic stats tools.
- Safety gates block 100% of high-risk profiles in test cases.

---

## 6. Mobile App Scope (Months 4–9)

The mobile app is **not** a port of the web MVP — it adds the features that fundamentally need a native runtime, plus a more polished daily-use surface.

### 6.1 Platform Decision
- **iOS first** (matches persona — Optimized Skeptic and biohackers skew Apple).
- React Native or Expo to maximize reuse with the web codebase.
- Android shipped 2–3 months after iOS based on demand.

### 6.2 Mobile-Specific Features (in addition to all MVP features)

| # | Feature | Why mobile-only |
|---|---|---|
| M1 | **Native HealthKit integration** | Live read of HRV, sleep, RHR, steps, mindful minutes |
| M2 | **Whoop & Oura API integration** | OAuth flows; daily sync of recovery + sleep data |
| M3 | **Native push notifications** | Reliability and lock-screen presence |
| M4 | **Live activities / Dynamic Island** | Active fast countdown on lock screen |
| M5 | **Apple Watch complication** | Glanceable lunar phase + fast countdown |
| M6 | **Background sync** | HealthKit + Whoop/Oura pulled silently |
| M7 | **Improved meditation player** | Background audio, AirPlay, lock-screen controls |
| M8 | **Home screen widget** | Today's lunar phase + next Soma day |
| M9 | **In-app purchase / subscription** | Apple billing for Phase 2 paid tier |

### 6.3 Mobile Acceptance Criteria
- Feature parity with web MVP plus M1, M3, M4, M9 at launch.
- HealthKit import latency <2s.
- Cold-start to Today screen <1.5s on iPhone 13+.
- App Store privacy nutrition labels match actual data collected.

---

## 7. Phased Roadmap

The roadmap is gated against the 5 validation gates from `business_analysis.md` §12. **No phase begins until the prior gate passes.**

### Phase 0 — Validation (Month 0–3) → Gate 1
**Goal:** Prove demand exists before writing production code.

- Landing page + waitlist (no app).
- Founder content engine: 4 long-form essays, 1 weekly newsletter.
- 10–20 customer interviews.
- 3 podcast outreach attempts.
- **Build:** waitlist site only.
- **Exit criterion:** 500+ waitlist signups, 10 interviews complete.

### Phase 1 — Closed Beta (Month 3–6) → Gate 2
**Goal:** Ship Web MVP (§5) to 50–200 invited beta users. Measure adherence (LCAR ≥40%).

- All P0 features in §5.1.
- Manual onboarding calls for first 20 users.
- Weekly cohort calls with founder.
- Adherence dashboard for the team.
- **Exit criterion:** LCAR ≥40%, D30 retention ≥45%, ≥3 testimonials.

### Phase 2 — Public Launch + Subscription (Month 6–12) → Gate 4
**Goal:** Open beta, ship iOS app, introduce paid tier.

- iOS app launch (§6.2 features M1, M3, M4, M9).
- Subscription tier ($12/mo or $99/yr).
  - **Free:** 4 fasts/cycle, basic meditation (6 sessions), trends, founder video.
  - **Paid:** unlimited fasts, full meditation library (30+ sessions), Chandrayana mode (gated), cohort fasts, advanced analytics, research-grade export.
- Public marketing site, App Store listing.
- 3+ podcast placements live.
- **Exit criterion:** $5–10k MRR, 6%+ free→paid conversion.

### Phase 3 — Data Licensing & Research (Month 12–24) → Gate 5
**Goal:** Open the data-licensing line that is the actual business.

- IRB-equivalent consent flow (built day one, activated here).
- Anonymized dataset pipeline.
- Researcher-facing portal (separate web property).
- 1–3 academic partnerships signed.
- Whoop / Oura integration (M2).
- Android app launch.
- Cohort fasts feature matured (real-time presence, cohort chat).
- **Exit criterion:** 1+ academic partnership signed, first co-authored study scoped.

### Phase 4 — Teacher-Led Programs (Month 18+)
**Goal:** Add the high-margin course/cohort revenue line.

- 4-week guided cohort programs ($200–500).
- Teacher recruitment (2–3 Nepali teachers in addition to founder).
- In-app cohort program enrollment + payment.
- Founder/teacher production studio (recording quality).

### Phase 5 — Physical & B2B (Month 24+)
**Goal:** Diversify revenue and cement brand.

- Lunar-phase electrolyte / tea line (DTC).
- Ritual kit (physical product).
- B2B protocol licensing to retreats, longevity clinics, corporate wellness.
- API for partner apps.

---

## 8. Technical Architecture (high level)

### 8.1 Web MVP stack
- **Frontend:** Next.js App Router, TypeScript, Tailwind, shadcn/ui.
- **Backend:** Next.js Route Handlers (Node runtime) on Vercel.
- **DB:** Postgres (Neon via Vercel Marketplace).
- **Auth:** Email magic link (Clerk or Auth.js).
- **Notifications:** Web Push API + transactional email (Resend).
- **Analytics:** Self-hosted PostHog (privacy-respecting).
- **Astronomy:** `astronomy-engine` npm package for phase calculations.

### 8.2 Mobile stack
- **Framework:** React Native via Expo (maximizes web reuse).
- **HealthKit / wearables:** Native modules.
- **Push:** APNs / FCM.
- **Shared:** API routes from web; same Postgres.

### 8.3 Data architecture (critical for Phase 3)
- All user events stored in append-only event log from day one.
- Consent state versioned and stored alongside user record.
- Anonymization pipeline scoped now, activated in Phase 3.
- IRB-equivalent consent strings versioned and presented at signup.
- Data residency: US-region by default (Phase 3 research market).

---

## 9. Design Principles

1. **Radical simplicity over Sanskrit literacy** (`context.md` §5.1) — the user never needs to know "tithi" to use Soma.
2. **Two-layer information design** — surface is always plain English; depth ("Why this day?") is one tap away.
3. **Lunar-phase visual anchor** — every screen carries the current moon phase as ambient context.
4. **Quiet, not gamified** — no streaks-shame, no badges, no cartoon mascots. Tone: clinical-meets-temple.
5. **Accessibility** — WCAG 2.1 AA from day one. Contrast, screen reader, dynamic type.
6. **Opt-in everything** — no notifications, no data, no features without explicit consent.

---

## 10. Risks & Mitigations (PRD-level)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Beta adherence <40% | Medium | High | Hard gate at Month 6; do not ship paid tier until adherence proven |
| Founder content cadence collapses | Medium | High | Pre-record 8 weeks of founder videos before launch |
| Apple App Store rejection (health claims) | Medium | Medium | Wellness-only language; legal review of all marketing copy |
| HealthKit integration delays mobile | Medium | Medium | Web MVP doesn't depend on HealthKit; mobile can ship without Whoop/Oura |
| Chandrayana safety incident | Low | Critical | Gate behind paid tier + medical attestation; remove from MVP entirely |
| Data licensing path doesn't materialize | Medium | High | Subscription must be self-sustaining without licensing revenue |
| Mindy Pelz launches competing app | Medium | High | Lead with mental performance + male-inclusive framing she does not own |

---

## 11. Open Questions (must resolve before Phase 1 build)

From `context.md` §8 and `business_analysis.md` §15, plus PRD-specific:

1. **Face of Soma:** founder, Nepali teacher, or hybrid? *Affects F13 production plan.*
2. **Gender framing:** mental-performance-neutral or female-led first? *Affects onboarding copy.*
3. **Phase 1 NSM commitment:** is LCAR the right north star, or should it be focus delta? *Affects analytics build.*
4. **Wearable priority:** Apple Health only at MVP, or push for Whoop/Oura earlier? *Affects mobile timeline.*
5. **Chandrayana mode:** ship in Phase 2 paid, or remove entirely? *Liability question.*
6. **Legal wrapper for dataset:** for-profit, nonprofit, data trust? *Must be decided before Phase 1 — consent strings depend on it.*
7. **Religious-fasting audiences:** complementary or distraction? *Affects positioning copy.*
8. **Pricing test:** $12/mo vs $15/mo vs $9/mo annual-only? *A/B in Phase 2.*
9. **Free tier generosity:** how many fasts before paywall? *Affects conversion math.*
10. **Cohort fast scale:** real-time presence or async? *Affects infra.*

---

## 12. Appendices

### A. Feature Prioritization Method
- **P0:** must ship in MVP. Removing breaks the core loop.
- **P1:** ships in MVP if engineering capacity allows; otherwise Phase 2.
- **P2:** Phase 2 or later.

### B. Out-of-scope (forever, unless explicitly revisited)
- Weight-loss tracking and BMI metrics.
- Astrology readings.
- Social feed / public profiles.
- AI chatbot coach.
- NFTs / tokens / web3.

### C. Glossary
- **LCAR:** Lunar-Cycle Adherence Rate.
- **Ekadashi:** 11th lunar day, traditional fasting day.
- **Chandrayana Vrat:** graduated lunar fasting protocol (15→1 mouthfuls).
- **Antahkarana:** the four-fold inner instrument (mind, intellect, ego, consciousness).
- **Soma Day:** any user-facing fast day in the app, regardless of source tradition.

### D. Linked documents
- `context.md` — product context and origin.
- `business_analysis.md` — market and feasibility analysis.
- *(future)* `technical_design.md` — architecture and data model.
- *(future)* `consent_and_privacy.md` — IRB-grade consent flow spec.
