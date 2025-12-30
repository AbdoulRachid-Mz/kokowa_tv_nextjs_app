-- Migration: 001-ajouter-etat-initial-combattants
-- Description: Ajouter les champs fighter1_initial_state et fighter2_initial_state à la table matches
-- Date: 2025-12-26T20:29:45.811Z
-- Auteur: system

-- =============================================
-- MIGRATION: AJOUTER-ETAT-INITIAL-COMBATTANTS
-- =============================================

-- Écrivez vos commandes SQL de migration ici
-- Exemple: ALTER TABLE table_name ADD COLUMN new_column VARCHAR(255);

-- =============================================
-- FIN DE LA MIGRATION
-- =============================================

-- Migration: 002-ajouter-etat-initial-combattants
-- Description: Ajouter les champs fighter1_initial_state et fighter2_initial_state à la table matches
-- Date: 2024-01-15
-- Auteur: system

-- =============================================
-- MIGRATION: AJOUTER-ETAT-INITIAL-COMBATTANTS
-- =============================================

-- 1. Ajout des colonnes fighter1_initial_state et fighter2_initial_state
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS fighter1_initial_state VARCHAR(50),
ADD COLUMN IF NOT EXISTS fighter2_initial_state VARCHAR(50);

-- 2. Ajout des contraintes CHECK après l'ajout des colonnes
DO $$
BEGIN
    -- Pour fighter1_initial_state
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'matches_fighter1_initial_state_check'
    ) THEN
        ALTER TABLE matches 
        ADD CONSTRAINT matches_fighter1_initial_state_check 
        CHECK (fighter1_initial_state IN ('eliminated', 'not_eliminated'));
    END IF;

    -- Pour fighter2_initial_state
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'matches_fighter2_initial_state_check'
    ) THEN
        ALTER TABLE matches 
        ADD CONSTRAINT matches_fighter2_initial_state_check 
        CHECK (fighter2_initial_state IN ('eliminated', 'not_eliminated'));
    END IF;
END $$;

-- 3. Mettre à jour les valeurs existantes (optionnel)
-- Si vous voulez définir une valeur par défaut pour les lignes existantes
UPDATE matches 
SET 
    fighter1_initial_state = 'not_eliminated',
    fighter2_initial_state = 'not_eliminated'
WHERE fighter1_initial_state IS NULL 
   OR fighter2_initial_state IS NULL;

-- 4. Ajouter des index si nécessaire pour les performances
CREATE INDEX IF NOT EXISTS idx_matches_fighter1_state ON matches (fighter1_initial_state);
CREATE INDEX IF NOT EXISTS idx_matches_fighter2_state ON matches (fighter2_initial_state);

-- =============================================
-- FIN DE LA MIGRATION
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration 002-ajouter-etat-initial-combattants appliquée avec succès';
END $$;
