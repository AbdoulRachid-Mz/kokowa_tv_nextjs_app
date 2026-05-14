-- Rollback: 005-update-teams-schema
-- Description: Revert changes to team_members table
-- Date: 2026-05-14T17:15:00Z

-- =============================================
-- ROLLBACK: UPDATE-TEAMS-SCHEMA
-- =============================================

ALTER TABLE team_members 
DROP COLUMN IF EXISTS first_name,
DROP COLUMN IF EXISTS last_name,
DROP COLUMN IF EXISTS nickname,
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS phone,
DROP COLUMN IF EXISTS department,
DROP COLUMN IF EXISTS specialization,
DROP COLUMN IF EXISTS profile_image,
DROP COLUMN IF EXISTS cover_image,
DROP COLUMN IF EXISTS quote,
DROP COLUMN IF EXISTS availability;

-- =============================================
-- FIN DU ROLLBACK
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '🔄 Rollback de 005-update-teams-schema terminé avec succès';
END $$;
