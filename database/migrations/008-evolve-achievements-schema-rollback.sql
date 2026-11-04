-- ============================================================================
-- Migration Rollback: 008-evolve-achievements-schema-rollback.sql
-- Description: Annulation de l'évolution du schéma de fighter_achievements
-- Date: 2026-11-04
-- ============================================================================

DROP INDEX IF EXISTS uq_fighter_achievements_region_edition_pos;
DROP INDEX IF EXISTS uq_fighter_achievements_fighter_edition_pos;
DROP INDEX IF EXISTS idx_fighter_achievements_region_position;
DROP INDEX IF EXISTS idx_fighter_achievements_match_id;
DROP INDEX IF EXISTS idx_fighter_achievements_entity_type;

ALTER TABLE fighter_achievements DROP CONSTRAINT IF EXISTS chk_fighter_achievements_entity_type;
ALTER TABLE fighter_achievements DROP CONSTRAINT IF EXISTS fk_fighter_achievements_match_id;

-- Supprimer les enregistrements non-lutteurs créés par la migration
DELETE FROM fighter_achievements WHERE entity_type != 'fighter' OR fighter_id IS NULL;

ALTER TABLE fighter_achievements ALTER COLUMN fighter_id SET NOT NULL;
ALTER TABLE fighter_achievements ALTER COLUMN region_id SET NOT NULL;

ALTER TABLE fighter_achievements DROP COLUMN IF EXISTS other_actor_role;
ALTER TABLE fighter_achievements DROP COLUMN IF EXISTS other_actor_name;
ALTER TABLE fighter_achievements DROP COLUMN IF EXISTS match_id;
ALTER TABLE fighter_achievements DROP COLUMN IF EXISTS entity_type;
