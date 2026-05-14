-- Rollback: 004-create-teams
-- Description: Drop team_members and team_achievements tables
-- Date: 2026-05-14T15:46:27Z

-- =============================================
-- ROLLBACK: CREATE-TEAMS
-- =============================================

DROP TABLE IF EXISTS team_achievements;
DROP TABLE IF EXISTS team_members;

-- =============================================
-- FIN DU ROLLBACK
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '🔄 Rollback de 004-create-teams terminé avec succès';
END $$;
