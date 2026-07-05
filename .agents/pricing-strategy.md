# Soma — Pricing Strategy

*Date: 2026-04-13*
*Status: Pre-launch pricing design; validates and sharpens the $12/mo / $99/yr proposal in `marketing_strategy.md`*
*Sources: `product-marketing-context.md`, `customer-research.md`, `launch-strategy.md`*

---

## 0. TL;DR

The existing proposal ($12/mo or $99/yr, free tier permanent) is **directionally right but structurally under-engineered**. Three corrections:

1. **Ship three tiers, not two.** A single premium tier leaves the top of the Optimized Skeptic audience (the highest-willingness-to-pay segment) unmonetized. Add a "Soma Pro" or "Soma Research" tier at $19/mo / $179/yr that includes advanced analytics, Chandrayana Mode, research-grade export, and 1:1 founder office hours during beta.
2. **Change the value metric from time (monthly access) to *lunar cycles completed*.** This is a subtle but powerful move: the natural unit of the product is the lunar month, not the calendar month. Pricing in cycles (13 cycles/year) creates a semantic moat, reframes the annual plan as "a full year of the moon", and gives Soma a ritual-coded price anchor no IF app has.
3. **Launch a founding-member annual-only offer for the first 500 paying users:** $79/year locked forever, capped at 500. Creates cohort loyalty, front-loads cash, and generates a referral dynamic. Hard scarcity, real.

Net result: three tiers, lunar-cycle framing, and a founder-cohort price — together they generate higher ARPU, tighter positioning, and a narrative that compounds.

---

## 1. Business context (pulled from existing docs)

| Dimension | Value |
|---|---|
| Product type | Consumer mobile app (iOS-first), freemium SaaS subscription |
| Current pricing | None — pre-launch |
| Proposed pricing | $12/mo or $99/yr, permanent free tier |
| Target market | P1 Optimized Skeptic (primary), P2 Lunar-Curious Native, P3 Diaspora |
| GTM motion | Self-serve, founder-led credibility, no sales team |
| Current ARPU | N/A |
| Current churn | N/A |
| Conversion benchmarks to hit | 8–12% free → paid; 70% week-4 beta retention |

---

## 2. Value-based pricing analysis

### 2.1 Ceiling — customer's perceived value

What does P1 Optimized Skeptic pay for adjacent products?

| Product | Price | What it delivers |
|---|---|---|
| Whoop | $239/yr | Continuous biometric tracking |
| Oura Ring | $5.99/mo ($70/yr) + $300 hardware | Sleep/HRV/temperature tracking |
| Calm | $69.99/yr | Meditation library |
| Headspace | $69.99/yr | Meditation library |
| Zero / Fastic Premium | $69.99–$89.99/yr | Fasting tracking + content |
| MasterClass | $120–$240/yr | Premium content |
| Mindy Pelz's Reset Academy | $27/mo = $324/yr | Community + content + protocols |
| Peter Attia "The Drive" Premium | $120/yr | Premium podcast access |
| 8Sleep Pod membership | $204/yr | Smart mattress subscription |
| Function Health | $499/yr | Quarterly bloodwork + analysis |

**Median wellness subscription in this category: $70–$120/year.**
**Upper band (Optimized Skeptic will pay): $200–$500/year.**

The Soma value stack is:
- A lunar protocol (no direct substitute at this price point)
- A meditation library (Calm-class value)
- A fasting tracker (Zero-class value)
- HRV/glucose/cognition measurement (Whoop/Oura adjacency)
- Community (Reset Academy adjacency)
- Founder authority / lineage (unique, unpriced elsewhere)

**Perceived value ceiling for P1: $200–$300/year.** Soma is currently pricing at $99/yr, which leaves $100–$200/year of willingness-to-pay on the table for the top 20% of users.

### 2.2 Floor — next best alternative

- **Do nothing.** Free. The most common outcome.
- **Zero Premium.** $69/yr. No meaning, no tradition, no meditation.
- **Free Calm + free moon calendar + notes app.** $0. The DIY stack.
- **Mindy Pelz's Reset Academy.** $324/yr. Higher price; weaker credibility for P1.

**Floor is $0 (DIY), but the floor for the *differentiated* position is Zero Premium at $69/yr.** Soma must price above Zero — anywhere below signals it's "just another fasting tracker".

