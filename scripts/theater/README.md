# Theater

Watch the same film from two places, in sync, in a browser, behind a passphrase.

The site stays on Vercel. Vercel can't do either of the two jobs this actually
needs — multi-gigabyte egress, and a WebSocket held open for two hours, which a
serverless function cannot do — so those move to Cloudflare. Nothing migrates.

| Piece | Where | Cost |
|---|---|---|
| Watch page (`/t`), upload page (`/u`) | Vercel, as today | free |
| Movie + subtitles | Cloudflare R2 | free to 10 GB, **egress always free** |
| Auth + sync room + upload signing | Cloudflare Worker + Durable Object | free to 100k req/day |

**Per movie, once set up:** run `prepare.sh` (one command), then drag the folder
into `/u`. Everything below step 5 is one-time.

R2's zero egress is the load-bearing fact. On S3 or Vercel, two people streaming
an 8 GB film costs real money every single time. On R2 it costs nothing, every
time, forever. Your home upload speed only matters during the one-time upload —
never during playback.

---

## Why it doesn't drift

Two browsers will not stay in sync by being told "play now". They decode at
different speeds, buffer differently, and their system clocks disagree.

So the Durable Object never says "play now". It publishes an **anchor**:
*position P was true at server time T, and we are playing.* Each client works out
where it should be and steers itself there — small errors get absorbed by nudging
`playbackRate` by a few percent, which is inaudible and converges in seconds.
Only a gap too large to nudge away (>1.5 s — a laptop slept) gets a hard seek.

Consequences worth knowing:

- **Nobody is the leader.** Either of you can pause, seek, or play.
- **A dropped message is self-healing.** The next anchor re-syncs you.
- **Seeks gate on both of you.** Jump to 1:20:00 and playback holds until both
  browsers report they've buffered it, so neither runs ahead.
- **If she disconnects, it pauses.** You don't end up twenty minutes apart.

The coloured dot in the controls is the live drift readout. Green is under 150 ms.

---

## Setup

### 1. Prepare the file

Browsers don't play MKV reliably — Chrome plays some, Safari plays none — and
high-quality rips are usually HEVC video with AC3/DTS audio that no browser
decodes. So normalise to MP4 once:

```bash
brew install ffmpeg jq          # or apt install
./scripts/theater/prepare.sh ~/Movies/film.mkv ./out
```

If the source is already H.264 + AAC this is a **lossless remux** — two minutes,
not a single pixel touched. If it's HEVC it transcodes, which takes hours on CPU.
The script tells you which is happening before it starts.

Subtitles: text tracks (SRT/ASS) convert to WebVTT automatically. **PGS/BluRay
subs are bitmaps**, not text — the script will tell you and suggest `pgsrip` for
OCR, or you drop a matching `.srt` into `./out` and re-run with `SKIP_VIDEO=1`.

Size guidance: CRF 18 at 1080p lands around 6–9 GB for a two-hour film, which is
visually transparent and fits the free tier. 4K remuxes (40 GB+) do not — they
still work, they just cost about $0.60/month in storage.

### 2. Cloudflare

Create an R2 bucket called `theater`, then an R2 **API token** (R2 → Manage API
Tokens → Object Read & Write). Put the credentials in `scripts/theater/.env`:

```bash
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=theater
```

**Set bucket CORS.** In R2 → Settings → CORS Policy:

```json
[{ "AllowedOrigins": ["https://portfolio.sladdagiri.org", "http://localhost:5173"],
   "AllowedMethods": ["GET", "HEAD", "PUT", "POST"],
   "AllowedHeaders": ["*"],
   "ExposeHeaders": ["etag", "content-length", "content-range", "accept-ranges"],
   "MaxAgeSeconds": 3600 }]
```

Two parts of this are load-bearing and fail in confusing ways if missed:

- **`ExposeHeaders` must include `etag`.** Multipart upload works by collecting
  each part's ETag and sending the list back to finalise the object. Without the
  header exposed, every part uploads successfully and the upload can never
  complete. The upload page detects this specific case and says so outright.
- **`GET`/`HEAD` and the range headers** are what subtitles and seeking need.
  Miss them and video plays while subtitles silently never appear.

### 3. Upload

