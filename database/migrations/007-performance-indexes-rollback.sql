-- Migration Rollback: 007-performance-indexes-rollback
-- Description: Suppression des index de performance
-- Date: 2026-10-22

DROP INDEX IF EXISTS idx_edition_fighters_edition_eliminated;
DROP INDEX IF EXISTS idx_matches_sub_group_status;
DROP INDEX IF EXISTS idx_sub_groups_group_id;
DROP INDEX IF EXISTS idx_users_auth_id;
DROP INDEX IF EXISTS idx_interactions_user_entity;
DROP INDEX IF EXISTS idx_messages_entity;

DO $$
BEGIN
    RAISE NOTICE '✅ Rollback 007-performance-indexes appliqué avec succès';
END $$;
