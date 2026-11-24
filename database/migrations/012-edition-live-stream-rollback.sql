-- Rollback: 012-edition-live-stream

ALTER TABLE competition_editions
  DROP COLUMN IF EXISTS live_url,
  DROP COLUMN IF EXISTS live_title,
  DROP COLUMN IF EXISTS live_started_at;
