-- Migration Rollback: 010-performance-indexes-2-rollback
-- Description: Suppression des index complémentaires de performance
-- Date: 2026-11-06

DROP INDEX IF EXISTS idx_fighter_cards_match_id;
DROP INDEX IF EXISTS idx_matches_fighter1_id;
DROP INDEX IF EXISTS idx_matches_fighter2_id;
DROP INDEX IF EXISTS idx_matches_match_date;
DROP INDEX IF EXISTS idx_edition_regions_region_id;
DROP INDEX IF EXISTS idx_edition_fighters_fighter_id;
DROP INDEX IF EXISTS idx_fighter_transfers_fighter_id;
DROP INDEX IF EXISTS idx_fighter_transfers_from_region;
DROP INDEX IF EXISTS idx_fighter_transfers_to_region;
DROP INDEX IF EXISTS idx_interactions_entity_created;
DROP INDEX IF EXISTS idx_messages_entity_created;
DROP INDEX IF EXISTS idx_media_entity;
DROP INDEX IF EXISTS idx_articles_status_published;
DROP INDEX IF EXISTS idx_sub_groups_main_referee;
DROP INDEX IF EXISTS idx_referees_region_active;
DROP INDEX IF EXISTS idx_advertisements_active_position;
DROP INDEX IF EXISTS idx_team_achievements_member;
DROP INDEX IF EXISTS idx_fighter_achievements_fighter;
DROP INDEX IF EXISTS idx_phases_edition_order;
DROP INDEX IF EXISTS idx_phase_groups_phase_order;
DROP INDEX IF EXISTS idx_competition_editions_competition_year;

DO $$
BEGIN
    RAISE NOTICE 'Rollback 010-performance-indexes-2 applique avec succes';
END $$;
