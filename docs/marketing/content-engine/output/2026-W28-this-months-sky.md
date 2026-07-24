# Cycle Drop — 2026-W28 · This Month's Sky (Ekadashi)

**Series:** `this-months-sky` · **Pillar:** P4 · **Archetype:** card-native (no hub) · **Cycle:** 2026-W28
**Trigger:** next Ekadashi within horizon · **Fast:** **Ekadashi — Saturday 25 July 2026** (Shukla paksha, tithi 11)
**Card:** [`graphics/out/2026-W28-this-months-sky/slide-01.png`](../graphics/out/2026-W28-this-months-sky/slide-01.png)

> Dates computed from `astronomy-engine` via [`graphics/compute-next-fasts.mjs`](../graphics/compute-next-fasts.mjs) (Sun–Moon elongation, sunrise rule, IST). The traditional name for this Shukla Ekadashi (Shravana → *Pavitra / Putrada Ekadashi*) is what the **app reveals** — the card stays on "Ekadashi + date" so nothing public is asserted that the app doesn't confirm.

---

## 00 · Sense (trigger)

Lunar calendar fired: Ekadashi in horizon. Upcoming fasts this cycle window (IST):

| Fast | Date | Paksha |
|---|---|---|
| Pradosh | Sun 12 Jul | Krishna |
| Amavasya | Tue 14 Jul | Krishna |
| **Ekadashi** | **Sat 25 Jul** | **Shukla** ← this drop |
| Purnima | Wed 29 Jul | Shukla |

**Post timing:** the evening *before* — **Fri 24 Jul, ~19:00 local** — so followers can prepare.
**UTM base:** `?utm_medium=spoke&utm_campaign=this-months-sky&utm_content=2026-W28`

---

## The card (one artifact → three surfaces)

Rendered from [`briefs/2026-W28-this-months-sky.json`](../graphics/briefs/2026-W28-this-months-sky.json). Waxing-gibbous moon (matches tithi 11), एकादशी in gold, date + paksha, "Tonight's tithi → link in bio".

### Spoke A · Instagram Story
**primary_engagement_signal:** Share (send to family/friends who keep the fast).
- Post the card as a Story with a "Reminder" sticker set to Sat 25 Jul.
- Add a poll sticker: **"Keeping Ekadashi this week?"  🌙 Yes / Not this one**.
- Sticker link (if available) or "link in bio" → app URL with UTM.

### Spoke B · Instagram Reel + TikTok (~12s)
**primary_engagement_signal:** Share.
| Beat | Time | On-screen | VO |
|---|---|---|---|
| Hook | 0–2s | "Ekadashi is this Saturday." | "Ekadashi is this Saturday." |
| Body | 2–8s | 25 July · kept without grains | "The 11th lunar day — traditionally kept without grains." |
| Close | 8–12s | "Soma tells you when. Link in bio." | "Soma tracks the tithi for you." |
- Visual: the card animating in over a slow moon zoom (`assets/moon.jpg`). Ambient audio.
- Caption: *Ekadashi this Saturday, 25 July. 🌘 Send this to whoever keeps the fast with you. Tonight's tithi is in the app (link in bio).*

### Spoke C · X single
**primary_engagement_signal:** Comment.
> 🌘 Ekadashi is this Saturday — 25 July (Shukla paksha).
> The 11th lunar day, traditionally kept without grains.
>
> The date moves every month; Soma computes tonight's tithi for you.
>
> Do you keep Ekadashi — grains-free, or fruit-and-milk? 👇
>
> (link in bio / first reply)

Link in **first reply**, not the tweet body:
`https://somaa.vercel.app/app/?utm_source=x&utm_medium=spoke&utm_campaign=this-months-sky&utm_content=2026-W28`

---

## 07 · Publish sequence

| Order | When | Asset | Surface |
|---|---|---|---|
| 1 | Fri 24 Jul 19:00 | Card | Instagram Story (poll + reminder) |
| 2 | Fri 24 Jul 19:05 | Bio link → app URL, W28 `this-months-sky` UTM | Instagram bio |
| 3 | Fri 24 Jul 19:10 | Reel | Instagram → TikTok |
| 4 | Fri 24 Jul 19:15 | X single (+ link in first reply) | X |
| 5 | Sat 25 Jul 07:00 | Re-share Story: "Today. 🌘 Open Soma for tonight's tithi." | Instagram Story |

## KPI baseline (T+24h)

| Metric | Target | Actual |
|---|---|---|
| App opens (PostHog, W28 UTM) | 25 | _log_ |
| Story poll responses | 30 | _log_ |
| Reel sends/shares | 20 | _log_ |
| X replies | 8 | _log_ |

## Editor gate

☑ Posted before the fast (not after) ☑ exact fast + date named ☑ moon phase matches tithi ☑ CTA opens app to tonight's tithi ☑ no guilt/streak framing ☑ Sanskrit glossed ☑ traditional name deferred to app (nothing unverified asserted) ☑ banlist clean.
