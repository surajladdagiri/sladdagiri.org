# sladdagiri.org

A React single-page app with a 3D layer, a private analytics stack, a JSON-driven application tracker, and a hidden two-person synchronized cinema. The static site runs on Vercel, the stateful pieces run on Cloudflare Workers, R2, D1, and Durable Objects. This creation of this site is **heavily** aided by AI.

**Live:** https://portfolio.sladdagiri.org

---

## Stack

| Layer | Choice |
|-------|--------|
| UI | React 19, React Router 7, Vite 8 |
| 3D | Three.js (r0.185), hand-written — no scene-graph helpers |
| Styling | A tiny design-token system (`src/theme.jsx` + CSS variables), no UI kit |
| Hosting (site) | Vercel (static SPA) |
| Backends | Cloudflare Workers (2), D1 (SQLite), R2 (object storage), Durable Objects |
| Auth | PBKDF2-SHA256 password hashing, HMAC-signed stateless tokens |

Everything runs on free tiers. The one load-bearing cost fact: **R2 egress under 10 GB is
free**, which is the reason streaming multi-gigabyte video to two people
costs nothing per view.

---

## Cool features

- **A scroll-morphing WebGL hero.** The home page renders a ~2.6k-point cloud
  that morphs sphere → cube → torus → DNA helix, with every point holding a
  stable identity so transitions flow instead of scramble. Three.js is loaded
  with a dynamic `import()`, so it lives in its own lazy chunk and never touches
  any other page's bundle.
- **A physically-based 3D iPhone.** `Phone3D` builds an iPhone from an extruded
  rounded-rect body, titanium rim, PBR glass, a `RoomEnvironment` reflection map,
  and a rear camera module. On the app pages it's driven by scroll: pinned via a
  sticky track, it does a full 360° turn and swaps the on-screen App Store
  screenshot while facing away.
- **Zero-dependency motion.** Scroll reveals and 3D tilt are done with
  `IntersectionObserver` and transforms (`Reveal`, `Tilt`) — no animation
  library — and everything respects `prefers-reduced-motion`.
- **Real SEO for an SPA.** Per-route `<title>`/description/canonical/OpenGraph
  and JSON-LD (`Person`, `WebSite`, `BreadcrumbList`) are applied on navigation
  (`src/seo.js`), backed by static `robots.txt`, `sitemap.xml`, and `llms.txt`.
  Production ships with source maps off and a 300 kB chunk budget.
- **A private analytics pipeline** with an edge visitor log and an admin
  dashboard (see below).
- **A hidden synchronized cinema** — the centerpiece (see below).

---

## Project structure

```
src/
  pages/              route components (public, and the private ones below)
  Hero3D.jsx          scroll/auto morphing point-cloud hero
  Phone3D.jsx         PBR 3D iPhone (PBR materials + env map + screen textures)
  PhoneShowcase.jsx   pinned, scroll-scrubbed screenshot carousel wrapper
  Ambient3D.jsx       reusable particle backdrop
  Reveal.jsx / Tilt.jsx   IntersectionObserver scroll-reveal + pointer tilt
  theme.jsx           design tokens + shared primitives (Btn, Card, Tag, …)
  seo.js              per-route meta + JSON-LD
  analytics.js        fire-and-forget page-view beacon
  lib/                theater client helpers (Gate, theater.js)
public/               static assets, robots.txt, sitemap.xml, llms.txt
workers/
  analytics/          visitor log + dashboard API + application-tracker API (D1)
  theater/            sync room (Durable Object) + R2 media + upload signing
scripts/
  analytics/          password-hash helper
  theater/            prepare.sh (ffmpeg), upload helpers, setup README
```

### Routes

Public: `/` · `/portfolio` · `/demos` · `/haven` · `/musicstrip` · `/congress`
· `/igadblock` · `/privacy` · `/terms` · `/accessibility` (+ per-app privacy
pages).

Private (unlinked, `noindex`, `Disallow`ed — reachable only if you know the URL):

| Route | What |
|-------|------|
| `/atlas` | Application tracker — jobs & labs, contacts, outreach, drafts |
| `/dashboard` | Visitor analytics dashboard |
| `/t` | **Theater** — synchronized watch page |
| `/u` | **Theater** — resumable uploader |

---

## Watch the same film from two places, in sync

`/t` (watch) and `/u` (upload) are a passphrase-gated, two-person cinema. Two
browsers, anywhere, stay frame-close in a normal `<video>` element — no screen
share, no re-encoding on the fly, no server streaming the bytes.

The hard part is that **two browsers will not stay in sync by being told "play
now."** They decode at different speeds, buffer differently, and their system
clocks disagree by seconds. So the server never issues commands.

**Anchored state, not commands.** A Cloudflare **Durable Object** (one instance
per movie slug, so both viewers land in the same object) holds the authoritative
truth as an *anchor*: *position `P` was true at server time `T`, and we are
playing.* It's broadcast over WebSocket. Each client computes where it *should*
be and steers itself there.

