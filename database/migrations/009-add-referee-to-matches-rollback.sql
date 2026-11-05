-- Rollback migration 009 : Supprimer referee_id de matches
DROP INDEX IF EXISTS idx_matches_referee_id;
ALTER TABLE matches DROP CONSTRAINT IF EXISTS fk_matches_referee_id;
ALTER TABLE matches DROP COLUMN IF EXISTS referee_id;
