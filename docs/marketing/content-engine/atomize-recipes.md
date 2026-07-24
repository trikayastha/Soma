# Atomize Recipes — Soma

> Reshape one hub (a `/blog` post) into channel-native spokes. Ported from `yirifi-social-marketing/content-engine/pipelines/_atomize-shared/`, with LinkedIn/newsletter swapped for Instagram / TikTok / X / Email. Each spoke is built for **one primary engagement signal**.

---

## The engagement framework (read first)

A hook decides whether a post is *read*. This decides whether it's **saved, shared, or commented on** — the deep signals IG/TikTok/X weight far above likes. One piece of copy can't maximize all three, so **every spoke picks one primary signal** and builds the matching mechanic.

### Step 1 — derive the signal from the hub fragment

| Hub fragment the spoke pulls | Primary signal | Why |
|---|---|---|
| How-to / checklist / the-4-fasts list / calendar / "how to keep X" | **Save** | Reference material bookmarked for later — for the next fast |
| Tradition / myth / a beautiful moon visual / a resonant line / founder POV | **Share (Send/Repost)** | Something you send to family or reshare to say "this is me" |
| "Most people get X wrong" / a question about practice / a gentle provocation | **Comment** | A prompt answerable from the reader's own life |

One primary signal per spoke. Record it as `primary_engagement_signal`.

### Step 2 — apply the mechanic

- **Save** → lead with the reference value; close with an explicit save cue tied to a job: *"Save this for the next Ekadashi."* Carousels are save-native (the deck *is* the saved artifact).
- **Share** → plant one quotable, ≤120-char line on its own — identity-signaling, not a summary (*"Before there were apps, there was the sky."*). Add a send cue: *"Send this to whoever taught you to fast."*
- **Comment** → close on a **specific** prompt, not "thoughts?": *"Which fast do you keep — Ekadashi, or none yet? 👇"* Reply to every comment in the first 2 hours.

### Step 3 — link placement

- **Instagram / TikTok:** no clickable body links — the CTA is always **"link in bio"**, and the bio link carries the cycle UTM. Keep it to one ask.
- **X:** hub link on the **last tweet only**, with UTM.
- **Email:** one link, UTM'd.

---

## Recipe A — Instagram carousel (8–10 slides)

**Use when:** the hub yields ≥6 discrete takeaways (a list, the 4 fasts, a how-to). **Default signal: Save.**

**Asset budget:** cover + 6–8 body + CTA. Each slide = 1 headline (≤10 words) + ≤2 support lines (≤80 chars). Square 1080×1080 or 4:5 1080×1350.

| Slide | Purpose | Content |
|---|---|---|
| 1 Cover | Hook | Moon visual + a takeaway title (not a topic label) + सोम mark |
| 2 | Promise | "In 60 seconds: …" — 2–3 bullets |
| 3–N | Body | One idea per slide. Title = the takeaway; support = the evidence. Pair each with a moon-phase asset. |
| N+1 | Synthesis | The one line that ties it together |
| N+2 CTA | Action | Single CTA — "Soma tracks it for you · link in bio" + सोम mark |

**Reshape rules:** skim-first (understandable in 3s), one idea per slide, title leads, no inline sources.
**Visual system:** black bg (`#05060a`), gold accent (`#e2c98f`), Sen headings, Lora body, Tiro Devanagari for Sanskrit; use `assets/phases/*.webp` per fast, `assets/moon.jpg` on the cover.
**Intro caption:** hook line → 2–3 lines of context → save cue → hashtags. Keep <1,300 chars.

**Editor checklist:** ☐ 8–10 slides ☐ cover title is a takeaway ☐ one idea/slide ☐ support ≤80 chars ☐ CTA slide + सोम mark ☐ save cue in caption ☐ hashtags ≤12 ☐ banlist clean ☐ numbers match hub.

---

## Recipe B — Instagram Reel / TikTok (20–40s vertical)

**Use when:** the hub has a strong narrative or a rapid list. Same script serves both platforms (post to IG first, then TikTok). **Default signal: Share** (Reels/TikTok reach is share-and-rewatch driven).

**Structure:**
| Beat | Time | Content |
|---|---|---|
| Hook | 0–3s | On-screen text + VO: a scroll-stop line. No logo first. |
| Turn | 3–8s | The reframe / the promise |
| Body | 8–30s | 3–5 fast beats, each with one visual + one on-screen line |
| Close | 30–40s | The payoff line + "link in bio" |

**Rules:** hook in the first 2 seconds or it's dead; **on-screen captions always** (sound-off viewing); one idea per beat; trending or ambient audio (note the pick); loopable ending beats a hard stop. Vertical 1080×1920.
**Editor checklist:** ☐ hook ≤2s ☐ captions on every beat ☐ ≤40s ☐ one CTA (link in bio) ☐ share/send cue in caption ☐ audio noted ☐ banlist clean.

---

## Recipe C — X thread (5–8 tweets)

**Use when:** any hub. **Default signal: Save (bookmark)** for how-to threads; **Share (repost)** for a POV thread.

| Tweet | Role | Content |
|---|---|---|
| 1 | Hook | Punchline + promise. ≤270 chars. No URL, no @, no 🧵. |
| 2 | Setup | Why it matters / the key idea |
| 3 | Evidence | Strongest concrete beat — attach the image here |
| 4 | Mechanism | The "so what" underneath |
| 5 | Counter | The objection a reader has, answered (earns trust) |
| 6 | Implication | What it means for them |
| 7 | CTA + link | "Full guide →" + hub URL with UTM |

**Rules:** tweet 1 is everything; 200–270 chars each (under 150 = filler); one image (tweet 3/4); one link (last tweet); numbers match hub exactly.
**Editor checklist:** ☐ 5–8 tweets ☐ tweet 1 punchline ≤270, no link/@/🧵 ☐ image in body ☐ counter present (if ≥6) ☐ CTA+UTM last ☐ save/repost cue ☐ banlist clean.

---

## Recipe D — Email block (optional)

**Use when:** Soma runs a light note to the beta list. **Today the list is "one email at launch"**, so use this only for a launch or a genuine milestone — don't manufacture cadence.

**Structure:** subject (≤50 chars, curiosity) → one-line hook → 2–3 short paragraphs pulled from the hub → one CTA link (UTM'd) → sign-off from the founder.
**Signal:** N/A (email is reply/click, not feed). Keep it personal, one idea, one link.

---

## UTM (all channels)

```
?utm_source={instagram|tiktok|x|email}&utm_medium=spoke&utm_campaign={series-slug}&utm_content={cycle-yyyy-ww}
```

## Shared failure modes

- **Hook is the topic.** "The four Hindu fasts" → flat. Punchline: "Your grandparents didn't need a fasting app."
- **Slide = paragraph chopped.** No reshape for skim.
- **Generic comment ask.** "Thoughts?" gets none; a specific binary gets replies.
- **Body link on IG.** Doesn't click — waste the ask; use "link in bio".
- **Numbers drift from hub.** Credibility loss compounds.
- **Wellness clichés / medical claims.** See [`voice-and-banlist.md`](voice-and-banlist.md).
