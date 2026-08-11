-- One row per page view. Apply with:
--   npx wrangler d1 execute analytics --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS visits (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  ts        INTEGER NOT NULL,   -- unix milliseconds
  ip        TEXT,
  country   TEXT,
  region    TEXT,
  city      TEXT,
  lat       REAL,
  lon       REAL,
  timezone  TEXT,
  asn       INTEGER,            -- autonomous system number
  org       TEXT,               -- network operator (Cloudflare asOrganization)
  net_type  TEXT,               -- residential | datacenter | mobile | education | corporate | unknown
  path      TEXT,
  referrer  TEXT,
  ua        TEXT,
  device    TEXT,               -- desktop | mobile | tablet | bot
  os        TEXT,               -- iOS | Android | Windows | macOS | Linux | ChromeOS
  browser   TEXT                -- Chrome | Safari | Firefox | Edge | ...
);

CREATE INDEX IF NOT EXISTS idx_visits_ts ON visits(ts);
CREATE INDEX IF NOT EXISTS idx_visits_ip ON visits(ip);
CREATE INDEX IF NOT EXISTS idx_visits_net ON visits(net_type);
