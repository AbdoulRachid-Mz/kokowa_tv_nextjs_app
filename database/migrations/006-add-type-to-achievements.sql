-- Migration: 006-add-type-to-achievements
-- Description: Ajouter la colonne type à la table fighter_achievements
-- Date: 2026-06-23

ALTER TABLE fighter_achievements ADD COLUMN type VARCHAR(50) CHECK (
    type IN (
        'competition',
        'kirari',
        'fair-play',
        'point',
        'walki',
        'dance',
        'tchali_tchali',
        'once_beat',
        'best_beaten',
        'other'
    )
) DEFAULT 'other';

DO $$
BEGIN
    RAISE NOTICE '✅ Migration 006-add-type-to-achievements appliquée avec succès';
END $$;