### 2.3 The pricing zone

Between $70 (floor) and $300 (ceiling) is the defensible zone. Current $99/yr is at the *bottom* of that zone. The correct anchor is in the middle ($140–$180/yr), with a premium tier at the top ($180–$240/yr).

---

## 3. Value metric — change from time to lunar cycles

### The subtle move

Every IF app and every meditation app prices in calendar time (monthly/yearly subscription). Soma's product-category-defining move is to price in **lunar cycles completed**. The shift is small in dollars but large in meaning.

- A lunar month is ~29.5 days. There are ~12.4 full cycles per year.
- The annual plan becomes: *"13 lunar cycles — a full year of the moon"*.
- The monthly plan becomes: *"per cycle"* — no user actually thinks in 30-day windows.

Practical implementation:
- **Display on pricing page:** "$15 per cycle or $179 per year (13 cycles)".
- **In-app streak/progress:** "You've completed 4 lunar cycles with Soma" — not "you've been a member for 118 days".
- **Billing cadence:** still monthly/annual for Stripe simplicity. The lunar framing is user-facing, the billing is calendar-facing. No plumbing change.

This is a *positioning and psychology* move, not a billing engineering move. It costs nothing and creates a brand asset.

### Why it works
- **Alignment.** The unit of the product (a Soma Day, a cohort fast, a Lunar Chronotype) is lunar. The price unit should match.
- **Semantic moat.** No competitor can copy this without looking derivative.
- **Loss aversion.** "Don't miss your next cycle" is a stronger retention message than "your subscription renews on the 15th".
- **Story fit.** The whole brand is *ancient rhythm, modern mind*. A time-based price is Western; a cycle-based price is native to the brand.

---

## 4. Tier structure — Good / Better / Best

Replaces the two-tier plan in the strategy doc. The middle tier (Better) is the anchor and the target for 80% of paying users.

### Tier 1 — **Soma** *(Good, Free, permanent)*

The free tier is non-negotiable because **free users are the dataset** (per `context.md` §5.2). Keeping free users engaged is the real product moat. The free tier must be *genuinely useful*, not crippled.

**Includes:**
- The lunar calendar and Soma Day notifications (the core protocol).
- Basic fasting timer with sunset/sunrise anchors.
- 3 guided meditations (rotating monthly).
- Apple Health sync.
- Basic adherence log (fasts completed, cycles completed).
- Monthly cohort fast participation (the community ritual).
- Access to the Substack.

**Excludes:**
- Full meditation library.
- Chandrayana Mode.
- HRV / glucose correlation analytics.
- Lunar Chronotype report.
- Whoop / Oura integration.
- Research-grade export.

**Goal:** Retention, data capture, word-of-mouth. Not revenue.

### Tier 2 — **Soma Plus** *(Better, Recommended — the anchor)*

**Price:** $15 per cycle or **$149/year** (paid annually = ~11 cycles for the price of 13, framed as "2 cycles free").

**Includes everything in Soma Free, plus:**
- Full guided meditation library (~40 sessions, meditation shortens on fast days and deepens on feed days).
- Lunar Chronotype personalized report (generated after the 7-day onboarding baseline).
- HRV / glucose correlation analytics (from Apple Health / Whoop / Oura).
- Whoop and Oura integration.
- Flex rule engine (shift fast ±1 day with trade-off explainer).
- Priority in cohort fast events and monthly founder Q&A recording.
- "Why this day?" deep-dive content for every Soma Day (the second-layer tradition content).

**Target audience:** ~80% of paying users. P1 Optimized Skeptic and P2 Lunar-Curious Native both land here.

**Goal:** Anchor the pricing page. This is the price that shows up in press coverage.

### Tier 3 — **Soma Research** *(Best, Premium)*

**Price:** $25 per cycle or **$239/year**.

**Includes everything in Soma Plus, plus:**
- **Chandrayana Mode** — the graduated 15→1 protocol, behind a safety gate. This is the single most unique feature Soma has and belongs in the top tier.
- **Research-grade data export** — clean CSV/JSON export of the user's own fast, HRV, and adherence data in a format labs accept. For the user's own research, coaching sessions, or sharing with a functional doctor.
- **1:1 founder office hours** (beta only — 30-min quarterly call with the founder during the first year). This is a deliberately unscalable feature that forces limited capacity and creates cohort loyalty.
- **Early access to new features** (experimental protocols, Lunar Chronotype v2, etc.).
- **Custom protocol coaching** — AI-assisted custom fast design, reviewed against safety rules.
- **Name in the research dataset credits** (for users who opt-in to having their anonymized data cited in publications).

