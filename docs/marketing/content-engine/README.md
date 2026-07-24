# Soma Content Engine

> Adapted from the Yirifi content engine (`yirifi-social-marketing/content-engine`) — same hub-and-spoke model, right-sized for a solo, pre-launch B2C app. One pipeline, two archetypes, a shared atomize layer, a weekly slot grid, and per-cycle output.

**What carried over from Yirifi:** the 7-phase pipeline, hub→spoke atomize recipes, the engagement-signal framework (build each spoke for one of Save / Share / Comment), series charters, the weekly skeleton, voice+banlist gates, and the UTM convention.
**What changed for Soma:** channels are **Instagram · TikTok · X · Email** (not LinkedIn/newsletter B2B); the sensing layer is mostly the **lunar calendar itself** (dates are known in advance); scale is ~4 recurring series, not 40; no automated CMO — a human runs the weekly loop.

---

## 1. The shape

```
        Signals (lunar calendar + search/Reddit + festivals)
                          │
                   Weekly plan (pick 1 anchor + date-triggered P4)
                          │
             ┌────────────┴────────────┐
         blog-led                  card-native
      (hub = /blog post)        (no hub — the card is it)
             │                          │
        hub ships                  card ships
             │
        ┌────┴──────── atomize ───────────┐
        │  IG carousel                    │
        │  IG / TikTok Reel               │
        │  X thread                       │
        │  Email block (optional)         │
        └─────────────────────────────────┘
             │
     publish sequence → UTM tag → T+48h KPI
```

## 2. The two archetypes

| Archetype | Hub | When | Example series |
|---|---|---|---|
| **blog-led** | a `/blog` post | evergreen teaching topics | Lunar Fasting 101, Wellness & the Body |
| **card-native** | none — the post/Reel *is* the artifact | timely + reactive | This Month's Sky (date-triggered), Tradition & Meaning, Building in the Open |

A series is blog-led if the primary artifact is a long-form post that spokes derive from; card-native if the social post stands alone.

## 3. Pillars (the P1–P5 mix)

From [`../content-pillars.md`](../content-pillars.md). Every drop is tagged to one pillar; the weekly mix targets this ratio.

| Pillar | Theme | Archetype default | Target % |
|---|---|---|---|
| **P1** | Lunar Fasting 101 (searchable/SEO) | blog-led | 30% |
| **P2** | Tradition & Meaning (shareable) | card-native | 25% |
| **P3** | Wellness & the Body (bridge) | blog-led | 20% |
| **P4** | This Month's Sky (timely/recurring) | card-native | 20% |
| **P5** | Building in the Open (founder) | card-native | 5% |

## 4. Channels

| Channel | Primary format | Body links? | Notes |
|---|---|---|---|
| **Instagram** | carousel + Reel + Stories | No — **link in bio** only | Primary channel. Save-native for carousels. |
| **TikTok** | short vertical video | Bio link (10k+ or via profile) | Reels repost here; reach engine. |
| **X** | thread + single | Yes (last tweet) | Build-in-public + reach; bookmarkable. |
| **Email** | teaser block | Yes | Beta list is "one email at launch" today — use sparingly (see `atomize-recipes.md`). |

## 5. The 7 phases (canonical, adapted)

| # | Phase | blog-led | card-native |
|---|---|---|---|
| 00 | Sense | pick topic from search/lunar calendar | pick slot/date/trigger |
| 01 | Brief | slot brief from charter | slot brief from charter |
| 02 | Source | ≥1 grounded source (tradition/text) | skip |
| 03 | Draft | write the hub post | write the card copy |
| 03b | Visual | figures/OG | the card visual (moon assets) |
| 04 | Edit | voice + banlist gate | voice + banlist gate |
| 05 | Publish | post goes live, canonical URL | post goes live |
| 06 | Atomize | fan out to spokes | skip |

## 6. UTM convention

Every outbound link (bio link, X CTA, email) carries:

```
?utm_source={instagram|tiktok|x|email}&utm_medium=spoke&utm_campaign={series-slug}&utm_content={cycle-yyyy-ww}
```

- `{series-slug}` = charter file name (e.g. `lunar-fasting-101`)
- `{cycle-yyyy-ww}` = ISO week (e.g. `2026-W28`)
- For **Instagram**, the tagged URL lives on the **bio link** (swap it per active cycle), since IG body links don't click through. PostHog already runs on the site + app, so these UTMs land in the existing funnel.

## 7. Folder map

| Path | Contents |
|---|---|
| `README.md` | this file |
| [`atomize-recipes.md`](atomize-recipes.md) | per-channel reshape rules + the engagement-signal framework |
| [`weekly-skeleton.md`](weekly-skeleton.md) | the fixed slot grid + pillar-ratio target |
| [`series-registry.md`](series-registry.md) | the recurring series + two full charters |
| [`voice-and-banlist.md`](voice-and-banlist.md) | Soma voice DNA + banned words |
| [`graphics/`](graphics/) | deterministic brief→PNG renderer (`render.mjs`) + `compute-next-fasts.mjs` + briefs + rendered `out/` |
| `output/{yyyy-Www}-{slug}.md` | one file per cycle drop (hub link + all spokes + publish sequence + KPI) |

**Executed drops:** [`output/2026-W28-lunar-fasting-101.md`](output/2026-W28-lunar-fasting-101.md) (blog-led — 9-slide carousel rendered, X thread, Reel) · [`output/2026-W28-this-months-sky.md`](output/2026-W28-this-months-sky.md) (card-native — Ekadashi 25 Jul card rendered, Story/Reel/X).

## 8. The weekly loop (how a human runs it)

1. **Plan (Fri):** open `weekly-skeleton.md`, pick next week's blog anchor + any date-triggered P4 (check the lunar calendar for Ekadashi/Purnima/Amavasya/Pradosh).
2. **Produce:** write/ship the hub (blog post) using the `/blog` template; or write the card copy.
3. **Atomize:** run `atomize-recipes.md` to fan the hub into IG carousel + Reel + X thread. Record in `output/{cycle}.md`.
4. **Publish:** post hub first, then spokes per the sequence; set the IG bio link to the UTM'd URL.
5. **Pulse (T+48h):** log saves/shares/comments + bio-link clicks against the KPI baseline in the cycle file.

## 9. Lineage

Source of the model: `~/Documents/GitHub/Yirifi/yirifi-social-marketing/content-engine/` — see its `pipeline-overview.md`, `pipelines/_atomize-shared/`, and `pipelines/_atomize-shared/engagement-framework.md`. This is a scaled-down port; when Soma grows past a solo cadence, graduate toward the full Yirifi structure (signals subsystem, charters-per-slot, KPI reports).