**Clock sync first.** Sync is meaningless until the two browsers agree on "now."
Each client runs an NTP-style ping/pong against the Durable Object — a burst of
five to converge fast, then a trickle every 10 s — and keeps the offset from the
**fastest** round trip only (a queued sample skews the estimate, and one bad
sample is worse than none).

**Steering, not jumping.** Correcting a 200 ms drift with a hard seek every time
would stutter constantly. Instead small errors are absorbed by nudging
`playbackRate` a few percent — inaudible, invisible, converges in a couple of
seconds. Only a gap too large to nudge away (> 1.5 s, i.e. a laptop slept) earns
a real seek. A live drift readout (green under 150 ms) sits in the controls.

Design consequences worth calling out:

- **No leader.** Either viewer can play, pause, or seek.
- **Self-healing.** A dropped message is corrected by the next anchor.
- **Seeks gate on both.** Jump to 1:20:00 and playback holds until *both*
  browsers report they've buffered it, so neither runs ahead.
- **Disconnect pauses.** If one side drops, playback halts rather than drifting
  twenty minutes apart.
- Plus in-room chat and subtitle (WebVTT) selection over the same socket.

**Storage & delivery — why it's free.** The movie lives in **Cloudflare R2**.
R2's egress is unmetered, so two people streaming an 8 GB film costs nothing,
every time. The video streams **browser → R2 directly**; the Worker only signs
requests and runs the room, so it never proxies gigabytes.

**Resumable uploads (`/u`).** A 9 GB upload from home internet has to survive a
failed part (retried with backoff), a dropped connection, and a closed tab. The
uploader uses **presigned S3-style multipart** straight to R2 with bounded
concurrency; the `uploadId` and each completed part are checkpointed in
`localStorage`, and only fully-finished parts are recorded — so a resume can
never assemble a corrupt object. Progress and a trailing-window speed readout
come from `XMLHttpRequest` (which, unlike `fetch`, exposes upload progress).

**Preparation (`scripts/theater/prepare.sh`).** Browsers won't reliably play
MKV/HEVC/AC3. `prepare.sh` normalizes a source to MP4 (H.264 + AAC + faststart):
a *lossless remux* in ~2 minutes when the source is already H.264/AAC, or a full
transcode (optionally via Apple VideoToolbox) otherwise, emitting the MP4, one
`.vtt` per subtitle track, and a `manifest.json` the player reads.

> Deploy notes for Theater live in `scripts/theater/README.md` and
> `workers/theater/wrangler.toml`. Note the Workers free plan requires
> `new_sqlite_classes` (not `new_classes`) for the Durable Object migration.

---

## Analytics & the application tracker (`workers/analytics`)

One Worker, backed by **D1**, does three jobs:

- **Visitor log** — the browser sends a fire-and-forget beacon to the Worker, so
  the Worker (not the site's server) sees the visitor's real IP and Cloudflare's
  edge geolocation. It records path, coarse location, ASN/network operator
  (with a heuristic residential/datacenter/mobile classifier), and a parsed
  user-agent. Read back at `/dashboard`.
- **Application tracker** — the `/atlas` CRUD API (`GET/POST /tracker`,
  `POST /tracker/delete`). Each entry (a job or lab, with contacts, outreach,
  draft emails, fit, and links) is stored as a JSON blob in an auto-created D1
  table. Full schema and the agent-facing API are documented in `TRACKER.md`.
- **Auth** — email + PBKDF2-SHA256 password check in constant time, returning an
  HMAC-signed, expiring, stateless session token. Secrets live only as Worker
  secrets, never in the repo.

---

## Local development

```bash
npm install
npm run dev      # Vite dev server
npm run build    # production build to dist/
npm run preview  # serve the built site
npm run lint
```

The site runs standalone; the private pages (`/atlas`, `/dashboard`, `/t`, `/u`)
need their Workers deployed and `VITE_ANALYTICS_URL` / the theater `WORKER` URL
pointed at them.

## Deployment

- **Site** → Vercel (static SPA; `vercel.json` rewrites all routes to
  `index.html`).
- **Workers** → Cloudflare:

  ```bash
  cd workers/analytics && npx wrangler deploy
  cd workers/theater   && npx wrangler deploy
  ```

  Set each Worker's secrets with `wrangler secret put` (see the `wrangler.toml`
  headers for the list). D1 tables and the tracker table are created on demand.

---

## Security & privacy

- No secrets in the client or the repo — passwords and signing keys are Worker
  secrets only.
- Private routes are unlinked, `noindex`, and `Disallow`ed; the tracker and
  dashboard additionally require the admin login.
- Production ships without source maps.
- The site sets no advertising or third-party tracking cookies. What the visitor
  log collects, and how to request deletion, is spelled out at `/privacy`.