**Target audience:** ~15% of paying users — the top end of P1 Optimized Skeptics, the biohacker core, and the diaspora practitioners who want depth.

**Goal:** ARPU lift. Captures the willingness-to-pay that $99/yr leaves on the table. Also creates the "if you want to go all the way" halo that makes the middle tier feel reasonable.

### Tier comparison

| Feature | Free | Plus ($149/yr) | Research ($239/yr) |
|---|---|---|---|
| Lunar calendar + Soma Days | ✅ | ✅ | ✅ |
| Basic fast timer | ✅ | ✅ | ✅ |
| 3 meditations | ✅ | ✅ | ✅ |
| Apple Health sync | ✅ | ✅ | ✅ |
| Cohort fasts (participate) | ✅ | ✅ | ✅ |
| Full meditation library | — | ✅ | ✅ |
| Lunar Chronotype report | — | ✅ | ✅ |
| HRV / glucose analytics | — | ✅ | ✅ |
| Whoop / Oura integration | — | ✅ | ✅ |
| Flex rule engine | — | ✅ | ✅ |
| "Why this day?" content | — | ✅ | ✅ |
| Chandrayana Mode | — | — | ✅ |
| Research-grade export | — | — | ✅ |
| Founder office hours | — | — | ✅ |
| Early access features | — | — | ✅ |
| Dataset credit | — | — | ✅ |

### Decoy logic

The Research tier (23% more expensive than Plus) is deliberately priced to make Plus feel like the obvious choice. The effect Haines recommends: the top tier exists partly to sell the middle tier.

---

## 5. Founding Member offer — the Wave-1 monetization lever

Most of Wave 1 is free (closed beta). But the first 500 users who convert to paid at any point in the first 6 months should get a **Founding Member** lock.

**Offer:**
- $79/year forever (locked).
- Annual only — no monthly option for Founding Members.
- Capped at **500 seats.**
- Includes everything in Soma Plus *plus* Chandrayana Mode (not the full Research tier).
- Name listed in the "Founding 500" page on the website.
- Lifetime invite to the monthly founder call.

**Why this works:**
- **Hard scarcity.** 500 is a real cap, not a marketing trick. The scarcity signal is honest and compounds the brand's trust story.
- **Cash forward.** Annual-only billing gets $39,500 in one period at cap ($79 × 500). In a pre-revenue company, that funds 6 months of tooling and the scientific advisor retainer.
- **Cohort identity.** Founding Members become the first community — the people who show up to cohort fasts, share with friends, write early reviews.
- **Narrative asset.** "Founding 500" becomes a permanent press kit phrase. Every podcast interview can cite "the first 500 people who paid for Soma".
- **Low risk if demand is soft.** If we can't fill 500 in 6 months, the offer quietly ages out. No downside.

**Launch timing:** Founding Member offer opens on **Phase 4 Launch Day** and closes either when 500 seats are taken OR at the 6-month mark, whichever comes first.

---

## 6. Van Westendorp questions for Wave-1 interviews

The Wave-1 interview protocol in `customer-research.md` §4 can answer willingness-to-pay with 4 additional questions at the end of Section D. Add these:

1. *"At what monthly or yearly price for a product like this would it feel **so expensive** you wouldn't consider it?"* (Too expensive)
2. *"At what price would it feel **so cheap** that you'd start to question whether it's serious?"* (Too cheap)
3. *"At what price would it feel **expensive but you'd consider it** because of the value?"* (Expensive but acceptable)
4. *"At what price would it feel like a **bargain**?"* (Bargain)

Plot the four distributions from 20 respondents and find:
- **OPP (Optimal Price Point):** intersection of "too cheap" and "too expensive".
- **IPP (Indifference Price Point):** intersection of "bargain" and "expensive".
- **Point of Marginal Cheapness:** below this, users suspect quality.
- **Point of Marginal Expensiveness:** above this, users churn at the pricing page.

If Van Westendorp puts OPP at $120–$180/year, the **Plus tier at $149/year is validated**. If OPP comes in below $100, the Plus tier drops to $119 and Research to $199. **Do not set final prices until Van Westendorp runs.**

