-- Rollback: 006-add-type-to-achievements
-- Description: Supprimer la colonne type de la table fighter_achievements
-- Date: 2026-06-23

ALTER TABLE fighter_achievements DROP COLUMN IF EXISTS type;

DO $$
BEGIN
    RAISE NOTICE '🔄 Rollback de 006-add-type-to-achievements terminé avec succès';
END $$;
