# Atlas — application tracker data

Atlas (`/atlas`) is a **private** page that tracks jobs and research labs Suraj
has applied to, plans to apply to, or is interested in. It is not linked from the
site, not in the nav or footer, not in the sitemap, and is set to `noindex` — you
can only reach it by knowing the URL (`/atlas`).

## How to update it (humans and AI agents)

**All data lives in one file:** `public/tracker.json`. Edit that file — nothing
else. The page loads it at runtime, so a change appears on the next deploy (or
immediately on refresh in local dev). You do **not** need to touch any React code
to add, edit, or remove entries.

`public/tracker.json` is a single JSON object:

```json
{ "entries": [ /* array of entry objects, newest or highest priority first */ ] }
```

Keep it **valid JSON** (double-quoted keys and strings, no comments, no trailing
commas). If the JSON is malformed the page shows an error instead of the list.

## Entry schema

Every field except `id`, `type`, `name`, and `status` is optional — include only
what you have. Unknown/empty fields are simply not shown.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Unique slug, e.g. `"salk-talmo-lab"`. Required. |
| `type` | string | `"job"` or `"lab"`. Required. |
| `name` | string | Company or lab name. Required. |
| `org` | string | Parent organization / institution, e.g. `"UC San Diego"`. |
| `role` | string | Role or position, e.g. `"iOS Engineer"`, `"Research Associate"`. |
| `location` | string | e.g. `"San Diego, CA"` or `"Remote"`. |
| `status` | string | One of: `interested`, `to_apply`, `applied`, `interviewing`, `offer`, `rejected`, `closed`. Required. |
| `priority` | string | `high`, `medium`, or `low`. Controls sort order. |
| `fit` | number | 1–3, self-assessed fit (3 = strongest). |
| `link` | string | URL to the posting or lab site. |
| `appliedDate` | string | `YYYY-MM-DD`. |
| `deadline` | string | `YYYY-MM-DD`. |
| `angle` | string | One or two sentences: why you fit / your pitch. |
| `projects` | string[] | Projects or demos you can build/show to prove fit. |
| `contacts` | object[] | People to reach: `{ "name", "role", "email", "linkedin", "note" }`. |
| `outreach` | object[] | Messages sent/planned: `{ "channel", "date", "status", "message" }`. `channel` e.g. `email`/`linkedin`; `status` e.g. `sent`/`replied`/`draft`. |
| `draftEmail` | string | A ready-to-send email you can copy. |
| `tags` | string[] | Free-form tags, e.g. `["iOS", "wearables"]`. |
| `notes` | string | Anything else. |

## Example entry

```json
{
  "id": "example-lab",
  "type": "lab",
  "name": "Example Lab",
  "org": "UC San Diego",
  "role": "Research Associate",
  "location": "La Jolla, CA",
  "status": "to_apply",
  "priority": "high",
  "fit": 3,
  "link": "https://example.edu/lab",
  "appliedDate": "",
  "deadline": "2026-10-01",
  "angle": "Their on-device ML + wearables work maps directly onto HAVEN.",
  "projects": ["A SLEAP-style pose-tracking demo", "A BLE sensor logger app"],
  "contacts": [
    { "name": "Dr. Jane Doe", "role": "PI", "email": "jane@example.edu", "linkedin": "", "note": "Advised a related project." }
  ],
  "outreach": [
    { "channel": "email", "date": "", "status": "draft", "message": "" }
  ],
  "draftEmail": "Hi Dr. Doe, I'm a UC San Diego senior who ships iOS + on-device ML ...",
  "tags": ["on-device ML", "wearables"],
  "notes": "Check whether they hire post-bacc RAs."
}
```

To add an entry, append an object like this to the `entries` array in
`public/tracker.json`. To edit or remove one, change or delete its object.
