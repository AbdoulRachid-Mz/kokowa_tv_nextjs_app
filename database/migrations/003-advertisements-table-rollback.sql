-- Rollback: 003-advertisements-table
-- Description: Suppression de la table de gestion des publicités
-- Date: 2024-01-22T10:00:00.000Z

-- =============================================
-- ROLLBACK: SUPPRESSION TABLE ADVERTISEMENTS
-- =============================================

-- Supprimer d'abord les index (optionnel car ils seront supprimés avec la table)
DROP INDEX IF EXISTS idx_advertisements_position;
DROP INDEX IF EXISTS idx_advertisements_active;
DROP INDEX IF EXISTS idx_advertisements_priority;
DROP INDEX IF EXISTS idx_advertisements_date_range;
DROP INDEX IF EXISTS idx_advertisements_advertiser;

-- Supprimer le trigger
DROP TRIGGER IF EXISTS update_advertisements_updated_at ON advertisements;

-- Supprimer la table
DROP TABLE IF EXISTS advertisements CASCADE;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '🔄 Rollback de 004-advertisements-table terminé avec succès';
END $$;