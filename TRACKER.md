# Atlas — application tracker

Atlas (`/atlas`) is a **private** page for tracking jobs and research labs Suraj
has applied to, plans to apply to, or wants to reach out to. It is not linked from
the site, not in the nav/footer, not in the sitemap, and is `noindex` — reachable
only by knowing the URL. It is also sign-in protected because it holds real
contacts and draft emails.

## For a person

Go to `/atlas`, sign in with the admin email + password (same as the dashboard),
then use the UI: **Add entry**, **Edit**, and **Delete** on each card, plus
search and type/status filters. **Export** downloads all entries as JSON.
Data is saved to the D1 database behind the analytics Worker, so it syncs across
devices and browsers.

## For an AI agent

Data lives in the Worker (`workers/analytics`), table `tracker` (one row per
entry, the entry stored as a JSON blob in the `data` column). Manage it through
the Worker's HTTP API. All tracker endpoints require a bearer token.

1. `POST {WORKER_URL}/login` with `{ "email", "password" }` → `{ "token" }`.
2. `GET  {WORKER_URL}/tracker`  (Authorization: Bearer <token>) → `{ "entries": [...] }`.
3. `POST {WORKER_URL}/tracker`  (Bearer) with an entry object → upserts it
   (matched by `id`; a new `id` is generated from the name if omitted).
4. `POST {WORKER_URL}/tracker/delete` (Bearer) with `{ "id" }` → removes it.

`WORKER_URL` is the analytics Worker (default `https://analytics.sladdagiri.workers.dev`).

## Entry schema

Only `name` is required; everything else is optional.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Stable id; generated from `name` if omitted. |
| `type` | string | `"job"` or `"lab"`. |
| `name` | string | Company or lab name. **Required.** |
| `org` | string | Parent organization / institution. |
| `role` | string | Role or position. |
| `location` | string | e.g. `"San Diego, CA"`. |
| `status` | string | `interested`, `to_apply`, `applied`, `interviewing`, `offer`, `rejected`, `closed`. |
| `priority` | string | `high`, `medium`, `low` (drives sort order). |
| `fit` | number | 0–3 self-assessed fit. |
| `link` | string | URL to the posting or lab site. |
| `appliedDate` / `deadline` | string | `YYYY-MM-DD`. |
| `angle` | string | Why you fit / your pitch. |
| `projects` | string[] | Projects/demos to prove fit. |
| `contacts` | object[] | `{ name, role, email, linkedin, note }`. |
| `outreach` | object[] | `{ channel, date, status, message }`. |
| `draftEmail` | string | A ready-to-send email. |
| `tags` | string[] | Free-form tags. |
| `notes` | string | Anything else. |

## Deploy note

The Worker auto-creates the `tracker` table on first use — no migration needed.
After pulling these changes, redeploy the Worker:

```
cd workers/analytics && npx wrangler deploy
```

`public/tracker.json` is no longer read by the app; it only exists as an optional
seed/backup target for the Export button.