---

## 7. Annual discount framing

The annual discount is currently implied ($12/mo × 12 = $144 → $99 saves $45 ≈ 31% discount). The corrected framing:

| Plan | Monthly | Annual | Framing |
|---|---|---|---|
| Plus | $15 / cycle | $149 / year | *"~2 cycles free"* or *"save $31 a year"* |
| Research | $25 / cycle | $239 / year | *"~2 cycles free"* or *"save $61 a year"* |
| Founding Member | — | $79 / year forever | *"locked for life"* |

**Display discipline:**
- Annual billing is the default selection on the pricing page (pre-checked toggle).
- The monthly price is shown for psychological anchoring but the annual price is the headline.
- No "per month billed annually" trickery — show the annual price honestly ($149/year, not "just $12.42/month!"). That trickery reads as untrustworthy to P1 Optimized Skeptic.

---

## 8. Free → paid conversion mechanics

Target: **8–12% free → paid** conversion by month 9.

### Activation path (free user → Plus)
1. User signs up, completes 7-day Lunar Chronotype baseline (free).
2. On day 8, user sees their personal Lunar Chronotype report — a hard paywall on the *full* report, with a 1-line preview showing the hook ("Your chronotype is [X]. Users with your chronotype report [Y]% better focus on Soma Days.")
3. Upsell to Plus tier with 7-day Plus trial.
4. During trial, user completes one full Soma Day with flex-rule engine + full meditation library.
5. Trial ends; user converts or downgrades to free.

### Activation path (Plus user → Research)
1. Plus user completes 3 lunar cycles.
2. In-app prompt: *"You've completed 3 cycles. Ready for Chandrayana Mode? It's a graduated 15→1 protocol from Vedic tradition — the original lunar protocol. Available in Soma Research."*
3. Offer a 1-month Research trial (no card change required for existing Plus users).
4. 15–20% of Plus users should convert to Research over 12 months. Conservative.

### Churn prevention (paid → free, not paid → churn)
- **Never fully cancel.** When a user cancels, automatically downgrade to Free and preserve all their data. No dark-pattern retention flow.
- **Pause option.** Users can pause for up to 3 lunar cycles without losing streak or data. This is *exactly* the flex the P1 audience wants and exactly what every other wellness app refuses to give them.
- **Re-activation trigger.** On the next lunar event after cancellation, send a plain email: *"Tomorrow is the new moon. Here's a free meditation."* No pitch. Just presence.

These are detailed in the `churn-prevention` skill but flagged here so pricing and retention are designed together.

---

## 9. Pricing page checklist

### Above the fold
- [ ] Three tiers side by side, Plus visually highlighted as "Recommended"
- [ ] Annual/monthly toggle (annual default, "save 2 cycles" callout)
- [ ] Price in lunar-cycle framing: "$149/year (13 lunar cycles)"
- [ ] Primary CTA: "Start free" (not "start trial" — we have a permanent free tier)
- [ ] One trust signal: the science advisor's credential, or "Founding 500 member count remaining"

### Feature table
- [ ] Same 15-row feature comparison as §4 above
- [ ] Checkmarks, not em-dashes, for visual clarity
- [ ] Feature names link to explainer modals where needed (e.g., Chandrayana Mode)

### Below the fold
- [ ] Who each tier is for (1-liner per tier)
- [ ] FAQ (5 questions: safety, cancellation, refund, data export, religious fasting overlap)
- [ ] Testimonials from Wave-1 customer interviews (post-launch; placeholder for Phase 1)
- [ ] The Safety & Claims line (link to full page per `marketing_strategy.md` §9)
- [ ] Scientific advisor quote (if secured)
- [ ] "Founding 500" countdown (if still open)

### Pricing psychology
- [ ] Anchor: Research tier shown first (leftmost position is a variant worth A/B testing post-Phase 4)
- [ ] Decoy: Research is 60% more than Plus — enough to make Plus feel obvious
- [ ] Charm: $149 and $239 (not $150 and $240) — charm pricing works for this audience
- [ ] No strikethrough prices for fake discounts. Honest math only.

---

## 10. Price increases — when to raise

Soma should plan to raise prices once in year 2, based on these signals:

