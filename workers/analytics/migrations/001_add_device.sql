-- Adds device / OS / browser columns to an already-created visits table.
-- Run once against the existing database:
--   npx wrangler d1 execute analytics --remote --file=migrations/001_add_device.sql
-- Rows logged before this migration keep NULL in these columns.

ALTER TABLE visits ADD COLUMN device TEXT;
ALTER TABLE visits ADD COLUMN os TEXT;
ALTER TABLE visits ADD COLUMN browser TEXT;
