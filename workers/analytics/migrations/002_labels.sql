-- Per-IP nicknames set from the dashboard. Run once against the existing DB:
--   npx wrangler d1 execute analytics --remote --file=migrations/002_labels.sql

CREATE TABLE IF NOT EXISTS ip_labels (
  ip       TEXT PRIMARY KEY,
  nickname TEXT,
  updated  INTEGER
);