### Signals to watch
- Plus tier conversion > 12% → price is too low; raise.
- "Are you sure $149 is enough?" feedback from advisor or power users → raise.
- First data report published → raise. (The data report is a permanent value-add that justifies a price increase.)
- Research licensing deal signed → raise. (External validation of the dataset's value reflects on the product's value.)

### Strategy
- **Grandfather existing users** — the first 5,000 paying users never see a price increase. This is expensive in the short term but produces the "I've been a member since the beginning" loyalty that underpins the Founding Member narrative.
- **New users see the new price** starting the day after the announcement.
- **Announce the price change 30 days in advance** via Substack and email, framed around what changed in the product (e.g., "we shipped Chandrayana Mode v2" or "we published our first peer-reviewed paper").

### First planned increase
- **Trigger:** first data report published (~month 6 per launch plan).
- **Target:** Plus $149 → $179, Research $239 → $279.
- **Grandfather window:** all existing paid users locked at old price forever.
- **Narrative:** "We now have a published dataset. The product is worth more. Here's what's new."

---

## 11. Pricing for cohort-based course (Phase 4 / month 18+)

Not for launch, but worth locking now so the narrative is consistent.

The cohort-based course (from `context.md` Phase 4 monetization) should be priced at **$299 for a 4-week cohort**, founder-led, 50-person cap per cohort, 4 cohorts per year.

- **Per cohort revenue:** $14,950.
- **Annual revenue:** ~$60,000 from courses alone.
- **Strategic role:** brand-building, not primary revenue. Existence of the course elevates the perceived value of the app.
- **Positioning:** *"The app is the protocol. The course is where the founder teaches the tradition."*

Include a Plus subscription in the course price to push course takers into the subscription.

---

## 12. What this changes in the existing plan

Specific edits to make in the other docs after this one is approved:

1. **`marketing_strategy.md` §7 Monetization Strategy (Phase 2)**: replace "$12–15/mo or ~$99/yr. Premium unlocks..." with the three-tier structure from §4 of this doc.
2. **`marketing_strategy.md` §14 Year-1 Budget**: add a line for "Founding Member revenue (forward-booked): ~$39,500" as an offset, if the 500 seats fill.
3. **`product-marketing-context.md` §1 Product Overview — Business Model**: update to reflect three tiers and the Founding Member offer.
4. **`launch-strategy.md` Phase 4 Launch Day Checklist**: add "Founding Member offer live" and "Pricing page with three tiers live" to the checklist.
5. **`customer-research.md` §4.3 Interview Protocol**: add the 4 Van Westendorp questions to the end of Section D.

---

## 13. Open questions

1. **Does Chandrayana Mode belong in Plus or Research?** Current recommendation: Research. Alternative: put it in Plus as the primary upgrade lever and make Research about analytics + office hours. The Chandrayana safety story may actually benefit from *more* users seeing it gated — think harder on this.
2. **Is the Founding Member cap 500 or 1,000?** 500 is tighter and more credible; 1,000 is more revenue. Ask Wave-1 interviewees how many seats feel scarce without feeling manufactured.
3. **Should we launch with a 30-day refund guarantee?** Standard for B2C wellness. Probably yes. Adds conversion; minimal churn cost because the Lunar Chronotype baseline creates a sunk-time commitment that reduces refund likelihood.
4. **Lifetime deal (one-time $299)?** A Haines-style tactic and tempting for a small launch. Recommendation: **no.** Lifetime deals poison the long-term pricing floor and attract users who don't match P1. Explicitly off the table.
5. **Student / healthcare-worker discount?** Not at launch. Revisit after month 9.

---

## 14. Hand-off

This doc feeds:
- **`copywriting`** — the pricing page copy and the Founding Member copy both need drafting next.
- **`customer-research.md`** — add the 4 Van Westendorp questions to the interview protocol before the first interview.
- **`launch-strategy.md`** — Phase 4 Launch Day checklist needs the three-tier pricing and Founding Member additions.
- **`marketing_strategy.md`** — §7 Monetization Strategy needs updating with the tier structure.

The single most important next action is **running the 4 Van Westendorp questions in the first 5 Wave-1 interviews.** If the data comes back consistent with §2 (ceiling ~$200–$300, floor ~$70), the tier structure is locked. If it comes back very different, we revisit before the pricing page goes live.

---

*End of pricing strategy. Next skill: `copywriting`.*
