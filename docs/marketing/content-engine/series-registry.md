# Series Registry — Soma

> The recurring slots. Ported from `yirifi-social-marketing/content-engine/series/`. Charter = the product spec for a series; a cycle instantiates it. Two full charters below; the rest are stubs to flesh out as they go live.

---

## Registry

| Series | Slug | Archetype | Pillar | Cadence | Status |
|---|---|---|---|---|---|
| Lunar Fasting 101 | `lunar-fasting-101` | blog-led | P1 | weekly | **running** |
| This Month's Sky | `this-months-sky` | card-native | P4 | date-triggered | running |
| Tradition & Meaning | `tradition-and-meaning` | card-native | P2 | weekly (alt) | drafted |
| Wellness & the Body | `wellness-and-the-body` | blog-led | P3 | weekly (alt) | drafted |
| Building in the Open | `building-in-the-open` | card-native | P5 | opportunistic | drafted |

---

## Charter — Lunar Fasting 101

```yaml
series: lunar-fasting-101
title: "Lunar Fasting 101"
archetype: blog-led
hub_type: blog
pillar: P1
cadence: weekly
slot: { primary_channel: instagram, primary_day: mon, primary_time: "08:00" }
personas_primary: [curious-newcomer]        # searching "what is Ekadashi", new to lunar fasting
personas_secondary: [returning-practitioner] # grew up with it, wants a modern tracker
sense: { mode: scheduled, source: [google-search, reddit], query: "Ekadashi / lunar fasting / tithi", rank_by: [search_volume, pillar_fit] }
fan_out:
  hub: [{ channel: blog, pipeline: blog-pipeline }]
  spokes:
    - { channel: instagram-carousel, derives_from: "hub.the-4-fasts + hub.how-to", signal: save }
    - { channel: instagram-reel,     derives_from: "hub.narrative",               signal: share }
    - { channel: x-thread,           derives_from: "hub.list + hub.tldr",         signal: save }
banlist_extras: [detox, cleanse, biohack, "burn fat"]
schema_types: [BlogPosting, FAQPage]
utm_campaign: lunar-fasting-101
kpi_primary: bio_link_clicks
kpi_target: 40
kpi_window_hours: 48
```

**Purpose.** Capture people already searching lunar-fasting terms (Ekadashi, tithi, the four fasts) and convert curiosity into an app open. This is the SEO + top-of-funnel backbone.

**What good looks like.** Plain-language; one clear takeaway per asset; every claim grounded in tradition, not invented; ends with the app as the *practical* payoff (it computes the date for you). Devanagari used with a gloss.

**What bad looks like.** Preachy or gate-keeping ("real Hindus fast like…"); medical/weight-loss claims; a wall of text on a carousel slide; Sanskrit with no translation.

**Cycle:** sense (search/Reddit pick) → blog hub (using `/blog` template) → atomize to carousel + Reel + X thread → publish → T+48h KPI.

---

## Charter — This Month's Sky

```yaml
series: this-months-sky
title: "This Month's Sky"
archetype: card-native
hub_type: none
pillar: P4
cadence: date-triggered   # fires off the real lunar calendar
slot: { primary_channel: instagram, primary_day: "day-before-each-fast", primary_time: "19:00" }
personas_primary: [returning-practitioner]
personas_secondary: [curious-newcomer]
sense:
  mode: triggered
  source: astronomy-engine   # the app already computes tithis (src)
  trigger: "fast within next 24h (Ekadashi | Pradosh | Purnima | Amavasya)"
  sla_hours: 24
  monthly_budget: 6
fan_out:
  # card-native: no hub; the card IS the artifact. Same card → 3 surfaces.
  hub: []
  spokes:
    - { channel: instagram-story,  derives_from: "the-card", signal: share }
    - { channel: instagram-reel,   derives_from: "the-card", signal: share }
    - { channel: x-single,         derives_from: "the-card", signal: comment }
banlist_extras: [detox, cleanse, "guilt", "cheat day"]
schema_types: []
utm_campaign: this-months-sky
kpi_primary: app_opens
kpi_target: 25
kpi_window_hours: 24
```

**Purpose.** Turn the lunar calendar into a reliable, zero-ideation posting heartbeat and a retention driver — remind people the night before a fast, and let the app carry them through it.

**What good looks like.** Posted ~18–24h before the fast; names the exact fast + date; one gentle line on how to keep it; the moon-phase visual matches the actual phase; CTA opens the app to tonight's tithi.

**What bad looks like.** Posted after the fast started (useless); guilt framing ("don't break your streak"); wrong phase art; generic "happy Ekadashi" with no utility.

**Cycle:** trigger fires (fast in <24h) → write card copy → render card (moon assets) → Story + Reel + tweet → T+24h app-opens KPI.

---

## Charter template (for the rest)

Copy the two above. Required fields: `series, title, archetype, pillar, cadence, slot, sense, fan_out (spokes + signal each), banlist_extras, utm_campaign, kpi_primary/target/window`. Then write Purpose / What-good / What-bad / Cycle.