Once the Worker is deployed (step 4), uploading is a web page — go to `/u`,
drag the `out/` folder in, press upload. It checks the folder has what it needs,
pushes straight to R2 with a progress bar and ETA, and prints the watch link.

The file goes **browser → R2 directly** via presigned multipart URLs; it never
passes through the Worker, so 9 GB costs about three Worker requests instead of
9 GB of Worker bandwidth.

It's also **resumable**. A 9 GB upload on home internet is an hour-plus and will
sometimes drop. The upload ID and the list of finished parts are kept in
`localStorage`, so reopening `/u` and picking the same folder offers to resume
rather than restart. Only fully-completed parts are recorded, so a resume can't
produce a corrupt file.

There's a CLI path too, if you'd rather not use the browser:

```bash
./scripts/theater/upload.sh ./out movie
```

### 4. Deploy the Worker

```bash
node scripts/theater/hash-pass.mjs "four random words you pick"
```

That prints three `wrangler secret put` commands — run them. The passphrase
itself never leaves your laptop; the Worker only ever stores a PBKDF2 hash at
210k iterations, so each brute-force guess costs a few hundred ms of CPU and
reading your Cloudflare env gets nobody in.

```bash
cd workers/theater
npm install
npx wrangler r2 bucket create theater      # if you didn't in the dashboard
echo '<account id>'  | npx wrangler secret put R2_ACCOUNT_ID
echo '<access key>'  | npx wrangler secret put R2_ACCESS_KEY_ID
echo '<secret key>'  | npx wrangler secret put R2_SECRET_ACCESS_KEY
npx wrangler deploy
```

### 5. Point the site at it

In Vercel → Settings → Environment Variables:

```
VITE_THEATER_WORKER = https://theater.<your-subdomain>.workers.dev
```

Redeploy. Then send her `https://portfolio.sladdagiri.org/t?m=movie` and the passphrase,
in separate messages. She needs nothing installed.

---

## Notes

**On how secret this is.** The passphrase is real protection. The URL is not —
treat `/t` as obscurity, not security. The page is `noindex`, carries
`Referrer-Policy: no-referrer` so the path doesn't leak into other sites' logs,
and is lazy-loaded so it isn't referenced in the main JS bundle at all. But
anything that reaches the browser can be found by someone determined. The
passphrase is what actually stands between the internet and the room.

**Presigned URLs are bearer tokens.** `/media` hands the browser a signed R2 URL
valid for 8 hours; anyone who gets that URL can stream the file until it expires.
That's the tradeoff that keeps playback off the Worker entirely — a two-hour film
costs about four Worker requests instead of one per seek. Shorten `URL_TTL` in
`src/index.js` if you'd rather.

**Storage housekeeping.** The free tier is 10 GB *stored*, not transferred. Keep
one film at a time and delete when done:

```bash
npx wrangler r2 object delete theater/movie/movie.mp4
```

**Multiple films.** Upload under different slugs and use `/t?m=<slug>`. Each slug
gets its own independent sync room automatically.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| Video plays, subtitles don't appear | R2 CORS not set (step 2). Check the browser console for a CORS error on the `.vtt`. |
| Upload says "ETag header is hidden" | `ExposeHeaders` in the bucket CORS policy is missing `etag`. Add it; the upload resumes rather than restarting. |
| Upload stalls near the end | That's the `complete` call assembling parts server-side. Give it a minute before assuming failure. |
| `/u` says "movie.mp4 missing" | You dropped the parent folder, not the `out/` folder `prepare.sh` wrote. |
| `no manifest for "movie"` | Upload didn't complete, or the slug doesn't match. `npx wrangler r2 object get theater/movie/manifest.json` |
| Deploy fails on the migration | `wrangler.toml` must say `new_sqlite_classes`, not `new_classes`. The free plan only offers SQLite-backed Durable Objects. |
| Black video, audio fine | Source was HEVC and the transcode was skipped. Re-run `prepare.sh` without `SKIP_VIDEO=1`. |
| Drift dot stays red | One side is bandwidth-starved and can't hold real-time. Re-encode at CRF 20–22. |
| Nothing plays until you click | Browser autoplay policy. That's what the "join" button is for — it banks the user gesture. |
