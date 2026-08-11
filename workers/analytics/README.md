# Analytics — private visitor log

A Cloudflare Worker plus a D1 database that logs every page view on the site,
and a password-gated dashboard at `/secret` that shows the data.

For each visit it records the IP, the location (country / region / city), the
network operator, and a best-guess classification of the network:
`residential`, `datacenter`, `mobile`, `education`, `corporate`, or `unknown`.
For anything that is not residential, the dashboard shows the organization the
IP belongs to (Cloudflare's `asOrganization` for that network).

The IP and geolocation come from Cloudflare's edge, because the browser sends
the beacon straight to the Worker. There is no third-party analytics service and
no client-side IP lookup.

## What's here

- `src/index.js` — the Worker: `/collect`, `/login`, `/stats`.
- `schema.sql` — the D1 table.
- `wrangler.toml` — config. Fill in the D1 id; set secrets separately.

## Deploy

From `workers/analytics/`:

```bash
# 1. Create the database, then paste the printed database_id into wrangler.toml
npx wrangler d1 create analytics

# 2. Create the table
npx wrangler d1 execute analytics --remote --file=schema.sql

# 3. Set the login secrets. Run the hash script from the repo root:
#      node scripts/analytics/hash-pass.mjs "suraj123"
#    It prints three `wrangler secret put` commands. Run them here.
#    (ADMIN_EMAIL is already set to suraj@sladdagiri.org in wrangler.toml.)

# 4. Deploy
npx wrangler deploy
```

`wrangler deploy` prints the Worker URL (something like
`https://analytics.<your-subdomain>.workers.dev`). Two more steps:

- Point the site at it. Set `VITE_ANALYTICS_URL` to that URL in your Vercel
  project's Environment Variables, then redeploy the site. (Or edit the fallback
  in `src/analytics.js`.)
- Confirm `ALLOWED_ORIGIN` in `wrangler.toml` matches your live site origin
  exactly, or the beacon fails CORS and nothing gets logged.

## The password

The default password is `suraj123`. It is short and easy to guess, and the
dashboard sits on the public internet, so anyone who finds the URL can try
passwords against it. PBKDF2 slows each guess, but a longer password is the real
protection. To change it, run the hash script with a new value and re-set the
three secrets.

The Worker never stores the plaintext password. It stores only the PBKDF2 hash
and salt, and it compares in constant time. Session tokens are HMAC-signed and
expire after 12 hours.

## A note on privacy

This logs full IP addresses, which are personal data under GDPR and CCPA. That
is fine for a personal site, but if you ever collect for anyone else or operate
at scale, you would need a privacy notice and a way to honor deletion requests.
The `visits` table is easy to prune:

```bash
npx wrangler d1 execute analytics --remote \
  --command "DELETE FROM visits WHERE ts < strftime('%s','now','-90 days')*1000"
```
